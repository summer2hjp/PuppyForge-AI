#!/usr/bin/env python3
"""改进版：自动识别项目内部模块"""

import ast
import sys
import re
import argparse
from pathlib import Path
from typing import Set, Dict, List, Tuple

def find_imports(file_path: Path) -> Set[str]:
    """解析 Python 文件，找出所有导入的模块"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read())
    except (SyntaxError, UnicodeDecodeError):
        return set()
    
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.add(alias.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.add(node.module.split('.')[0])
    return imports

def get_stdlib_modules() -> Set[str]:
    """获取标准库模块列表"""
    if hasattr(sys, 'stdlib_module_names'):
        return set(sys.stdlib_module_names)
    return set(sys.builtin_module_names)

def get_project_modules(project_dir: Path) -> Set[str]:
    """自动识别项目内部模块"""
    project_modules = set()
    
    # 1. 从包结构识别（包含 __init__.py 的目录）
    for init_file in project_dir.rglob('__init__.py'):
        if any(part in init_file.parts for part in ['venv', '.venv', '__pycache__', '.git']):
            continue
        rel_path = init_file.parent.relative_to(project_dir)
        if str(rel_path) != '.':
            package_name = str(rel_path).replace('/', '.').replace('\\', '.')
            project_modules.add(package_name)
            project_modules.add(package_name.split('.')[0])
    
    # 2. 从顶级 .py 文件识别
    for py_file in project_dir.glob('*.py'):
        if py_file.stem != '__init__':
            project_modules.add(py_file.stem)
    
    # 3. 识别项目根目录名
    project_modules.add(project_dir.name)
    
    return project_modules

def parse_requirements(requirements_file: Path) -> Tuple[Dict[str, str], List[str]]:
    """解析 requirements.txt"""
    packages = {}
    original_lines = []
    
    if not requirements_file.exists():
        return packages, original_lines
    
    with open(requirements_file, 'r', encoding='utf-8') as f:
        for line in f:
            original_lines.append(line.rstrip('\n'))
            stripped = line.strip()
            
            if not stripped or stripped.startswith('#') or stripped.startswith('-'):
                continue
            
            match = re.match(r'^([a-zA-Z0-9._-]+)', stripped)
            if match:
                pkg_name = match.group(1)
                pkg_normalized = pkg_name.lower().replace('_', '-').replace('.', '-')
                packages[pkg_normalized] = pkg_name
    
    return packages, original_lines

def normalize_package_name(name: str) -> str:
    """标准化包名"""
    return name.lower().replace('_', '-').replace('.', '-')

def get_known_mappings() -> Dict[str, str]:
    """已知的导入名到 pip 包名的映射"""
    return {
        'PIL': 'pillow',
        'yaml': 'pyyaml',
        'cv2': 'opencv-python',
        'bs4': 'beautifulsoup4',
        'sklearn': 'scikit-learn',
        'jose': 'python-jose',
        'dotenv': 'python-dotenv',
        'prometheus_client': 'prometheus-client',
        'prometheus_fastapi_instrumentator': 'prometheus-fastapi-instrumentator',
        'opentelemetry': 'opentelemetry-api',
        'qdrant_client': 'qdrant-client',
        'psycopg2': 'psycopg2-binary',
        'passlib': 'passlib[bcrypt]',
    }

def get_common_packages() -> Dict[str, str]:
    """常用包及其推荐版本"""
    return {
        'python-jose': 'python-jose[cryptography]==3.3.0',
        'passlib': 'passlib[bcrypt]==1.7.4',
        'python-multipart': 'python-multipart==0.0.9',
        'pytest': 'pytest==8.3.4',
        'pytest-asyncio': 'pytest-asyncio==0.24.0',
        'pytest-mock': 'pytest-mock==3.14.0',
        'pytest-cov': 'pytest-cov==6.0.0',
        'alembic': 'alembic>=1.13.0',
        'email-validator': 'email-validator>=2.1.0',
    }

def add_missing_to_requirements(requirements_file: Path, missing_packages: List[str], 
                                dry_run: bool = False):
    """添加缺失的包到 requirements.txt"""
    if not missing_packages:
        print("✅ 没有缺失的包")
        return
    
    with open(requirements_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    common_packages = get_common_packages()
    
    new_lines = ["\n# 🔧 Auto-added missing dependencies\n"]
    
    for pkg in missing_packages:
        if pkg in common_packages:
            new_lines.append(f"{common_packages[pkg]}\n")
        else:
            new_lines.append(f"{pkg}\n")
    
    new_content = content.rstrip('\n') + "\n" + "".join(new_lines)
    
    if dry_run:
        print("\n📝 将要添加的内容:")
        print("-" * 60)
        print("".join(new_lines))
        print("-" * 60)
        return
    
    import shutil
    backup_file = requirements_file.with_suffix('.txt.bak')
    shutil.copy2(requirements_file, backup_file)
    print(f"📦 已备份原文件到: {backup_file}")
    
    with open(requirements_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ 已添加 {len(missing_packages)} 个缺失的包到 {requirements_file}")
    print("\n📝 添加的包:")
    for pkg in missing_packages:
        print(f"  + {pkg}")

def main():
    parser = argparse.ArgumentParser(description='比较代码导入和 requirements.txt，找出缺失的依赖')
    parser.add_argument('--update', '-u', action='store_true', 
                       help='自动添加缺失的包到 requirements.txt')
    parser.add_argument('--dry-run', '-n', action='store_true',
                       help='仅显示将要添加的包，不实际修改文件')
    parser.add_argument('--dir', '-d', type=str, default='.',
                       help='要扫描的目录（默认当前目录）')
    
    args = parser.parse_args()
    
    # 获取项目根目录
    backend_dir = Path(args.dir).resolve()
    if not (backend_dir / 'main.py').exists():
        if (backend_dir / 'backend').exists():
            backend_dir = backend_dir / 'backend'
    
    print(f"📂 扫描目录: {backend_dir}")
    print("=" * 60)
    
    # 1. 获取项目内部模块
    project_modules = get_project_modules(backend_dir)
    print(f"📦 项目内部模块: {sorted(project_modules)}")
    
    # 2. 扫描所有 Python 文件中的导入
    stdlib = get_stdlib_modules()
    known_mappings = get_known_mappings()
    
    all_imports = set()
    
    for py_file in backend_dir.rglob('*.py'):
        if any(part in py_file.parts for part in ['venv', '.venv', '__pycache__', '.git']):
            continue
        if 'test' in py_file.parts:
            continue
        
        imports = find_imports(py_file)
        if imports:
            all_imports.update(imports)
    
    # 3. 过滤出第三方包（排除标准库和项目内部模块）
    third_party = set()
    for imp in sorted(all_imports):
        if imp not in stdlib and imp not in project_modules:
            top_level = imp.split('.')[0]
            if top_level not in stdlib and top_level not in project_modules:
                third_party.add(top_level)
    
    # 4. 解析 requirements.txt
    requirements_file = backend_dir / 'requirements.txt'
    if not requirements_file.exists():
        requirements_file = backend_dir.parent / 'requirements.txt'
    
    if not requirements_file.exists():
        print("❌ 找不到 requirements.txt")
        sys.exit(1)
    
    print(f"📄 依赖文件: {requirements_file}")
    print("=" * 60)
    
    installed_packages, _ = parse_requirements(requirements_file)
    
    # 5. 比较并找出缺失的包
    print("\n📊 检查结果:")
    print("-" * 60)
    
    found_count = 0
    missing_packages = []
    
    for imp in sorted(third_party):
        imp_normalized = normalize_package_name(imp)
        pkg_name = known_mappings.get(imp, imp)
        pkg_normalized = normalize_package_name(pkg_name)
        
        if imp_normalized in installed_packages or pkg_normalized in installed_packages:
            print(f"  ✅ {imp} (pip: {pkg_name})")
            found_count += 1
        else:
            print(f"  ❌ {imp} (pip: {pkg_name}) - 缺失")
            missing_packages.append(pkg_name)
    
    # 6. 输出摘要
    print("\n" + "=" * 60)
    print(f"📈 统计: 共 {len(third_party)} 个第三方包, "
          f"已包含 {found_count} 个, 缺失 {len(missing_packages)} 个")
    
    if missing_packages:
        if args.update or args.dry_run:
            add_missing_to_requirements(requirements_file, missing_packages, 
                                       dry_run=args.dry_run)
        else:
            print("\n🔴 缺失的包 (需要添加到 requirements.txt):")
            print("-" * 60)
            for pkg in missing_packages:
                print(f"  {pkg}")
            
            print("\n💡 要自动添加缺失的包，运行:")
            print(f"  python3 {__file__} --update")
            print(f"  或先预览: python3 {__file__} --dry-run")
        
        sys.exit(1)
    else:
        print("\n✅ 所有依赖都已包含在 requirements.txt 中！")
        sys.exit(0)

if __name__ == '__main__':
    main()
