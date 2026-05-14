import type { DiceGroup, ParseError, ParsedExpression } from './types';

// Grammar:
//   expr     := term (('+'|'-') term)*
//   term     := diceGroup | integer
//   diceGroup:= [int] 'd' int (modifier)*
//   modifier := 'kh'int | 'kl'int | 'dh'int | 'dl'int | '!' | 'r' ('<'|'>'|'=') int

export function parse(input: string): ParsedExpression | ParseError {
  const s = input.replace(/\s+/g, '').toLowerCase();
  if (!s) return { error: 'Empty expression' };

  const groups: DiceGroup[] = [];
  let modifier = 0;
  let i = 0;
  let sign = 1;

  while (i < s.length) {
    // read a term
    const start = i;
    // a term either contains 'd' (dice) or is purely numeric
    let j = i;
    while (j < s.length && s[j] !== '+' && s[j] !== '-') j++;
    const termStr = s.slice(i, j);
    if (!termStr) return { error: 'Unexpected operator', position: i };

    if (termStr.includes('d')) {
      const g = parseGroup(termStr, start);
      if ('error' in g) return g;
      if (sign === -1) {
        return { error: 'Dice groups cannot be subtracted', position: start };
      }
      groups.push(g);
    } else {
      const n = Number(termStr);
      if (!Number.isFinite(n)) return { error: `Invalid number "${termStr}"`, position: start };
      modifier += sign * n;
    }

    i = j;
    if (i < s.length) {
      sign = s[i] === '-' ? -1 : 1;
      i++;
    }
  }

  if (groups.length === 0) return { error: 'No dice in expression' };
  return { groups, modifier };
}

function parseGroup(str: string, offset: number): DiceGroup | ParseError {
  const m = /^(\d*)d(\d+)(.*)$/.exec(str);
  if (!m) return { error: `Invalid dice group "${str}"`, position: offset };
  const count = m[1] === '' ? 1 : parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  if (count <= 0 || count > 100) return { error: 'Dice count must be 1-100', position: offset };
  if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) {
    return { error: `Unsupported die: d${sides}`, position: offset };
  }
  const g: DiceGroup = { count, sides };
  let rest = m[3];

  while (rest.length > 0) {
    const kh = /^kh(\d+)/.exec(rest);
    const kl = /^kl(\d+)/.exec(rest);
    const dh = /^dh(\d+)/.exec(rest);
    const dl = /^dl(\d+)/.exec(rest);
    const rr = /^r([<>=])(\d+)/.exec(rest);
    if (kh) { g.keep = { type: 'highest', n: parseInt(kh[1], 10) }; rest = rest.slice(kh[0].length); }
    else if (kl) { g.keep = { type: 'lowest', n: parseInt(kl[1], 10) }; rest = rest.slice(kl[0].length); }
    else if (dh) { g.drop = { type: 'highest', n: parseInt(dh[1], 10) }; rest = rest.slice(dh[0].length); }
    else if (dl) { g.drop = { type: 'lowest', n: parseInt(dl[1], 10) }; rest = rest.slice(dl[0].length); }
    else if (rest[0] === '!') { g.explode = true; rest = rest.slice(1); }
    else if (rr) {
      g.reroll = { op: rr[1] as '<' | '>' | '=', value: parseInt(rr[2], 10) };
      rest = rest.slice(rr[0].length);
    } else {
      return { error: `Unknown modifier "${rest}"`, position: offset };
    }
  }

  if (g.keep && g.keep.n > g.count) return { error: 'Keep count exceeds dice count', position: offset };
  if (g.drop && g.drop.n >= g.count) return { error: 'Drop count must be less than dice count', position: offset };

  return g;
}
