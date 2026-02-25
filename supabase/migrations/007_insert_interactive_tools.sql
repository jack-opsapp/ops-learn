-- Migration 7: Insert interactive tool content blocks into lessons
-- These are non-graded calculators that appear inline within lesson content.

-- ====================================================================
-- 1. Profit Margin Calculator → "Pricing for Profit" lesson (6ed72e66...)
--    Currently has: text (sort_order 1), action_item (sort_order 2)
--    Insert calculator at sort_order 3 (after text, before action_item → bump action_item to 4)
-- ====================================================================

UPDATE content_blocks
SET sort_order = 4
WHERE id = '7039b0e3-6a3c-48b2-a73d-22490d4ea5ca'
  AND lesson_id = '6ed72e66-8372-462b-b53b-547d95a94698';

INSERT INTO content_blocks (lesson_id, type, sort_order, content)
VALUES (
  '6ed72e66-8372-462b-b53b-547d95a94698',
  'interactive_tool',
  2,
  '{
    "tool_type": "profit_calculator",
    "title": "Job Profit Calculator",
    "description": "Plug in the numbers from a real or hypothetical job to see what you actually take home after costs.",
    "inputs": [
      { "id": "revenue", "label": "Job Revenue", "type": "currency", "placeholder": "2500" },
      { "id": "materials", "label": "Material Costs", "type": "currency", "placeholder": "400" },
      { "id": "labor_hours", "label": "Labor Hours", "type": "number", "placeholder": "8" },
      { "id": "hourly_rate", "label": "Crew Hourly Rate", "type": "currency", "placeholder": "28" },
      { "id": "overhead_pct", "label": "Overhead", "type": "percentage", "default": 18 }
    ],
    "outputs": [
      { "id": "labor_cost", "label": "Total Labor Cost", "formula": "labor_hours * hourly_rate", "format": "currency" },
      { "id": "subtotal_costs", "label": "Direct Costs", "formula": "materials + labor_cost", "format": "currency" },
      { "id": "overhead_amount", "label": "Overhead Cost", "formula": "subtotal_costs * overhead_pct / 100", "format": "currency" },
      { "id": "total_costs", "label": "Total Job Cost", "formula": "subtotal_costs + overhead_amount", "format": "currency" },
      { "id": "profit", "label": "Net Profit", "formula": "revenue - total_costs", "format": "currency", "highlight": true },
      { "id": "margin", "label": "Profit Margin", "formula": "revenue > 0 ? (profit / revenue) * 100 : 0", "format": "percentage", "highlight": true },
      { "id": "effective_hourly", "label": "Your Effective Hourly Rate", "formula": "labor_hours > 0 ? profit / labor_hours : 0", "format": "currency", "highlight": true }
    ]
  }'::jsonb
);

-- ====================================================================
-- 2. Hourly Rate Calculator → "Pricing for Profit" lesson (6ed72e66...)
--    Insert second tool at sort_order 3 (between the two tools)
-- ====================================================================

INSERT INTO content_blocks (lesson_id, type, sort_order, content)
VALUES (
  '6ed72e66-8372-462b-b53b-547d95a94698',
  'interactive_tool',
  3,
  '{
    "tool_type": "hourly_rate_calculator",
    "title": "What Should You Charge Per Hour?",
    "description": "Work backwards from your income goal to find the hourly rate that actually gets you there.",
    "inputs": [
      { "id": "target_income", "label": "Target Annual Income (take-home)", "type": "currency", "placeholder": "100000" },
      { "id": "billable_hours", "label": "Billable Hours per Week", "type": "number", "placeholder": "30" },
      { "id": "weeks_year", "label": "Working Weeks per Year", "type": "number", "default": 48 },
      { "id": "overhead_pct", "label": "Overhead", "type": "percentage", "default": 20 }
    ],
    "outputs": [
      { "id": "annual_hours", "label": "Total Billable Hours/Year", "formula": "billable_hours * weeks_year", "format": "number" },
      { "id": "gross_needed", "label": "Gross Revenue Needed", "formula": "target_income / (1 - overhead_pct / 100)", "format": "currency" },
      { "id": "hourly_rate", "label": "Required Hourly Rate", "formula": "annual_hours > 0 ? gross_needed / annual_hours : 0", "format": "currency", "highlight": true },
      { "id": "daily_rate", "label": "Required Daily Rate (8hr)", "formula": "hourly_rate * 8", "format": "currency", "highlight": true },
      { "id": "monthly_revenue", "label": "Monthly Revenue Target", "formula": "gross_needed / 12", "format": "currency", "highlight": true }
    ]
  }'::jsonb
);

