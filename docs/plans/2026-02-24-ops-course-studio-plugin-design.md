# OPS Course Studio — Claude Code Plugin Design

## Purpose

A comprehensive course production studio plugin for Claude Code. Enables creating, authoring, and managing ops-learn courses through slash commands and auto-activating skills. Writes directly to Supabase via the existing MCP plugin.

Target user: Jackson (single-user, opinionated, bakes in full schema knowledge).

---

## Plugin Structure

```
ops-course-studio/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── create-course.md
│   ├── create-lesson.md
│   ├── create-quiz.md
│   ├── create-assignment.md
│   ├── create-test.md
│   ├── create-tool.md
│   └── course-status.md
├── skills/
│   ├── curriculum-research/
│   │   └── SKILL.md
│   ├── curriculum-structure/
│   │   └── SKILL.md
│   ├── quiz-authoring/
│   │   └── SKILL.md
│   ├── assignment-authoring/
│   │   └── SKILL.md
│   ├── test-authoring/
│   │   └── SKILL.md
│   ├── interactive-tool-builder/
│   │   └── SKILL.md
│   ├── lesson-copywriter/
│   │   └── SKILL.md
│   ├── media-director/
│   │   └── SKILL.md
│   └── schema-reference/
│       └── SKILL.md
├── agents/
│   └── course-builder.md
└── .mcp.json
```

---

## Commands (7)

### /create-course
Scaffolds a new course end-to-end. Prompts for title, slug, description, price. Inserts into `courses` table. Optionally triggers curriculum-research skill for module planning.

### /create-lesson
Adds a lesson to a module. Prompts for target course, module, lesson details (title, slug, description, duration, sort_order, is_preview). Inserts into `lessons` table. Optionally triggers lesson-copywriter skill for content block authoring.

### /create-quiz
Creates a quiz assessment. Prompts for target course, module, placement (after which lesson). Triggers quiz-authoring skill to generate questions. Inserts into `assessments` table with `type = 'quiz'`.

### /create-assignment
Creates an assignment assessment. Same flow as quiz but triggers assignment-authoring skill. Inserts with `type = 'assignment'`.

### /create-test
Creates a module test. Prompts for target course, module. Triggers test-authoring skill for comprehensive question generation. Inserts with `type = 'test'` at end of module sort order.

### /create-tool
Creates an interactive tool as a content block within a lesson. Prompts for target course, module, lesson, placement. Triggers interactive-tool-builder skill to design the tool. Inserts into `content_blocks` table with `type = 'interactive_tool'`.

### /course-status
Reads and displays the current state of a course: modules, lessons, assessments, content blocks, interactive tools. Shows sort order, gaps, and completeness.

---

## Skills (9)

### 1. curriculum-research
**Triggers**: Discussing new course topics, market research, competitive analysis.

**Capabilities**:
- Web search for industry training content, competitor courses, certification requirements
- Analyze target audience (trades professionals at specific career stages)
- Identify core knowledge gaps and learning objectives
- Propose high-level module themes with rationale
- Research real-world examples, case studies, statistics relevant to trades businesses

**Output**: Structured research brief with recommended module topics, learning objectives per module, and supporting evidence.

### 2. curriculum-structure
**Triggers**: Organizing modules, planning lesson flow, pacing decisions.

**Capabilities**:
- Design module sequence with progressive complexity
- Break modules into lessons with clear single-topic focus
- Place assessments strategically (quizzes after key concepts, assignments for application, tests at module end)
- Plan interactive tool placement where concepts benefit from hands-on exploration
- Define sort_order values (10-based for room to insert later)
- Estimate lesson durations
- Map learning objectives to specific lessons and assessments

**Output**: Complete course outline with modules, lessons, assessment placement, tool placement, sort orders, and durations.

### 3. quiz-authoring
**Triggers**: Creating quiz assessments, writing quick-check questions.

**Capabilities**:
- Generate multiple-choice questions with plausible distractors
- Generate short-answer questions testing conceptual understanding
- Write clear, unambiguous question text
- Set appropriate point values (typically 10 pts MC, 15-20 pts short answer)
- Assign correct_answer indices for MC (0-based)
- Write concise rubrics for short-answer AI grading

**JSONB Format Knowledge**:
```json
{
  "id": "unique_string",
  "type": "multiple_choice",
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correct_answer": 1,
  "points": 10
}
```

**Constraints**: Quiz = 3-5 questions, quick comprehension check. Not exhaustive.

### 4. assignment-authoring
**Triggers**: Creating practical application assignments, workbook exercises.

