import { v4 as uuid } from 'uuid';
import type { DiceGroup, DieResult, ParsedExpression, Roll } from './types';

export type RNG = (sides: number) => number; // returns 1..sides

export const cryptoRng: RNG = (sides) => {
  // Unbiased rejection sampling using crypto.getRandomValues
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / sides) * sides;
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return (buf[0] % sides) + 1;
  }
};

function rollGroup(g: DiceGroup, rng: RNG): { dice: DieResult[]; kept: number[] } {
  const dice: DieResult[] = [];

  for (let i = 0; i < g.count; i++) {
    let value = rng(g.sides);
    let rerolled = false;

    if (g.reroll) {
      const { op, value: v } = g.reroll;
      const triggers =
        (op === '<' && value < v) ||
        (op === '>' && value > v) ||
        (op === '=' && value === v);
      if (triggers) {
        value = rng(g.sides);
        rerolled = true;
      }
    }

    dice.push({ sides: g.sides, value, rerolled });

    if (g.explode) {
      let last = value;
      let guard = 0;
      while (last === g.sides && guard++ < 50) {
        last = rng(g.sides);
        dice.push({ sides: g.sides, value: last, exploded: true });
      }
    }
  }

  // Compute kept indices
  const indices = dice.map((_, i) => i);
  let kept = indices.slice();

  if (g.keep) {
    const sorted = [...indices].sort((a, b) =>
      g.keep!.type === 'highest' ? dice[b].value - dice[a].value : dice[a].value - dice[b].value
    );
    kept = sorted.slice(0, g.keep.n).sort((a, b) => a - b);
  } else if (g.drop) {
    const sorted = [...indices].sort((a, b) =>
      g.drop!.type === 'highest' ? dice[b].value - dice[a].value : dice[a].value - dice[b].value
    );
    const dropped = new Set(sorted.slice(0, g.drop.n));
    kept = indices.filter((i) => !dropped.has(i));
  }

  return { dice, kept };
}

export function roll(notation: string, expr: ParsedExpression, rng: RNG = cryptoRng): Roll {
  const allDice: DieResult[] = [];
  const allKept: number[] = [];
  let total = expr.modifier;

  for (const g of expr.groups) {
    const offset = allDice.length;
    const { dice, kept } = rollGroup(g, rng);
    allDice.push(...dice);
    for (const k of kept) {
      allKept.push(k + offset);
      total += dice[k].value;
    }
  }

  // Critical detection: single d20, single die
  let critical: 'success' | 'failure' | null = null;
  if (
    expr.groups.length === 1 &&
    expr.groups[0].sides === 20 &&
    allKept.length === 1
  ) {
    const v = allDice[allKept[0]].value;
    if (v === 20) critical = 'success';
    else if (v === 1) critical = 'failure';
  }

  return {
    id: uuid(),
    notation,
    parsed: expr,
    dice: allDice,
    kept: allKept,
    modifier: expr.modifier,
    total,
    critical,
    timestamp: Date.now(),
  };
}
