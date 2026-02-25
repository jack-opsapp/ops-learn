-- Migration 1: Create assessments table
-- Assessments belong to a module, ordered alongside lessons via sort_order

CREATE TYPE assessment_type AS ENUM ('quiz', 'assignment', 'test');

CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  type assessment_type NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  instructions text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  passing_score integer NOT NULL DEFAULT 70,
  max_retakes integer NOT NULL DEFAULT 3,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_id, slug)
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read assessments" ON assessments FOR SELECT USING (true);
