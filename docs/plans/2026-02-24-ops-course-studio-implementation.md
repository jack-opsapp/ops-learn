# OPS Course Studio Plugin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Claude Code plugin with 7 slash commands, 9 skills, and 1 agent for creating and managing ops-learn courses directly through Claude Code.

**Architecture:** Local Claude Code plugin at `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/`. Commands write directly to Supabase via the existing MCP plugin. Skills auto-activate based on context. Schema reference skill provides ground-truth data formats for all other skills.

**Tech Stack:** Claude Code plugin system (markdown + YAML frontmatter + JSON), Supabase MCP for DB writes.

---

### Task 1: Create plugin manifest

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/.claude-plugin/plugin.json`

**Step 1: Create directory and manifest**

```json
{
  "name": "ops-course-studio",
  "version": "1.0.0",
  "description": "Course production studio for ops-learn. Commands for creating courses, lessons, assessments, and interactive tools. Skills for curriculum research, copywriting, media direction, and assessment authoring.",
  "author": {
    "name": "Jackson Sweet"
  },
  "license": "MIT",
  "keywords": ["ops-learn", "course-creation", "lms", "assessments", "curriculum"]
}
```

**Step 2: Verify the plugin directory exists**

Run: `ls -la ~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/.claude-plugin/`
Expected: `plugin.json` listed

---

### Task 2: Create schema-reference skill

This skill is the foundation — all other skills reference the schemas defined here. Build this first.

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/skills/schema-reference/SKILL.md`

**Content:** Full database schema for all 9 tables, all JSONB format specs with complete examples, content_block_type enum, assessment_type enum, sort order conventions, Supabase project ID, safe math operator reference, grading system overview.

This is a reference skill (auto-loaded as context for any course content work). It does NOT perform actions — it provides the ground truth data formats.

**Key data to include:**
- courses table: id, title, slug, description, thumbnail_url, price_cents, status, sort_order, estimated_duration_minutes
- modules table: id, course_id, title, description, sort_order
- lessons table: id, module_id, title, slug, description, duration_minutes, sort_order, is_preview
- content_blocks table: id, lesson_id, type (enum), content (JSONB), sort_order
- assessments table: id, module_id, type (enum: quiz/assignment/test), title, slug, description, instructions, questions (JSONB), passing_score, max_retakes, sort_order
- assessment_submissions table: id, user_id, assessment_id, attempt_number, answers (JSONB), score, feedback (JSONB), status, created_at, graded_at
- course_grades table: id, user_id, course_id, overall_score, assessment_count, graded_count, updated_at
- enrollments table: user_id, course_id, status, enrolled_at
- lesson_progress table: user_id, lesson_id, status
- Content block types: video, text, download, action_item, quiz, interactive_tool (with full JSONB examples for each)
- Assessment question types: multiple_choice, short_answer, workbook (with full JSONB examples)
- Interactive tool config format with inputs/outputs/formulas
- Safe math operators: + - * / % ( ) > < >= <= == != ? :
- Sort order convention: 10-based numbering
- Supabase project ID: ijeekuhbatykdomumfjx
- Grading: MC = auto (0-based index match), short_answer/workbook = AI via gpt-4o-mini with rubric

---

### Task 3: Create curriculum-research skill

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/skills/curriculum-research/SKILL.md`

**Skill description:** Use when researching new course topics, identifying learning objectives, analyzing competitor offerings, or gathering industry data for course planning.

**Skill content should cover:**
- Process: identify target audience stage → research industry standards/certifications → find competitor courses → analyze knowledge gaps → propose module themes
- Output format: structured research brief with module topics, learning objectives, supporting evidence
- Research sources to check: industry associations, trade certification programs, competitor online courses, Reddit/forum discussions from trades professionals
- Target audience context: trades professionals running 1-10 person crews, residential construction, HVAC, painting, landscaping, plumbing, electrical, deck & rail
- Research should always ground recommendations in real-world trades business scenarios
- Use WebSearch tool for research

---

### Task 4: Create curriculum-structure skill

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/skills/curriculum-structure/SKILL.md`

**Skill description:** Use when designing course structure, organizing modules, planning lesson flow, placing assessments, or determining pacing for a course.

