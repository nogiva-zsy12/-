-- 为 tasks 表添加 user_id 字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID;

-- 为 messages 表添加 user_id 字段  
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id UUID;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- 设置默认值（可选：如果有service_role key可以为历史数据设置user_id）
-- 注意：这个需要service role权限才能执行
-- UPDATE tasks SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
-- UPDATE messages SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
