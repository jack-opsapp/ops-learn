'use client';

import FormulaTool, { type FormulaToolConfig } from './tools/FormulaTool';
import LienDeadlineCalculator from './tools/LienDeadlineCalculator';
import CashFlowForecaster from './tools/CashFlowForecaster';
import PaymentTermsDesigner from './tools/PaymentTermsDesigner';

interface ToolConfigBase {
  tool_type: string;
  title: string;
  description: string;
}

type AnyToolConfig = ToolConfigBase & Record<string, unknown>;

export default function InteractiveTool({ config }: { config: AnyToolConfig }) {
  switch (config.tool_type) {
    case 'lien_deadline_calculator':
      return <LienDeadlineCalculator />;
    case 'cash_flow_forecaster':
      return <CashFlowForecaster />;
    case 'payment_terms_designer':
      return <PaymentTermsDesigner />;
    default:
      // Formula-driven tools (cash_gap_calculator, factoring_math_calculator, etc.)
      // fall through to FormulaTool, which expects inputs/outputs in the config.
      if ('inputs' in config && 'outputs' in config) {
        return <FormulaTool config={config as unknown as FormulaToolConfig} />;
      }
      return null;
  }
}