**Capabilities**:
- Design workbook-style multi-part assignments that apply concepts to the student's real business
- Write practical prompts that require specific, personal answers (not textbook regurgitation)
- Structure parts logically (context, analysis, action planning)
- Write AI grading rubrics that reward specificity and real-world application
- Generate short-answer questions for focused application tasks

**JSONB Format Knowledge**:
```json
{
  "id": "unique_string",
  "type": "workbook",
  "question": "Overall prompt...",
  "parts": [
    {"id": "part_id", "prompt": "...", "type": "textarea"}
  ],
  "rubric": "Detailed grading criteria...",
  "points": 40
}
```

**Constraints**: Assignments = 1-3 questions, emphasis on depth over breadth. Rubrics must guide AI to reward business-specific, thoughtful answers.

### 5. test-authoring
**Triggers**: Creating comprehensive module tests.

**Capabilities**:
- Mix all question types (MC, short answer, workbook) for comprehensive evaluation
- Cover all major concepts from the module
- Progress from recall (MC), understanding (short answer), application (workbook)
- Set passing_score (default 70)
- Write rubrics that assess both knowledge and practical application
- Balance difficulty: ~40% straightforward, ~40% moderate, ~20% challenging

**Constraints**: Tests = 5-8 questions, covering full module scope. Total points typically 100.

### 6. interactive-tool-builder
**Triggers**: Designing interactive learning tools for lessons.

**Capabilities**:
- Design any type of interactive tool that illustrates course concepts:
  - **Calculators**: Input-driven computation with real-time output (profit margins, pricing, break-even, hiring costs, etc.)
  - **Scenario simulators**: What-if explorations where changing inputs shows different outcomes
  - **Comparison tools**: Side-by-side analysis of options (e.g., hiring employee vs subcontractor)
  - **Decision trees**: Guided decision flows based on user inputs
  - **Visual builders**: Drag/arrange interfaces for planning (e.g., weekly schedule builder, org chart)
  - **Timeline explorers**: Interactive timelines showing business growth stages
  - **Diagnostic assessments**: Non-graded self-assessment tools that give personalized feedback
  - **ROI analyzers**: Multi-variable return-on-investment calculations
  - **Interactive checklists**: Step-by-step process guides with progress tracking
  - **Matrix/scoring tools**: Weighted decision matrices for comparing options
  - Any other interactive format that helps the student engage with the material
- For formula-driven tools: write safe math formulas (supports: +, -, *, /, %, parentheses, ternary operators, comparisons)
- For custom tools: write the React/TSX component implementation
- Design compelling input labels and output formatting
- Consider animation and visual design for engagement
- Choose appropriate input types (currency, number, percentage)
- Highlight key output metrics

**Config Format** (for formula-driven tools):
```json
{
  "tool_type": "descriptive_name",
  "title": "...",
  "description": "...",
  "inputs": [
    {"id": "var_name", "label": "...", "type": "currency|number|percentage", "placeholder": "...", "default": 0}
  ],
  "outputs": [
    {"id": "var_name", "label": "...", "formula": "safe math expression", "format": "currency|number|percentage", "highlight": true}
  ]
}
```

**Safe Math Operators**: `+ - * / % ( ) > < >= <= == != ? :`
**Formula Variables**: Reference other input/output IDs by name. Outputs can reference earlier outputs.

**For tools beyond formula-driven config** (visual builders, drag-and-drop, etc.): Write a custom React component and either add a new tool_type handler to InteractiveTool.tsx or create a new content block type.

### 7. lesson-copywriter
**Triggers**: Writing lesson content, text blocks, action items.

**Capabilities**:
- Write lesson text in OPS brand voice: direct, practical, no-BS, trades-focused
- Structure content blocks in logical teaching order (video, text, interactive tool, action item)
- Write HTML for text blocks (h2, h3, p, strong, em, ul, ol, blockquote, code)
- Create action items that give students a concrete next step
- Write download descriptions
- Maintain consistent tone across lessons: conversational but authoritative, like a successful contractor mentoring a peer
- Avoid academic language — use trades terminology and real examples

**Content Block Types Available**:
- `video`: url or embed_html
- `text`: html content
- `download`: url + title + description
- `action_item`: text prompt
- `quiz`: inline quick-check question (non-graded)
- `interactive_tool`: config-driven or custom component

### 8. media-director
**Triggers**: Planning video/audio content, writing scripts, planning visual assets.

