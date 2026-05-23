# Supabase Schema for PuppyForge AI

## 数据库设计哲学
激进、不可篡改、健康数据即生命。

使用 Row Level Security (RLS) + 区块链风格不可变日志。

## Tables

### 1. puppies (宠物主表)
```sql
create table puppies (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users,
  name text not null,
  breed text,
  birth_date date,
  gender text,
  weight_kg numeric,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table puppies enable row level security;
create policy "Users can only see their own puppies" on puppies for all using (auth.uid() = owner_id);
```

### 2. health_records (核心健康记录)
```sql
create table health_records (
  id uuid primary key default uuid_generate_v4(),
  puppy_id uuid references puppies(id) on delete cascade,
  record_type text not null, -- 'weight', 'vaccination', 'symptom', 'diagnosis', 'medication', 'fecal', 'skin'
  title text,
  description text,
  data jsonb, -- 灵活存储照片URL、症状细节等
  recorded_at timestamp default now(),
  created_by uuid references auth.users
);

alter table health_records enable row level security;
create policy "Owner access" on health_records for all using (
  exists (select 1 from puppies where id = puppy_id and owner_id = auth.uid())
);
```

### 3. immutable_health_logs (区块链风格不可变日志)
```sql
create table immutable_health_logs (
  id uuid primary key default uuid_generate_v4(),
  puppy_id uuid references puppies(id),
  previous_hash text, -- 上一个记录的哈希
  record_hash text not null, -- 当前记录的SHA256哈希
  record_data jsonb not null, -- 完整记录快照
  timestamp timestamp default now(),
  agent_type text -- 'diagnosis', 'prediction', 'growth'
);

-- 触发器自动计算hash并保持不可变
create or replace function calculate_health_hash() returns trigger as $$
begin
  new.record_hash := encode(sha256(new.record_data::bytea), 'hex');
  return new;
end;
$$ language plpgsql;

create trigger immutable_log_hash before insert on immutable_health_logs
for each row execute function calculate_health_hash();
```

### 4. ai_agent_interactions (Agent调用记录)
```sql
create table ai_agent_interactions (
  id uuid primary key default uuid_generate_v4(),
  puppy_id uuid references puppies,
  agent_type text, -- diagnosis/prediction/growth
  input_data jsonb,
  output_data jsonb,
  confidence numeric,
  created_at timestamp default now()
);
```