**Skill content should cover:**
- Process: research brief in → module sequence with progressive complexity → lessons per module → assessment placement → interactive tool placement → sort_order assignment → duration estimates
- Module design: 3-5 modules per course, each with a clear theme and outcome
- Lesson design: 3-5 lessons per module, single-topic focus, 10-20 min each
- Assessment placement rules:
  - Quiz: after every 1-2 lessons (comprehension check, 3-5 questions)
  - Assignment: after key conceptual lessons (application exercise, 1-3 questions)
  - Test: at end of each module (comprehensive, 5-8 questions, all types)
- Interactive tool placement: within lessons where hands-on exploration adds value
- Sort order: lessons at 10, 20, 30...; quizzes at 15, 25; assignments at 35; tests at highest in module (e.g., 50, 60)
- Output format: complete outline with module titles, lesson titles + slugs + durations, assessment titles + types + placement, tool placements
- Reference schema-reference skill for DB constraints

---

### Task 5: Create quiz-authoring skill

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/skills/quiz-authoring/SKILL.md`

**Skill description:** Use when creating quiz assessments, writing multiple-choice questions, writing short-answer questions, or generating quick comprehension checks.

**Skill content should cover:**
- Quiz scope: 3-5 questions, quick comprehension check after 1-2 lessons
- Question types available: multiple_choice, short_answer
- MC writing rules:
  - 4 options per question
  - One clearly correct answer
  - 3 plausible distractors (common misconceptions, not absurd)
  - correct_answer is 0-based index
  - Points: typically 10 per MC question
  - Question text should be clear, unambiguous, test understanding not memorization
- Short answer writing rules:
  - Open-ended but focused (answerable in 2-4 sentences)
  - Points: typically 15-20 per question
  - Rubric: 2-3 sentences guiding AI grader on what constitutes full/partial/no credit
  - Rubric should reward specific, applied answers over generic textbook responses
- Full JSONB format examples for both types
- Process: read the lesson content being quizzed → identify 3-5 key concepts → write questions that test understanding of those concepts → review for clarity
- Insert SQL template for assessments table
- Trades context: questions should reference real scenarios (job sites, client conversations, crew management)

---

### Task 6: Create assignment-authoring skill

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/skills/assignment-authoring/SKILL.md`

**Skill description:** Use when creating assignment assessments, writing workbook exercises, designing practical application tasks, or writing AI grading rubrics.

**Skill content should cover:**
- Assignment scope: 1-3 questions, emphasis on depth and real-world application
- Primary question type: workbook (multi-part)
- Workbook design rules:
  - 3-6 parts per workbook question
  - Parts progress logically: context → analysis → planning → action
  - Each part prompt should require the student to apply concepts to THEIR business
  - Part types: "text" (short input) or "textarea" (long input)
  - Points: typically 30-50 per workbook question
  - Rubric: detailed (3-5 sentences) guiding AI to reward specificity, personal application, and business-specific thinking. Partial credit for generic answers.
- Short answer can also be used for focused single-topic application
- Process: identify the practical application of the lesson → design an exercise that makes the student use the concepts on their real business → write rubric that guides AI grading
- Full JSONB format examples
- Insert SQL template
- Anti-patterns: avoid theoretical questions, avoid yes/no questions, avoid questions with "right" answers — assignments test APPLICATION not recall

---

### Task 7: Create test-authoring skill

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/skills/test-authoring/SKILL.md`

**Skill description:** Use when creating module tests, comprehensive assessments, or end-of-module evaluations that mix multiple question types.

**Skill content should cover:**
- Test scope: 5-8 questions covering the full module, total points ~100
- Mixed question types required: MC + short answer + workbook
- Recommended mix: 3 MC (30 pts) + 2 short answer (30 pts) + 1 workbook (40 pts) = 100 pts
- Question progression: recall (MC) → understanding (short answer) → application (workbook)
- Difficulty balance: ~40% straightforward, ~40% moderate, ~20% challenging
- passing_score: default 70
- max_retakes: default 3
- Test should cover ALL major concepts from the module, not just one lesson
- Rubrics for AI-graded questions should be more rigorous than quiz rubrics
- Process: list all key concepts across all lessons in the module → ensure coverage → write questions in progression order → verify point distribution → write rubrics
- Full JSONB format examples for complete test with all three question types
- Insert SQL template

---

### Task 8: Create interactive-tool-builder skill

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/skills/interactive-tool-builder/SKILL.md`

