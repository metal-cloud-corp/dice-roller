export type DieSides = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export interface DieResult {
  sides: number;
  value: number;
  exploded?: boolean;
  rerolled?: boolean;
}

export interface DiceGroup {
  count: number;
  sides: number;
  keep?: { type: 'highest' | 'lowest'; n: number };
  drop?: { type: 'highest' | 'lowest'; n: number };
  explode?: boolean;
  reroll?: { op: '<' | '>' | '='; value: number };
}

export interface ParsedExpression {
  groups: DiceGroup[];
  modifier: number;
}

export interface ParseError {
  error: string;
  position?: number;
}

export interface Roll {
  id: string;
  notation: string;
  parsed: ParsedExpression;
  dice: DieResult[];
  kept: number[];
  modifier: number;
  total: number;
  label?: string;
  critical?: 'success' | 'failure' | null;
  timestamp: number;
  syncedAt?: number;
}

export interface Preset {
  id: string;
  name: string;
  notation: string;
  createdAt: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  diceColor: string;
  diceMaterial: 'plastic' | 'metal' | 'wood';
  soundEnabled: boolean;
  gravity: number;
  tableFriction: number;
  autoClearMs: number;
  hapticsEnabled: boolean;
}

export function isParseError(x: ParsedExpression | ParseError): x is ParseError {
  return (x as ParseError).error !== undefined;
}
