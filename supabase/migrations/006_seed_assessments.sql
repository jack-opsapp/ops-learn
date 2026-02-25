-- Migration 6: Re-number lesson sort_orders and seed assessments
-- Lessons go to 10-based spacing for room to interleave assessments

-- Foundation lessons: 1,2,3 → 10,20,30
UPDATE lessons SET sort_order = sort_order * 10 WHERE module_id = '172c7e20-51df-4411-b3ff-a9c1009bdddb';

-- Getting Clients lessons: 1,2 → 10,20
UPDATE lessons SET sort_order = sort_order * 10 WHERE module_id = 'e1a2bd28-c081-4a63-8560-93d611160051';

-- Building Your Team lessons: 1,2 → 10,20
UPDATE lessons SET sort_order = sort_order * 10 WHERE module_id = 'f0cd12a2-ee17-42a3-9494-79ab41c8acd4';

-- ============================================================
-- FOUNDATION MODULE: Quiz after lesson 2, Assignment after lesson 3, Test at end
-- ============================================================

INSERT INTO assessments (module_id, type, title, slug, sort_order, passing_score, description, instructions, questions) VALUES

-- Foundation Quick Check (quiz after "Thinking Like a Business Owner")
('172c7e20-51df-4411-b3ff-a9c1009bdddb', 'quiz', 'Foundation Quick Check', 'foundation-quick-check', 25, 70,
 'Test your understanding of the owner mindset shift.',
 'Answer these questions based on the first two lessons.',
 '[
   {
     "id": "fqc1",
     "type": "multiple_choice",
     "question": "What is the \"Owner''s Trap\" primarily about?",
     "options": [
       "Not having enough tools or equipment",
       "Being the bottleneck in every part of your business",
       "Hiring too many employees too quickly",
       "Charging too little for your services"
     ],
     "correct_answer": 1,
     "points": 10
   },
   {
     "id": "fqc2",
     "type": "multiple_choice",
     "question": "Which mindset shift is critical for scaling a trades business?",
     "options": [
       "Working more hours to increase revenue",
       "Doing everything yourself to maintain quality",
       "Building systems so the business runs without you",
       "Focusing exclusively on finding new clients"
     ],
     "correct_answer": 2,
     "points": 10
   },
   {
     "id": "fqc3",
     "type": "short_answer",
     "question": "In your own words, describe one specific way you are currently stuck in the Owner''s Trap in your business.",
     "rubric": "Award full points if the student identifies a specific, personal example of being a bottleneck. Partial credit for generic answers. Zero for blank or irrelevant.",
     "points": 20
   }
 ]'::jsonb),

-- Foundation Assignment (after "Your Business on One Page")
('172c7e20-51df-4411-b3ff-a9c1009bdddb', 'assignment', 'Your Business on One Page', 'business-on-one-page', 35, 70,
 'Apply what you learned to map your actual business on a single page.',
 'Complete each section thoughtfully — this becomes your operating reference.',
 '[
   {
     "id": "fbop1",
     "type": "workbook",
     "question": "Map your business on one page.",
     "parts": [
       {"id": "revenue_streams", "prompt": "List your top 3 revenue streams (services you sell)", "type": "textarea"},
       {"id": "key_bottleneck", "prompt": "What is the single biggest bottleneck in your business right now?", "type": "textarea"},
       {"id": "ideal_week", "prompt": "Describe what your ideal work week looks like as an owner (not a technician)", "type": "textarea"},
       {"id": "first_system", "prompt": "What is one process you could systematize this month to free up your time?", "type": "textarea"}
     ],
     "rubric": "Award full points for thoughtful, specific answers that show the student applied concepts from the module to their real business. Partial credit for vague or generic answers. Each part is worth roughly equal credit.",
     "points": 40
   }
 ]'::jsonb),

