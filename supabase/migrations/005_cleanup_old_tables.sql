-- Migration 5: Remove test assignment content block and drop old tables

-- Remove the test assignment content block
DELETE FROM content_blocks WHERE id = 'c5846f10-727e-488f-a147-e6f1bb82ba8f';

-- Drop empty old tables (order matters for FK deps)
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS assignment_submissions;
