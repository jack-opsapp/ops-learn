-- Migration 3: Create course_grades table

CREATE TABLE course_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  overall_score numeric(5,2),
  assessment_count integer NOT NULL DEFAULT 0,
  graded_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE course_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own grades" ON course_grades FOR SELECT USING (true);