-- ====================================================================
-- 3. Break-Even Calculator → "Your Business on One Page" lesson (940f76a1...)
--    Currently has: text (sort_order 1), action_item (sort_order 2), download (sort_order 3)
--    Insert between text and action_item
-- ====================================================================

UPDATE content_blocks
SET sort_order = 4
WHERE id = '3ae7755a-0d87-4535-a587-70f4880d2716'
  AND lesson_id = '940f76a1-1ec6-4d5b-bd9b-bb368c6c7232';

UPDATE content_blocks
SET sort_order = 5
WHERE id = '56f9751b-592e-41ed-ac11-19177aaa6b5e'
  AND lesson_id = '940f76a1-1ec6-4d5b-bd9b-bb368c6c7232';

INSERT INTO content_blocks (lesson_id, type, sort_order, content)
VALUES (
  '940f76a1-1ec6-4d5b-bd9b-bb368c6c7232',
  'interactive_tool',
  2,
  '{
    "tool_type": "breakeven_calculator",
    "title": "Break-Even Calculator",
    "description": "Find out how many jobs per month you need to cover your fixed costs before you start making profit.",
    "inputs": [
      { "id": "monthly_fixed", "label": "Monthly Fixed Costs (rent, insurance, payments)", "type": "currency", "placeholder": "4000" },
      { "id": "avg_revenue", "label": "Average Revenue per Job", "type": "currency", "placeholder": "2500" },
      { "id": "avg_cost", "label": "Average Cost per Job (materials + labor)", "type": "currency", "placeholder": "1200" }
    ],
    "outputs": [
      { "id": "profit_per_job", "label": "Profit per Job", "formula": "avg_revenue - avg_cost", "format": "currency" },
      { "id": "breakeven_jobs", "label": "Break-Even Jobs/Month", "formula": "profit_per_job > 0 ? monthly_fixed / profit_per_job : 0", "format": "number", "highlight": true },
      { "id": "breakeven_revenue", "label": "Break-Even Monthly Revenue", "formula": "profit_per_job > 0 ? (monthly_fixed / profit_per_job) * avg_revenue : 0", "format": "currency", "highlight": true },
      { "id": "monthly_profit_5", "label": "Profit at 5 Jobs/Month", "formula": "5 * profit_per_job - monthly_fixed", "format": "currency" },
      { "id": "monthly_profit_10", "label": "Profit at 10 Jobs/Month", "formula": "10 * profit_per_job - monthly_fixed", "format": "currency", "highlight": true }
    ]
  }'::jsonb
);

-- ====================================================================
-- 4. Hiring Cost Calculator → "Your First Hire" lesson (003f85c1...)
--    Currently has: text (sort_order 1), action_item (sort_order 2)
--    Insert between text and action_item
-- ====================================================================

UPDATE content_blocks
SET sort_order = 4
WHERE id = 'a8ebc30c-0f08-4c42-aa27-b9b6cce46754'
  AND lesson_id = '003f85c1-5fae-490c-b233-91c089319388';

