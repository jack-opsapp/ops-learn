/**
 * Safe math expression evaluator.
 * Evaluates arithmetic expressions with named variables.
 * Uses a recursive descent parser — does NOT use eval() or Function().
 *
 * Supports: +, -, *, /, %, parentheses, ternary (a > b ? c : d),
 * comparisons (>, <, >=, <=, ==, !=), and named variables.
 */

type Token =
  | { type: 'number'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'ternary'; value: '?' | ':' };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) { i++; continue; }

    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i++];
      }
      tokens.push({ type: 'number', value: parseFloat(num) });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i++];
      }
      tokens.push({ type: 'ident', value: ident });
      continue;
    }

    if (i + 1 < expr.length) {
      const two = ch + expr[i + 1];
      if (['>=', '<=', '==', '!='].includes(two)) {
        tokens.push({ type: 'op', value: two });
        i += 2;
        continue;
      }
    }

    if ('+-*/%'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    if (ch === '>' || ch === '<') {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }

    if (ch === '?') {
      tokens.push({ type: 'ternary', value: '?' });
      i++;
      continue;
    }
    if (ch === ':') {
      tokens.push({ type: 'ternary', value: ':' });
      i++;
      continue;
    }

    i++;
  }

  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos: number;
  private vars: Record<string, number>;

  constructor(tokens: Token[], vars: Record<string, number>) {
    this.tokens = tokens;
    this.pos = 0;
    this.vars = vars;
  }

  private peek(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  parse(): number {
    return this.parseTernary();
  }

  private parseTernary(): number {
    const condition = this.parseComparison();
    const next = this.peek();
    if (next?.type === 'ternary' && next.value === '?') {
      this.consume();
      const thenVal = this.parseTernary();
      const colon = this.peek();
      if (colon?.type === 'ternary' && colon.value === ':') {
        this.consume();
        const elseVal = this.parseTernary();
        return condition ? thenVal : elseVal;
      }
      return condition ? thenVal : 0;
    }
    return condition;
  }

  private parseComparison(): number {
    let left = this.parseAddSub();
    let next = this.peek();
    while (next?.type === 'op' && ['>', '<', '>=', '<=', '==', '!='].includes(next.value)) {
      const op = this.consume().value;
      const right = this.parseAddSub();
      switch (op) {
        case '>': left = left > right ? 1 : 0; break;
        case '<': left = left < right ? 1 : 0; break;
        case '>=': left = left >= right ? 1 : 0; break;
        case '<=': left = left <= right ? 1 : 0; break;
        case '==': left = left === right ? 1 : 0; break;
        case '!=': left = left !== right ? 1 : 0; break;
      }
      next = this.peek();
    }
    return left;
  }

  private parseAddSub(): number {
    let left = this.parseMulDiv();
    let next = this.peek();
    while (next?.type === 'op' && (next.value === '+' || next.value === '-')) {
      const op = this.consume().value;
      const right = this.parseMulDiv();
      left = op === '+' ? left + right : left - right;
      next = this.peek();
    }
    return left;
  }

  private parseMulDiv(): number {
    let left = this.parseUnary();
    let next = this.peek();
    while (next?.type === 'op' && (next.value === '*' || next.value === '/' || next.value === '%')) {
      const op = this.consume().value;
      const right = this.parseUnary();
      if (op === '*') left = left * right;
      else if (op === '/') left = right !== 0 ? left / right : 0;
      else left = right !== 0 ? left % right : 0;
      next = this.peek();
    }
    return left;
  }

  private parseUnary(): number {
    const next = this.peek();
    if (next?.type === 'op' && next.value === '-') {
      this.consume();
      return -this.parsePrimary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.peek();
    if (!token) return 0;

    if (token.type === 'number') {
      this.consume();
      return token.value;
    }

    if (token.type === 'ident') {
      this.consume();
      return this.vars[token.value] ?? 0;
    }

    if (token.type === 'paren' && token.value === '(') {
      this.consume();
      const result = this.parseTernary();
      const closing = this.peek();
      if (closing?.type === 'paren' && closing.value === ')') {
        this.consume();
      }
      return result;
    }

    this.consume();
    return 0;
  }
}

/**
 * Safely evaluate a math formula with variable substitution.
 * Uses a recursive descent parser — no code execution.
 * Returns the computed number, or 0 if invalid.
 */
export function evaluateFormula(
  formula: string,
  variables: Record<string, number>
): number {
  try {
    const tokens = tokenize(formula);
    const parser = new Parser(tokens, variables);
    const result = parser.parse();
    return isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}
