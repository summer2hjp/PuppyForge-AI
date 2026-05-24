# PuppyForge AI - Supabase Database Setup

## 激进特性
- **不可变日志**：所有关键健康事件用区块链风格哈希链记录，永久不可篡改
- **多Agent集成**：每个Agent的诊断/预测/成长输出都记录进immutable日志
- **照片存储**：结合 Supabase Storage

## 初始化命令
```bash
supabase db push
# 或直接在Supabase Dashboard执行 schema.sql
```

## RLS 安全策略
所有表均启用Row Level Security，只允许主人访问自己的狗狗数据。