INSERT INTO content_blocks (lesson_id, type, sort_order, content)
VALUES (
  '003f85c1-5fae-490c-b233-91c089319388',
  'interactive_tool',
  2,
  '{
    "tool_type": "hiring_cost_calculator",
    "title": "True Cost of Your First Hire",
    "description": "An employee costs more than their hourly rate. Calculate what you actually need to budget — and how much revenue they need to generate to pay for themselves.",
    "inputs": [
      { "id": "hourly_rate", "label": "Employee Hourly Rate", "type": "currency", "placeholder": "22" },
      { "id": "hours_week", "label": "Hours per Week", "type": "number", "default": 40 },
      { "id": "payroll_tax", "label": "Payroll Tax Rate", "type": "percentage", "default": 8 },
      { "id": "benefits_month", "label": "Benefits per Month", "type": "currency", "placeholder": "200" },
      { "id": "training_weeks", "label": "Training Weeks (non-productive)", "type": "number", "placeholder": "3" }
    ],
    "outputs": [
      { "id": "weekly_wage", "label": "Weekly Wage", "formula": "hourly_rate * hours_week", "format": "currency" },
      { "id": "monthly_wage", "label": "Monthly Wage (4.33 wks)", "formula": "weekly_wage * 4.33", "format": "currency" },
      { "id": "payroll_amount", "label": "Monthly Payroll Tax", "formula": "monthly_wage * payroll_tax / 100", "format": "currency" },
      { "id": "true_monthly", "label": "True Monthly Cost", "formula": "monthly_wage + payroll_amount + benefits_month", "format": "currency", "highlight": true },
      { "id": "annual_cost", "label": "Annual Cost", "formula": "true_monthly * 12", "format": "currency", "highlight": true },
      { "id": "training_cost", "label": "Training Investment", "formula": "weekly_wage * training_weeks", "format": "currency" },
      { "id": "revenue_needed", "label": "Monthly Revenue to Cover Hire", "formula": "true_monthly * 1.3", "format": "currency", "highlight": true }
    ]
  }'::jsonb
);

-- ====================================================================
-- 5. Client Value Calculator → "Client Acquisition Framework" lesson (9e9c4d81...)
--    Currently has: text (sort_order 1), action_item (sort_order 2), quiz (sort_order 3)
--    Insert between text and action_item
-- ====================================================================

UPDATE content_blocks
SET sort_order = 4
WHERE id = 'b01d088a-ef55-4b90-af83-befe1e4abe40'
  AND lesson_id = '9e9c4d81-540f-49c1-b6aa-031c1abff151';

UPDATE content_blocks
SET sort_order = 5
WHERE id = '137499c6-9cee-471a-b8a3-90e4fefe046a'
  AND lesson_id = '9e9c4d81-540f-49c1-b6aa-031c1abff151';

INSERT INTO content_blocks (lesson_id, type, sort_order, content)
VALUES (
  '9e9c4d81-540f-49c1-b6aa-031c1abff151',
  'interactive_tool',
  2,
  '{
    "tool_type": "client_value_calculator",
    "title": "Client Lifetime Value Calculator",
    "description": "See how much a single client is really worth to your business over time — and why keeping clients matters more than finding new ones.",
    "inputs": [
      { "id": "avg_job_value", "label": "Average Job Value", "type": "currency", "placeholder": "2000" },
      { "id": "jobs_per_year", "label": "Jobs per Client per Year", "type": "number", "placeholder": "2" },
      { "id": "retention_years", "label": "Average Client Retention (years)", "type": "number", "placeholder": "5" },
      { "id": "referrals", "label": "Referrals per Client (lifetime)", "type": "number", "placeholder": "2" }
    ],
    "outputs": [
      { "id": "annual_value", "label": "Annual Value per Client", "formula": "avg_job_value * jobs_per_year", "format": "currency" },
      { "id": "lifetime_direct", "label": "Direct Lifetime Value", "formula": "annual_value * retention_years", "format": "currency", "highlight": true },
      { "id": "referral_value", "label": "Referral Value", "formula": "referrals * avg_job_value", "format": "currency" },
      { "id": "total_lifetime", "label": "Total Client Value (with referrals)", "formula": "lifetime_direct + referral_value", "format": "currency", "highlight": true },
      { "id": "monthly_value", "label": "Monthly Value per Client", "formula": "retention_years > 0 ? total_lifetime / (retention_years * 12) : 0", "format": "currency", "highlight": true }
    ]
  }'::jsonb
);

-- ====================================================================
-- Verify: list all interactive_tool content blocks
-- ====================================================================
SELECT cb.id, cb.lesson_id, l.title as lesson_title, cb.sort_order
FROM content_blocks cb
JOIN lessons l ON l.id = cb.lesson_id
WHERE cb.type = 'interactive_tool'
ORDER BY l.title, cb.sort_order;