-- Foundation Module Test
('172c7e20-51df-4411-b3ff-a9c1009bdddb', 'test', 'Foundation Module Test', 'foundation-test', 50, 70,
 'Comprehensive test covering all Foundation module concepts.',
 'Complete all questions. You have 3 attempts.',
 '[
   {
     "id": "ft1",
     "type": "multiple_choice",
     "question": "A business owner stuck in the Owner''s Trap typically:",
     "options": [
       "Delegates most tasks to their team",
       "Cannot take a day off without the business stalling",
       "Focuses primarily on strategic planning",
       "Has well-documented processes for everything"
     ],
     "correct_answer": 1,
     "points": 10
   },
   {
     "id": "ft2",
     "type": "multiple_choice",
     "question": "The main purpose of a \"Business on One Page\" exercise is to:",
     "options": [
       "Create a marketing brochure for clients",
       "Satisfy a legal requirement for business registration",
       "Get a clear, high-level view of how your business operates",
       "Calculate your exact profit margin"
     ],
     "correct_answer": 2,
     "points": 10
   },
   {
     "id": "ft3",
     "type": "multiple_choice",
     "question": "Which is the BEST first step to escape the Owner''s Trap?",
     "options": [
       "Hire five employees immediately",
       "Document one repeatable process you currently do yourself",
       "Raise your prices by 50%",
       "Stop answering client calls"
     ],
     "correct_answer": 1,
     "points": 10
   },
   {
     "id": "ft4",
     "type": "short_answer",
     "question": "Explain why ''thinking like a business owner'' is different from ''thinking like a technician.'' Give a concrete example from a trades business.",
     "rubric": "Full points: clearly distinguishes working ON the business vs IN the business with a specific trades example (e.g., an electrician who spends all day wiring vs one who trains others and focuses on estimates). Partial: correct concept but vague. Zero: off-topic.",
     "points": 20
   },
   {
     "id": "ft5",
     "type": "short_answer",
     "question": "You are an HVAC contractor doing $300K/year mostly by yourself. Describe a 90-day plan to begin escaping the Owner''s Trap using concepts from this module.",
     "rubric": "Full points: mentions systemizing a process, potentially hiring/subcontracting, defining the owner role vs technician role, and has specific actionable steps. Partial: mentions some concepts but is vague or unrealistic. Zero: does not reference course concepts.",
     "points": 30
   }
 ]'::jsonb);

-- ============================================================
-- GETTING CLIENTS MODULE: Quiz after lesson 1, Test at end
-- ============================================================

INSERT INTO assessments (module_id, type, title, slug, sort_order, passing_score, description, instructions, questions) VALUES

-- Getting Clients Quick Check
('e1a2bd28-c081-4a63-8560-93d611160051', 'quiz', 'Client Acquisition Quick Check', 'client-acquisition-quick-check', 15, 70,
 'Check your understanding of the client acquisition framework.',
 'Answer these questions based on the Client Acquisition Framework lesson.',
 '[
   {
     "id": "cqc1",
     "type": "multiple_choice",
     "question": "What is the most reliable long-term source of clients for a trades business?",
     "options": [
       "Paying for online ads",
       "Referrals and repeat customers",
       "Cold calling homeowners",
       "Posting on social media daily"
     ],
     "correct_answer": 1,
     "points": 10
   },
   {
     "id": "cqc2",
     "type": "multiple_choice",
     "question": "A good client acquisition framework should:",
     "options": [
       "Rely on a single marketing channel",
       "Generate leads without any follow-up needed",
       "Create multiple predictable channels that work together",
       "Focus only on the cheapest leads possible"
     ],
     "correct_answer": 2,
     "points": 10
   },
   {
     "id": "cqc3",
     "type": "short_answer",
     "question": "What are your current top 2 sources of new clients? How reliable are they?",
     "rubric": "Full points for identifying 2 specific sources with honest assessment of reliability. Partial for vague answers. Zero for blank.",
     "points": 20
   }
 ]'::jsonb),

-- Getting Clients Module Test
('e1a2bd28-c081-4a63-8560-93d611160051', 'test', 'Getting Clients Module Test', 'getting-clients-test', 30, 70,
 'Comprehensive test covering client acquisition and pricing.',
 'Complete all questions. You have 3 attempts.',
 '[
   {
     "id": "gct1",
     "type": "multiple_choice",
     "question": "When pricing a job, your price should be based primarily on:",
     "options": [
       "What competitors are charging",
       "What the customer says they can afford",
       "Your true costs plus a target profit margin",
       "The lowest price that will win the job"
     ],
     "correct_answer": 2,
     "points": 10
   },
   {
     "id": "gct2",
     "type": "multiple_choice",
     "question": "''Pricing for Profit'' means understanding that:",
     "options": [
       "Revenue equals profit",
       "Overhead, labor, and materials must be covered before any profit exists",
       "You should always be the cheapest option",
       "Higher prices always mean fewer clients"
     ],
     "correct_answer": 1,
     "points": 10
   },
   {
     "id": "gct3",
     "type": "short_answer",
     "question": "A landscaping company charges $2,500 for a typical job. Materials cost $400, labor is 12 hours at $28/hr, and overhead is 18%. Calculate the profit and profit margin. Show your work.",
     "rubric": "Labor: 12 × $28 = $336. Subtotal costs before overhead: $400 + $336 = $736. Overhead: $736 × 0.18 = $132.48. Total cost: $868.48. Profit: $2,500 - $868.48 = $1,631.52. Margin: $1,631.52 / $2,500 = 65.3%. Full points for correct calculation with work shown. Partial for correct method but math errors. Accept reasonable rounding.",
     "points": 25
   },
   {
     "id": "gct4",
     "type": "short_answer",
     "question": "Describe a 3-channel client acquisition strategy for a plumbing business, including one referral-based channel, one digital channel, and one local/community channel.",
     "rubric": "Full points: 3 specific channels clearly described with actionable detail (e.g., referral program with incentive, Google Business Profile with review strategy, local hardware store partnership). Partial: correct idea but vague. Zero: does not provide 3 distinct channels.",
     "points": 25
   }
 ]'::jsonb);

