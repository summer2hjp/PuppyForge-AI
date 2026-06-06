#!/usr/bin/env python3
"""
PuppyForge AI - 认证系统完整测试脚本

测试范围:
  1. 基础功能: 注册 → 登录 → /me → 登出
  2. 边界情况: 空密码、重复注册、无效Token、不存在用户
  3. 核心安全函数: bcrypt密码哈希、JWT签发/验证

前提: 后端容器运行中 (docker compose up -d backend)
"""

import json
import time
import sys
import httpx

API_BASE = "http://localhost:8000/api/v1/auth"

passed = 0
failed = 0


def check(description: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✅ {description}")
    else:
        failed += 1
        print(f"  ❌ {description} — {detail}")


def api(method: str, path: str, expect: int = 200, **kwargs):
    """调用 API 并检查预期状态码"""
    url = f"{API_BASE}{path}"
    try:
        resp = httpx.request(method, url, **kwargs, timeout=10)
    except httpx.ConnectError:
        check(f"{method} {path} — 连接失败", False, "后端服务未运行")
        return None, 0
    except Exception as e:
        check(f"{method} {path} — 请求异常", False, str(e))
        return None, 0

    ok = resp.status_code == expect
    try:
        data = resp.json()
    except Exception:
        data = resp.text[:300]
    return data, resp.status_code


def run_tests():
    global passed, failed
    passed = 0
    failed = 0

    print("=" * 65)
    print("  🐕 PuppyForge AI — 认证系统完整测试")
    print("=" * 65)

    # ============================
    # 第一部分: 健康检查
    # ============================
    print("\n📋 [1/6] 环境检查")
    try:
        h = httpx.get("http://localhost:8000/health", timeout=5)
        check("后端服务在线", h.status_code == 200, f"HTTP {h.status_code}")
    except httpx.ConnectError:
        check("后端服务在线", False, "无法连接 localhost:8000")
        print("\n请先运行: docker compose up -d backend\n")
        sys.exit(1)

    # ============================
    # 第二部分: 注册流程
    # ============================
    print("\n📋 [2/6] 注册流程")

    # 2a - 正常注册 (始终使用新邮箱避免重复)
    import time
    fresh_email = f"e2e{int(time.time())}@puppyforge.ai"
    d, _ = api("POST", "/register", json={
        "email": fresh_email,
        "password": "TestPass123!",
        "full_name": "端到端测试用户"
    })
    if d and "token" in d:
        check("正常注册 — 获取token", True)
        check("注册返回用户信息", "email" in d.get("user", {}))
        token_a = d["token"]
    else:
        check("正常注册", False, str(d)[:200] if d else "无响应")
        if d and "已被注册" in str(d):
            d2, _ = api("POST", "/login", json={
                "email": fresh_email,
                "password": "TestPass123!"
            })
            token_a = d2.get("token", "") if d2 else ""
            check("使用已有用户登录", bool(token_a), "获取token失败")
        else:
            token_a = ""

    # 2b - 重复注册 (用刚注册的邮箱)
    d, code = api("POST", "/register", json={
        "email": fresh_email,
        "password": "TestPass123!",
        "full_name": "重复用户"
    }, expect=400)
    check("重复注册 — 拒绝", code == 400, f"HTTP {code}")

    # 2c - 空密码注册 (Pydantic min_length=6 报 422)
    d, code = api("POST", "/register", json={
        "email": "blankpass@puppyforge.ai",
        "password": ""
    }, expect=422)
    check("空密码注册 — Pydantic拒绝", code == 422, f"HTTP {code}")

    # 2d - 短密码 (少于6位，Pydantic 报 422)
    d, code = api("POST", "/register", json={
        "email": "short@puppyforge.ai",
        "password": "123"
    }, expect=422)
    check("短密码注册 (<6位) — Pydantic拒绝", code == 422, f"HTTP {code}")

    # ============================
    # 第三部分: 登录流程
    # ============================
    print("\n📋 [3/6] 登录流程")

    # login email — use the same one from registration
    login_email = locals().get("fresh_email", "e2e@puppyforge.ai")

    # 3a - 正确密码登录
    d, code = api("POST", "/login", json={
        "email": login_email,
        "password": "TestPass123!"
    })
    if d and "token" in d:
        check("正确密码 — 登录成功", True)
        token_b = d["token"]
        # 验证 token 格式 (JWT 三部分)
        check("Token格式正确 (JWT)", len(token_b.split(".")) == 3)
    else:
        check("正确密码 — 登录成功", False, str(d)[:200] if d else "无响应")
        token_b = token_a

    # 3b - 错误密码
    d, code = api("POST", "/login", json={
        "email": login_email,
        "password": "wrong_password"
    }, expect=401)
    check("错误密码 — 拒绝", code == 401, f"HTTP {code}")
    check("错误密码 — 统一错误信息", d and "邮箱或密码错误" in str(d.get("detail", "")))

    # 3c - 不存在用户
    d, code = api("POST", "/login", json={
        "email": "unknown@test.com",
        "password": "somepass123"
    }, expect=401)
    check("不存在用户 — 拒绝", code == 401, f"HTTP {code}")
    check("不存在用户 — 统一错误信息", d and "邮箱或密码错误" in str(d.get("detail", "")))

    # 3d - 空密码登录 (Pydantic min_length=6 报 422)
    d, code = api("POST", "/login", json={
        "email": login_email if "login_email" in dir() else "e2e@puppyforge.ai",
        "password": ""
    }, expect=422)
    check("空密码登录 — Pydantic拒绝", code == 422, f"HTTP {code}")

    # ============================
    # 第四部分: 会话/授权
    # ============================
    print("\n📋 [4/6] 会话与授权")

    # 使用最新 token
    token = token_b or token_a

    # 4a - /me 正常
    d, code = api("GET", "/me", headers={"Authorization": f"Bearer {token}"})
    check("/me 获取用户信息", code == 200, f"HTTP {code}")
    if d:
        check(f"  → 用户: {d.get('email', '?')} / 角色: {d.get('role', '?')}", True)

    # 4b - /me 无 token (Bearer scheme 返回 401/403)
    d, code = api("GET", "/me", expect=401)
    check("/me 无Token — 拒绝", code == 403 or code == 401, f"HTTP {code}")

    # 4c - /me 无效 token
    d, code = api("GET", "/me",
                  headers={"Authorization": "Bearer invalid_jwt_token_here"},
                  expect=401)
    check("/me 无效Token — 拒绝", code == 401, f"HTTP {code}")

    # 4d - /me 过期 token (伪造)
    d, code = api("GET", "/me",
                  headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"},
                  expect=401)
    check("/me 伪造Token — 拒绝", code == 401, f"HTTP {code}")

    # 4e - logout
    d, code = api("POST", "/logout",
                  headers={"Authorization": f"Bearer {token}"})
    check("登出 — 成功", code == 200, f"HTTP {code}")

    # 4f - refresh (not implemented)
    d, code = api("POST", "/refresh", json={"refreshToken": "xxx"}, expect=501)
    check("Refresh Token — 501 未实现", code == 501, f"HTTP {code}")

    # ============================
    # 第五部分: 第三方登录端点
    # ============================
    print("\n📋 [5/6] 第三方登录端点")

    # 5a - Google 登录入口
    d, code = api("GET", "/google/login")
    if d and "url" in d:
        check("Google 登录 — 返回授权URL", True)
        check("  → URL 包含 accounts.google.com", "accounts.google.com" in d["url"])
    else:
        check("Google 登录 — 返回结果", False, str(d)[:200] if d else "无响应")

    # 5b - GitHub 登录入口 (有凭据时 307 重定向到 GitHub)
    d, code = api("GET", "/github/login", expect=307)
    check("GitHub 登录 — 跳转至 GitHub 授权页", code == 307, f"HTTP {code}")

    # 5c - Google callback 测试 (空 code → Google返回错误 → 400)
    d, code = api("GET", "/google/callback?code=", expect=400)
    check("Google Callback — 空code返回错误", code == 400, f"HTTP {code}")

    # ============================
    # 第六部分: 综合场景
    # ============================
    print("\n📋 [6/6] 综合场景")

    # 6a - 注册新用户 → 登出 → 重新登录 → /me
    new_email = f"fullcycle{int(time.time())}@puppyforge.ai"
    d, _ = api("POST", "/register", json={
        "email": new_email,
        "password": "CyclePass456!",
        "full_name": "全流程用户"
    })
    if d and "token" in d:
        t1 = d["token"]
        # 登出
        api("POST", "/logout", headers={"Authorization": f"Bearer {t1}"})
        # 重新登录
        d2, _ = api("POST", "/login", json={
            "email": new_email,
            "password": "CyclePass456!"
        })
        if d2 and "token" in d2:
            t2 = d2["token"]
            d3, _ = api("GET", "/me", headers={"Authorization": f"Bearer {t2}"})
            is_same = d3 and d3.get("email") == new_email
            check("注册→登出→重新登录→/me 完整链路", is_same,
                  f"email: {d3.get('email', '?') if d3 else '?'} != {new_email}")
        else:
            check("注册→登出→重新登录→/me 完整链路", False,
                  "重新登录失败")
    else:
        check("注册→登出→重新登录→/me 完整链路", False,
              "初始注册失败")

    # ============================
    # 汇总
    # ============================
    print(f"\n{'=' * 65}")
    total = passed + failed
    if failed == 0:
        print(f"  🎉 全部 {passed}/{passed} 测试通过!")
    else:
        print(f"  ⚠️  通过: {passed}/{total}  |  失败: {failed}/{total}")
    print(f"{'=' * 65}\n")
    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