**Skill description:** Use when designing interactive learning tools, building calculators, creating scenario simulators, comparison tools, decision trees, visual builders, diagnostic assessments, or any interactive component that helps students engage with course material.

**Skill content should cover:**
- Tool types (non-exhaustive — any interactive format is valid):
  - Calculators: formula-driven, real-time output
  - Scenario simulators: change inputs, see different outcomes
  - Comparison tools: side-by-side option analysis
  - Decision trees: branching question flows with tailored recommendations
  - Visual builders: drag/arrange interfaces for planning
  - Timeline explorers: interactive progress/growth visualizations
  - Diagnostic assessments: non-graded self-assessment with personalized feedback
  - ROI analyzers: multi-variable return calculations
  - Interactive checklists: step-by-step process guides
  - Scoring matrices: weighted decision frameworks
  - Sliders/gauges: visual input tools for exploring ranges
  - Before/after comparisons: toggle between states
- For formula-driven tools (config-based, stored in content_blocks JSONB):
  - Full config format with inputs array and outputs array
  - Input types: currency, number, percentage
  - Output formulas: safe math expressions using variable references
  - Safe math operators: + - * / % ( ) > < >= <= == != ? :
  - Formula variables: reference input IDs and earlier output IDs by name
  - highlight: true on key output metrics
  - Complete working examples (profit calculator, break-even, hiring cost)
- For custom tools (beyond formula config):
  - Write a React/TSX component
  - Component goes in src/components/ and gets imported into InteractiveTool.tsx
  - Use OPS design system tokens (ops-surface, ops-border, ops-accent, ops-text-primary, etc.)
  - Consider animations: Framer Motion for transitions, CSS for hover states
  - Consider mobile responsiveness
  - No database persistence for tool inputs — purely client-side interactive
- Design principles:
  - Tool should create an "aha moment" — student sees their real numbers and gets insight
  - Inputs should have sensible defaults and placeholders
  - Outputs should highlight the most important metric
  - Keep inputs minimal — 3-6 inputs ideal, more than 8 is overwhelming
  - Labels should be plain language a contractor understands
- Insert SQL template for content_blocks table

---

### Task 9: Create lesson-copywriter skill

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/skills/lesson-copywriter/SKILL.md`

**Skill description:** Use when writing lesson content, creating text blocks, writing action items, structuring content block sequences, or writing in the OPS educational voice.

**Skill content should cover:**
- OPS educational voice (distinct from marketing voice):
  - Like a successful contractor mentoring a peer over coffee
  - Direct, practical, no-BS
  - Uses trades terminology naturally
  - Short paragraphs (2-3 sentences max)
  - Conversational but authoritative
  - Uses "you" and "your" — speaks directly to the reader
  - Concrete examples from real trades businesses, not abstract theory
  - Avoids academic language, corporate jargon, filler
- Content block sequence (standard lesson structure):
  - Video block (if applicable) — lesson introduction
  - Text block — core teaching content (HTML: h2, h3, p, strong, em, ul, ol, blockquote)
  - Interactive tool (if applicable) — hands-on exploration
  - Text block — additional context or deeper dive
  - Action item — concrete next step for the student
  - Quiz block (inline, non-graded) — quick self-check
- Text block HTML rules:
  - Use semantic HTML: h2 for main sections, h3 for subsections, p for body
  - Use strong for emphasis, not ALL CAPS
  - Use ul/ol for lists (trades people skim — make content scannable)
  - Use blockquote for key takeaways or quotes
  - No inline styles, no classes — the prose-ops Tailwind class handles styling
- Action item writing: one concrete, specific task the student can do TODAY in their business
- Download block: title + description for any downloadable resources
- Full JSONB examples for each content block type
- Insert SQL template for content_blocks table
- Process: outline lesson structure → write video script placeholder → write text blocks → add interactive tool if relevant → write action item → add inline quiz

---

### Task 10: Create media-director skill

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/skills/media-director/SKILL.md`

**Skill description:** Use when planning video content, writing video scripts, writing voice-over scripts for text-to-speech, planning visual assets, or determining what media a lesson needs.

