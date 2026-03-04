-- Emotion Orchard Base Schema
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tdjyqykkngyflqkjuzai/sql

-- Trees
CREATE TABLE IF NOT EXISTS eo_trees (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'emotion' CHECK (type IN ('emotion', 'gratitude')),
  name TEXT NOT NULL DEFAULT 'Emotion Tree',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eo_trees_user ON eo_trees(user_id);
CREATE INDEX IF NOT EXISTS idx_eo_trees_public ON eo_trees(is_public) WHERE is_public = TRUE;

-- Leaves
CREATE TABLE IF NOT EXISTS eo_leaves (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES eo_trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion TEXT,
  color TEXT NOT NULL,
  person_name TEXT,
  note TEXT,
  position_x FLOAT,
  position_y FLOAT,
  branch_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eo_leaves_tree ON eo_leaves(tree_id);
CREATE INDEX IF NOT EXISTS idx_eo_leaves_user ON eo_leaves(user_id);

-- Comments on public trees
CREATE TABLE IF NOT EXISTS eo_comments (
  id SERIAL PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES eo_trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eo_comments_tree ON eo_comments(tree_id);

-- Chat messages
CREATE TABLE IF NOT EXISTS eo_chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tool_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eo_chat_user ON eo_chat_messages(user_id);

-- Enable RLS
ALTER TABLE eo_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE eo_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE eo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE eo_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role bypasses these, but good for direct client access)
CREATE POLICY "Users can manage their own trees" ON eo_trees
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public trees" ON eo_trees
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can manage their own leaves" ON eo_leaves
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view leaves of public trees" ON eo_leaves
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM eo_trees WHERE eo_trees.id = eo_leaves.tree_id AND eo_trees.is_public = TRUE)
  );

CREATE POLICY "Users can manage their own comments" ON eo_comments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments on public trees" ON eo_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM eo_trees WHERE eo_trees.id = eo_comments.tree_id AND eo_trees.is_public = TRUE)
  );

CREATE POLICY "Users can manage their own chat" ON eo_chat_messages
  FOR ALL USING (auth.uid() = user_id);
