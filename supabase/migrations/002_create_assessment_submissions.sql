-- Migration 2: Create assessment_submissions table

CREATE TABLE assessment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL DEFAULT 1,
  answers jsonb NOT NULL,
  score integer,
  feedback jsonb,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  UNIQUE(user_id, assessment_id, attempt_number)
);

CREATE INDEX idx_asub_user_assessment ON assessment_submissions(user_id, assessment_id);

ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own submissions" ON assessment_submissions FOR SELECT USING (true);
CREATE POLICY "Users can insert submissions" ON assessment_submissions FOR INSERT WITH CHECK (true);