**Skill content should cover:**
- Media assessment process:
  - For each lesson, determine: does it need video? what type? what supporting visuals?
  - Video types: talking head (founder/expert), screen recording (software demo), animation (concept explanation), b-roll (job site footage), hybrid
  - Not every lesson needs video — some are better as text + interactive tools
- Script writing format:
  ```
  [VISUAL: Description of what's on screen]
  [AUDIO]: "Exact words to be spoken"
  [BEAT: N seconds]
  [TRANSITION: Description]
  [LOWER THIRD: Text overlay]
  [MUSIC: Description of mood/track]
  ```
- Script structure:
  - Hook (0-10s): grab attention with a relatable problem or surprising stat
  - Setup (10-30s): frame the problem and what the student will learn
  - Core (30s-3min): teach the concept with examples
  - Demo (if applicable): show the concept in action
  - Wrap (10-20s): summarize key takeaway + transition to next content block
- Voice-over script formatting for TTS tools:
  - Plain text, no stage directions
  - Mark pauses with [PAUSE] or ellipsis
  - Phonetic spelling for technical terms if needed
  - Indicate emphasis with *asterisks*
  - Recommend voice characteristics (tone, pace, energy)
- Visual asset planning:
  - Diagrams: describe what the diagram should show, let design tools handle creation
  - Infographics: outline data points and layout
  - Screenshots: specify what tool/screen to capture
  - Stock footage: describe the scene needed
- Output: media plan per lesson with script, asset list, and production notes

---

### Task 11: Create /create-course command

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/commands/create-course.md`

**Command content:**
- Description: Scaffold a new course. Prompts for title, slug, description, price, estimated duration.
- Instructions:
  1. Ask user for course title
  2. Generate slug from title (lowercase, hyphens, no special chars)
  3. Ask for description (1-2 sentences)
  4. Ask for price (0 = free, otherwise cents)
  5. Ask for estimated duration in minutes
  6. Show the INSERT SQL and confirm
  7. Execute via `mcp__plugin_supabase_supabase__execute_sql` with project_id `ijeekuhbatykdomumfjx`
  8. Report the created course ID
  9. Ask if user wants to proceed to curriculum research for this course

---

### Task 12: Create /create-lesson command

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/commands/create-lesson.md`

**Command content:**
- Description: Add a lesson to a module.
- Instructions:
  1. List existing courses via SQL query
  2. Ask user to select a course
  3. List modules for that course
  4. Ask user to select a module
  5. List existing lessons in that module (with sort_order)
  6. Ask for lesson title, slug, description, duration_minutes, is_preview
  7. Determine sort_order (suggest next 10-increment)
  8. Show INSERT SQL and confirm
  9. Execute via Supabase MCP
  10. Report created lesson ID
  11. Ask if user wants to add content blocks (triggers lesson-copywriter skill)

---

### Task 13: Create /create-quiz command

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/commands/create-quiz.md`

**Command content:**
- Description: Create a quiz assessment.
- Instructions:
  1. List courses → user selects
  2. List modules for course → user selects
  3. List existing items (lessons + assessments) with sort_order
  4. Ask where to place the quiz (after which item)
  5. Determine sort_order
  6. Ask for quiz title and slug
  7. Trigger quiz-authoring skill to generate questions
  8. Show the full assessment INSERT SQL with questions JSONB
  9. Confirm and execute via Supabase MCP
  10. Report created assessment ID

---

### Task 14: Create /create-assignment command

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/commands/create-assignment.md`

**Command content:**
- Same flow as /create-quiz but triggers assignment-authoring skill and inserts with type = 'assignment'

---

### Task 15: Create /create-test command

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/commands/create-test.md`

**Command content:**
- Same flow but:
  - Defaults to end of module (highest sort_order + 10)
  - Triggers test-authoring skill
  - Inserts with type = 'test'

---

### Task 16: Create /create-tool command

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/commands/create-tool.md`

**Command content:**
- Description: Create an interactive tool within a lesson.
- Instructions:
  1. List courses → user selects
  2. List modules → user selects
  3. List lessons in module → user selects
  4. List existing content blocks in lesson (with sort_order)
  5. Ask where to place the tool
  6. Ask what concept the tool should illustrate
  7. Trigger interactive-tool-builder skill to design the tool
  8. Show the content_blocks INSERT SQL with JSONB config
  9. Confirm and execute via Supabase MCP
  10. Report created content block ID