-- ============================================================
-- BUILDING YOUR TEAM MODULE: Quiz after lesson 1, Test at end
-- ============================================================

INSERT INTO assessments (module_id, type, title, slug, sort_order, passing_score, description, instructions, questions) VALUES

-- Building Your Team Quick Check
('f0cd12a2-ee17-42a3-9494-79ab41c8acd4', 'quiz', 'First Hire Quick Check', 'first-hire-quick-check', 15, 70,
 'Check your understanding of making your first hire.',
 'Answer these questions based on the Your First Hire lesson.',
 '[
   {
     "id": "thqc1",
     "type": "multiple_choice",
     "question": "Before making your first hire, the most important thing to have ready is:",
     "options": [
       "A large office space",
       "At least $100K in the bank",
       "A documented process for the role you are hiring for",
       "A company vehicle for them"
     ],
     "correct_answer": 2,
     "points": 10
   },
   {
     "id": "thqc2",
     "type": "multiple_choice",
     "question": "The true cost of an employee includes:",
     "options": [
       "Only their hourly wage",
       "Wage plus benefits only",
       "Wage, payroll taxes, benefits, training time, and overhead",
       "Whatever number they negotiate"
     ],
     "correct_answer": 2,
     "points": 10
   },
   {
     "id": "thqc3",
     "type": "short_answer",
     "question": "What role would your first hire fill, and why is that the highest-impact position for your business right now?",
     "rubric": "Full points for identifying a specific role with a clear business rationale tied to freeing the owner from a bottleneck. Partial for vague role or weak rationale.",
     "points": 20
   }
 ]'::jsonb),

-- Building Your Team Module Test
('f0cd12a2-ee17-42a3-9494-79ab41c8acd4', 'test', 'Building Your Team Module Test', 'building-team-test', 30, 70,
 'Comprehensive test covering hiring and training systems.',
 'Complete all questions. You have 3 attempts.',
 '[
   {
     "id": "btt1",
     "type": "multiple_choice",
     "question": "A training system that scales should be:",
     "options": [
       "Entirely dependent on the owner training each new hire personally",
       "Documented, repeatable, and deliverable by anyone on the team",
       "As brief as possible to save time",
       "Focused only on technical skills"
     ],
     "correct_answer": 1,
     "points": 10
   },
   {
     "id": "btt2",
     "type": "multiple_choice",
     "question": "When is the right time to make your first hire?",
     "options": [
       "When you are so busy you are turning away work",
       "When you can clearly define the role and have documented the process",
       "Only when you can guarantee 2 years of salary in savings",
       "Never — subcontractors are always better"
     ],
     "correct_answer": 1,
     "points": 10
   },
   {
     "id": "btt3",
     "type": "short_answer",
     "question": "An employee costs $22/hr, works 40 hrs/week, has 8% payroll tax, $200/month in benefits, and required 3 weeks of paid training before becoming productive. Calculate the true monthly cost of this employee during their first month (training month).",
     "rubric": "Weekly wage: $22 × 40 = $880. Monthly wage (4.33 weeks): ~$3,810. Payroll tax: $3,810 × 0.08 = $304.80. Benefits: $200. Total monthly: ~$4,314.80. During training month they produce no billable revenue, so the full cost is a sunk investment. Full points for correct calculation. Partial for correct method with minor errors.",
     "points": 25
   },
   {
     "id": "btt4",
     "type": "short_answer",
     "question": "Design a 2-week onboarding plan for a new field technician at your company. Include at least 4 specific training activities and explain how each one could be delivered without you personally being there.",
     "rubric": "Full points: 4+ specific activities (e.g., safety video library, ride-along with senior tech, checklist-based solo job, tool inventory walkthrough) each with a delegation method. Partial: activities listed but no delegation plan. Zero: vague or off-topic.",
     "points": 25
   }
 ]'::jsonb);
