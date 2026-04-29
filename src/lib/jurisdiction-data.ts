/**
 * Jurisdiction-specific legal data for service businesses.
 *
 * Covers Canadian provinces and major US states. Data is sourced from public legal
 * resources and is intended as general guidance — not legal advice. Always consult
 * a lawyer in your jurisdiction before acting on a specific situation.
 *
 * Last reviewed: 2026-04
 */

export type Country = 'CA' | 'US' | 'OTHER';

export interface Jurisdiction {
  code: string;
  name: string;
  country: Country;
  // Lien filing window from substantial completion (or last day of work for subs)
  lienFilingDays: number | null;
  lienNotes: string;
  // Whether prompt-payment legislation is in force
  promptPaymentDays: number | null;
  promptPaymentNotes: string;
  // Small claims court limit (CAD for Canadian, USD for US)
  smallClaimsLimit: number | null;
  smallClaimsNotes: string;
  // Deposit cap on residential service work
  depositCapType: 'percentage' | 'absolute' | 'both' | 'none';
  depositCapPercent: number | null;
  depositCapAbsolute: number | null;
  depositNotes: string;
}

export const JURISDICTIONS: Jurisdiction[] = [
  // ===== Canadian Provinces =====
  {
    code: 'ON',
    name: 'Ontario',
    country: 'CA',
    lienFilingDays: 60,
    lienNotes:
      'As of January 1, 2026 (was 45 days). Register Statement of Lien against title at Land Registry. Annual holdback release now mandatory.',
    promptPaymentDays: 28,
    promptPaymentNotes:
      'Construction Act prompt-payment regime: invoice paid within 28 days of receipt unless disputed in writing within 14 days. Adjudication available.',
    smallClaimsLimit: 50000,
    smallClaimsNotes:
      'Raised to $50,000 effective October 1, 2025. Filing fees $75–$215 depending on claim size.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'No statutory cap. 10-day cooling-off for direct/door-to-door contracts. Written contracts required for renovation work over $50.',
  },
  {
    code: 'BC',
    name: 'British Columbia',
    country: 'CA',
    lienFilingDays: 45,
    lienNotes:
      'Filed at BC Land Title Office. 10% statutory holdback released after lien filing window closes.',
    promptPaymentDays: null,
    promptPaymentNotes: 'No construction-specific prompt-payment legislation as of 2026.',
    smallClaimsLimit: 35000,
    smallClaimsNotes:
      'Civil Resolution Tribunal handles claims up to $5,000 online (faster, no filing fee). Small Claims Court handles $5,001–$35,000.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'No statutory cap on most service work. 10-day cooling-off for unsolicited/door-to-door sales under BPCPA.',
  },
  {
    code: 'AB',
    name: 'Alberta',
    country: 'CA',
    lienFilingDays: 45,
    lienNotes:
      'Builders\' Lien Act covers construction and improvement work. Filed at provincial Land Titles registry.',
    promptPaymentDays: 28,
    promptPaymentNotes:
      'Prompt Payment and Construction Lien Act: 28 days from invoice receipt. Adjudication regime in force.',
    smallClaimsLimit: 100000,
    smallClaimsNotes:
      'Highest small claims limit in Canada — Alberta Court of Justice handles civil claims up to $100,000.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'Lighter regulation on deposits. Standard consumer protection rules apply.',
  },
  {
    code: 'SK',
    name: 'Saskatchewan',
    country: 'CA',
    lienFilingDays: 40,
    lienNotes:
      'Builders\' Lien Act. Filed at provincial Land Titles registry.',
    promptPaymentDays: null,
    promptPaymentNotes: 'No construction-specific prompt-payment legislation as of 2026.',
    smallClaimsLimit: 50000,
    smallClaimsNotes:
      'Provincial Court of Saskatchewan small claims jurisdiction.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'Lighter regulation on deposits. Standard consumer protection rules apply.',
  },
  {
    code: 'MB',
    name: 'Manitoba',
    country: 'CA',
    lienFilingDays: 40,
    lienNotes:
      'Builders\' Liens Act has been substantially unchanged for decades — among tightest deadlines in Canada.',
    promptPaymentDays: null,
    promptPaymentNotes: 'No construction-specific prompt-payment legislation as of 2026.',
    smallClaimsLimit: 20000,
    smallClaimsNotes:
      'Raised to $20,000 effective January 1, 2025.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'Lighter regulation on deposits. Standard consumer protection rules apply.',
  },
  {
    code: 'QC',
    name: 'Quebec',
    country: 'CA',
    lienFilingDays: 30,
    lienNotes:
      'Different regime — uses "legal hypothec" (hypothèque légale). Registration within 30 days of work end. Notice must be served and registered.',
    promptPaymentDays: null,
    promptPaymentNotes:
      'No construction-specific prompt-payment legislation. Civil Code addresses similar issues.',
    smallClaimsLimit: 15000,
    smallClaimsNotes:
      'Quebec Cour des petites créances — lowest small claims limit in Canada.',
    depositCapType: 'percentage',
    depositCapPercent: 10,
    depositCapAbsolute: null,
    depositNotes:
      'Quebec Consumer Protection Act caps residential renovation deposits at 10%. Written contracts required. 10-day cancellation right on home contracts.',
  },
  {
    code: 'NS',
    name: 'Nova Scotia',
    country: 'CA',
    lienFilingDays: 60,
    lienNotes:
      'Builders\' Lien Act. Prompt-payment regime in development as of 2026.',
    promptPaymentDays: null,
    promptPaymentNotes: 'In legislative development as of 2026.',
    smallClaimsLimit: 25000,
    smallClaimsNotes:
      'Small Claims Court of Nova Scotia.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'Standard consumer protection rules apply. Written contracts required above certain thresholds.',
  },
  {
    code: 'NB',
    name: 'New Brunswick',
    country: 'CA',
    lienFilingDays: 60,
    lienNotes:
      'Mechanics\' Lien Act. Prompt-payment regime in development as of 2026.',
    promptPaymentDays: null,
    promptPaymentNotes: 'In legislative development as of 2026.',
    smallClaimsLimit: 20000,
    smallClaimsNotes:
      'Small Claims Court of New Brunswick.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'Standard consumer protection rules apply.',
  },
  {
    code: 'NL',
    name: 'Newfoundland & Labrador',
    country: 'CA',
    lienFilingDays: 45,
    lienNotes: 'Mechanics\' Lien Act.',
    promptPaymentDays: null,
    promptPaymentNotes: 'No construction-specific prompt-payment legislation as of 2026.',
    smallClaimsLimit: 25000,
    smallClaimsNotes: 'Provincial Court small claims jurisdiction.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes: 'Standard consumer protection rules apply.',
  },
  {
    code: 'PE',
    name: 'Prince Edward Island',
    country: 'CA',
    lienFilingDays: 45,
    lienNotes: 'Mechanics\' Lien Act.',
    promptPaymentDays: null,
    promptPaymentNotes: 'No construction-specific prompt-payment legislation as of 2026.',
    smallClaimsLimit: 16000,
    smallClaimsNotes: 'PEI Supreme Court small claims jurisdiction.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes: 'Standard consumer protection rules apply.',
  },
  {
    code: 'NT',
    name: 'Northwest Territories',
    country: 'CA',
    lienFilingDays: 45,
    lienNotes:
      'Builders\' Lien Act came into force September 1, 2025. New prompt-payment provisions modelled on Ontario.',
    promptPaymentDays: 28,
    promptPaymentNotes:
      'Prompt-payment provisions in force as of September 2025.',
    smallClaimsLimit: 35000,
    smallClaimsNotes:
      'Territorial Court of NWT small claims jurisdiction.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes: 'Standard consumer protection rules apply.',
  },

  // ===== US States (most common service-business jurisdictions) =====
  {
    code: 'CA-US',
    name: 'California',
    country: 'US',
    lienFilingDays: 90,
    lienNotes:
      'Preliminary notice within 20 days of starting work or first material delivery is REQUIRED — sent to owner, GC, and construction lender. Without it, lien rights are lost.',
    promptPaymentDays: null,
    promptPaymentNotes:
      'Federal Prompt Payment Act applies to federal projects. Private commercial relies on contract terms.',
    smallClaimsLimit: 12500,
    smallClaimsNotes:
      'Individuals up to $12,500. Businesses up to $6,250. Court fees $30–$100 depending on claim.',
    depositCapType: 'both',
    depositCapPercent: 10,
    depositCapAbsolute: 1000,
    depositNotes:
      'Residential home improvement: deposit capped at 10% of contract OR $1,000, whichever is LESS. CSLB enforces strictly — violations risk license suspension.',
  },
  {
    code: 'TX',
    name: 'Texas',
    country: 'US',
    lienFilingDays: 120,
    lienNotes:
      'Monthly notice required — sent for each month of work, by the 15th of the third month after the work month. Lien filing: 4 months from last work (residential) or 15th of 4th month (commercial).',
    promptPaymentDays: null,
    promptPaymentNotes:
      'Federal Prompt Payment Act applies to federal projects.',
    smallClaimsLimit: 20000,
    smallClaimsNotes:
      'Justice Court small claims jurisdiction up to $20,000.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'No specific deposit cap on most residential work. State consumer protection rules apply.',
  },
  {
    code: 'FL',
    name: 'Florida',
    country: 'US',
    lienFilingDays: 90,
    lienNotes:
      'Notice to Owner required within 45 days of first furnishing work or materials (subs and suppliers). Lien filing: 90 days from last day of work. Court action: 1 year from filing.',
    promptPaymentDays: null,
    promptPaymentNotes:
      'Florida Prompt Payment Act applies to public works.',
    smallClaimsLimit: 8000,
    smallClaimsNotes:
      'County Court small claims jurisdiction up to $8,000.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'No specific deposit cap. Customary 25–50% deposits common and accepted.',
  },
  {
    code: 'NY',
    name: 'New York',
    country: 'US',
    lienFilingDays: 240,
    lienNotes:
      'No preliminary notice required for most projects. Lien filing: 8 months from last day of work (single-family residential: 4 months). Court action: 1 year from filing.',
    promptPaymentDays: null,
    promptPaymentNotes:
      'NY Prompt Payment Act applies to private and public construction.',
    smallClaimsLimit: 10000,
    smallClaimsNotes:
      'NYC Civil Court small claims up to $10,000. Other counties typically $5,000.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'No specific deposit cap on most residential work.',
  },
  {
    code: 'WA',
    name: 'Washington',
    country: 'US',
    lienFilingDays: 90,
    lienNotes:
      'Preliminary notice within 60 days of first furnishing labor or materials. Lien filing: 90 days from last day of work. Notarized Claim of Lien recorded with county auditor.',
    promptPaymentDays: null,
    promptPaymentNotes:
      'Washington Prompt Payment statute applies to public works.',
    smallClaimsLimit: 10000,
    smallClaimsNotes:
      'District Court small claims jurisdiction up to $10,000.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'No specific deposit cap on most residential work.',
  },
  {
    code: 'MA',
    name: 'Massachusetts',
    country: 'US',
    lienFilingDays: 90,
    lienNotes:
      'Notice of Contract recorded within 90 days of last work for subs. Statement of Account: 30 days after Notice of Contract.',
    promptPaymentDays: null,
    promptPaymentNotes:
      'MA Prompt Payment Act applies to private commercial construction over $3M.',
    smallClaimsLimit: 7000,
    smallClaimsNotes:
      'District Court small claims jurisdiction up to $7,000.',
    depositCapType: 'percentage',
    depositCapPercent: 33,
    depositCapAbsolute: null,
    depositNotes:
      'Home Improvement Contractor Act limits deposit to 33% of total contract on residential work.',
  },
  {
    code: 'MN',
    name: 'Minnesota',
    country: 'US',
    lienFilingDays: 120,
    lienNotes:
      'Subcontractor\'s notice within 45 days of first furnishing labor or materials. Lien filing: 120 days from last day of work.',
    promptPaymentDays: null,
    promptPaymentNotes:
      'MN Prompt Payment statute applies to public works.',
    smallClaimsLimit: 15000,
    smallClaimsNotes:
      'Conciliation Court small claims jurisdiction up to $15,000.',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes: 'No specific deposit cap on most residential work.',
  },

  // ===== Agnostic fallback =====
  {
    code: 'OTHER',
    name: 'Other / Not Listed',
    country: 'OTHER',
    lienFilingDays: null,
    lienNotes:
      'Lien deadlines vary by jurisdiction. Most are in the 30–120 day range from substantial completion. Verify with your local registrar or a construction lawyer before relying on a deadline.',
    promptPaymentDays: null,
    promptPaymentNotes:
      'Prompt-payment legislation varies. Check whether your jurisdiction has any.',
    smallClaimsLimit: null,
    smallClaimsNotes:
      'Small claims limits vary widely. Search "[your jurisdiction] small claims court limits."',
    depositCapType: 'none',
    depositCapPercent: null,
    depositCapAbsolute: null,
    depositNotes:
      'Verify deposit rules with your jurisdiction\'s consumer protection authority before adopting a standard deposit policy.',
  },
];

export function getJurisdiction(code: string): Jurisdiction | undefined {
  return JURISDICTIONS.find((j) => j.code === code);
}

export function jurisdictionsByCountry(country: Country): Jurisdiction[] {
  return JURISDICTIONS.filter((j) => j.country === country);
}