---

### Task 17: Create /course-status command

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/commands/course-status.md`

**Command content:**
- Description: View the current state of a course.
- Instructions:
  1. List courses → user selects (or accept course slug as argument)
  2. Query full course tree: modules → lessons + assessments + content_blocks
  3. Display formatted tree:
     ```
     Course: Trades Foundation (trades-foundation)
     Status: published | Price: Free | Duration: 120 min

     Module 1: Foundation (sort: 10)
       [10] Lesson: The Owner's Trap (15 min)
            - video block (sort: 10)
            - text block (sort: 20)
            - interactive_tool: Break-Even Calculator (sort: 30)
            - action_item (sort: 40)
       [20] Lesson: Thinking Like a Business Owner (12 min)
       [25] Quiz: Foundation Quick Check (3 questions, 40 pts)
       [30] Lesson: Your Business on One Page (18 min)
       [35] Assignment: Your Business on One Page (1 question, 40 pts)
       [50] Test: Foundation Module Test (5 questions, 100 pts)
     ```
  4. Show completeness summary: total modules, lessons, assessments, content blocks, gaps

---

### Task 18: Create course-builder agent

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/agents/course-builder.md`

**Agent content:**
- Description: Orchestrator agent for multi-step course creation. Use when building a full course from scratch or performing multi-step course production tasks.
- System prompt: coordinates research → structure → content → assessments → tools → media in sequence. Writes to Supabase as it goes. Provides checkpoints for user review between major phases.
- Tools: all standard tools
- Should reference all 9 skills by name and know when to activate each

---

### Task 19: Create .mcp.json (empty — uses existing Supabase MCP)

**Files:**
- Create: `~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/.mcp.json`

**Content:**
```json
{
  "mcpServers": {}
}
```

Note: This plugin relies on the already-installed Supabase MCP plugin. No additional MCP servers needed.

---

### Task 20: Install and verify the plugin

**Step 1:** Verify all files exist

Run: `find ~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/ -type f`
Expected: 20 files (1 plugin.json, 9 SKILL.md, 7 commands, 1 agent, 1 .mcp.json, 1 or more reference files)

**Step 2:** Verify plugin.json is valid JSON

Run: `cat ~/.claude/plugins/marketplaces/local/plugins/ops-course-studio/.claude-plugin/plugin.json | python3 -m json.tool`
Expected: formatted JSON output

**Step 3:** Install the plugin

The plugin should be auto-discovered since it's in the local plugins directory. May need to restart Claude Code or run the plugin install command.

**Step 4:** Verify skills appear in skill list

After restarting Claude Code, verify that `ops-course-studio:schema-reference`, `ops-course-studio:curriculum-research`, etc. appear in the available skills.

**Step 5:** Test /course-status command

Run `/course-status` and verify it queries the existing trades-foundation course from Supabase and displays the tree.

---

## Implementation Order Summary

| Task | Component | Type | Dependencies |
|------|-----------|------|-------------|
| 1 | plugin.json | manifest | none |
| 2 | schema-reference | skill | Task 1 |
| 3 | curriculum-research | skill | Task 1 |
| 4 | curriculum-structure | skill | Task 1 |
| 5 | quiz-authoring | skill | Task 2 |
| 6 | assignment-authoring | skill | Task 2 |
| 7 | test-authoring | skill | Task 2 |
| 8 | interactive-tool-builder | skill | Task 2 |
| 9 | lesson-copywriter | skill | Task 2 |
| 10 | media-director | skill | Task 1 |
| 11 | /create-course | command | Task 2 |
| 12 | /create-lesson | command | Task 2, 9 |
| 13 | /create-quiz | command | Task 2, 5 |
| 14 | /create-assignment | command | Task 2, 6 |
| 15 | /create-test | command | Task 2, 7 |
| 16 | /create-tool | command | Task 2, 8 |
| 17 | /course-status | command | Task 2 |
| 18 | course-builder | agent | Tasks 2-10 |
| 19 | .mcp.json | config | Task 1 |
| 20 | Install + verify | testing | all |