**Capabilities**:
- Identify which lessons need video content and what type (talking head, screen recording, animation, b-roll)
- Write video scripts with timing estimates
- Write voice-over scripts formatted for text-to-speech / voice generation tools
- Plan visual assets (diagrams, infographics, screenshots)
- Suggest stock footage/music needs
- Structure scripts with hook (first 10 seconds), core teaching, practical example, call to action
- Output scripts with [VISUAL] and [AUDIO] cues for production

**Script Format**:
```
[VISUAL: Screen recording of spreadsheet]
[AUDIO]: "Let's look at what happens when you actually track your numbers..."
[BEAT: 2 seconds]
[VISUAL: Cut to calculator tool demo]
[AUDIO]: "Use the calculator below to plug in YOUR numbers..."
```

### 9. schema-reference
**Triggers**: Any course content work (auto-loaded as context).

**Contains**:
- Full database schema for all 9 tables (courses, modules, lessons, content_blocks, assessments, assessment_submissions, course_grades, enrollments, lesson_progress)
- All JSONB format specifications with examples
- content_block_type enum values
- assessment_type enum values
- Sort order conventions (10-based)
- Supabase project ID: `ijeekuhbatykdomumfjx`
- Safe math operator reference
- Grading system overview (MC = auto, short_answer/workbook = AI via gpt-4o-mini)

This skill is a reference document, not an action skill. It provides the ground truth for all other skills and commands.

---

## Agent (1)

### course-builder
**Purpose**: Orchestrator for full course creation workflows.

**When to use**: "Build me a course on [topic]" or any multi-step course production task.

**Capabilities**:
- Coordinates the full pipeline: research, structure, lessons, assessments, tools, media
- Invokes skills in sequence with handoffs
- Maintains course state across steps
- Writes all content to Supabase as it goes
- Provides progress updates and checkpoints for review

**Tools available**: All standard tools + Supabase MCP

---

## Database Write Patterns

All commands write directly to Supabase via `execute_sql` from the Supabase MCP plugin.

### Insert Course
```sql
INSERT INTO courses (title, slug, description, price_cents, status, sort_order, estimated_duration_minutes)
VALUES ('...', '...', '...', 0, 'published', 10, 120)
RETURNING id;
```

### Insert Module
```sql
INSERT INTO modules (course_id, title, description, sort_order)
VALUES ('course_uuid', '...', '...', 10)
RETURNING id;
```

### Insert Lesson
```sql
INSERT INTO lessons (module_id, title, slug, description, duration_minutes, sort_order, is_preview)
VALUES ('module_uuid', '...', '...', '...', 15, 10, false)
RETURNING id;
```

### Insert Content Block
```sql
INSERT INTO content_blocks (lesson_id, type, content, sort_order)
VALUES ('lesson_uuid', 'text', '{"html": "..."}', 10)
RETURNING id;
```

### Insert Assessment
```sql
INSERT INTO assessments (module_id, type, title, slug, description, instructions, questions, passing_score, max_retakes, sort_order)
VALUES ('module_uuid', 'quiz', '...', '...', '...', '...', '[...]'::jsonb, 70, 3, 25)
RETURNING id;
```

### Read Course State (for /course-status)
```sql
SELECT c.title, c.slug,
  m.title as module_title, m.sort_order as module_order,
  l.title as lesson_title, l.sort_order as lesson_order,
  a.title as assessment_title, a.type, a.sort_order as assessment_order
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
LEFT JOIN assessments a ON a.module_id = m.id
WHERE c.slug = '...'
ORDER BY m.sort_order, COALESCE(l.sort_order, a.sort_order);
```

---

## Workflow Examples

### Quick: Add a quiz to an existing module
```
/create-quiz
> Prompts: which course? which module? after which lesson?
> Quiz-authoring skill generates 3-4 questions based on module content
> User reviews and approves
> INSERT into assessments table
> Done
```

### Full: Create a new course from scratch
```
/create-course "Estimating & Bidding for Contractors"
> Curriculum-research skill: researches topic, identifies learning objectives
> Curriculum-structure skill: designs 4 modules with lesson/assessment placement
> User approves structure
> INSERTs: course, modules, lessons (empty)
> For each lesson: lesson-copywriter writes content blocks
> For each assessment: quiz/assignment/test-authoring creates questions
> Interactive-tool-builder: creates relevant tools (bid calculator, markup estimator, etc.)
> Media-director: identifies video needs, writes scripts
> /course-status: review final state
```

### Medium: Add an interactive tool to a lesson
```
/create-tool
> Prompts: which course? which lesson? what concept to illustrate?
> Interactive-tool-builder skill designs the tool
> Could be a calculator, comparison tool, decision tree, or custom component
> User reviews config/code
> INSERT into content_blocks
> Done
```
