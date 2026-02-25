// ─── Course List ─────────────────────────────────────────────────────

export interface CourseOverview {
  id: string;
  title: string;
  slug: string;
  status: string;
  price_cents: number;
  sort_order: number;
  module_count: number;
  lesson_count: number;
  assessment_count: number;
  enrolled_count: number;
  completed_count: number;
  display_enrollments: number;
  display_rating: number;
  display_review_count: number;
}

// ─── Course Detail ───────────────────────────────────────────────────

export interface ContentBlockSummary {
  type: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  slug: string;
  duration_minutes: number | null;
  sort_order: number;
  content_blocks: ContentBlockSummary[];
}

export interface AssessmentDetail {
  id: string;
  title: string;
  slug: string;
  type: 'quiz' | 'assignment' | 'test';
  sort_order: number;
  passing_score: number | null;
  question_count: number;
}

export interface ModuleDetail {
  id: string;
  title: string;
  sort_order: number;
  lessons: LessonDetail[];
  assessments: AssessmentDetail[];
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  status: string;
  price_cents: number;
  display_enrollments: number;
  display_rating: number;
  display_review_count: number;
  modules: ModuleDetail[];
}

// ─── Analytics ───────────────────────────────────────────────────────

export interface EnrollmentCounts {
  total: number;
  active: number;
  completed: number;
  completion_rate: number;
}

export interface LessonProgress {
  lesson_id: string;
  lesson_title: string;
  module_title: string;
  module_sort_order: number;
  lesson_sort_order: number;
  started_count: number;
  completed_count: number;
}

export interface AssessmentStats {
  assessment_id: string;
  assessment_title: string;
  type: string;
  submission_count: number;
  pass_count: number;
  pass_rate: number;
  avg_score: number;
}

export interface CourseAnalytics {
  enrollment: EnrollmentCounts;
  lesson_progress: LessonProgress[];
  assessment_stats: AssessmentStats[];
}

// ─── Vanity Metrics ──────────────────────────────────────────────────

export interface VanityMetrics {
  display_enrollments: number;
  display_rating: number;
  display_review_count: number;
}
