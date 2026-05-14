import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { roll } from './roller';
import { isParseError } from './types';

function deterministic(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('roller', () => {
  it('rolls 1d20+5', () => {
    const p = parse('1d20+5');
    if (isParseError(p)) throw new Error('parse');
    const r = roll('1d20+5', p, deterministic([15]));
    expect(r.total).toBe(20);
    expect(r.dice[0].value).toBe(15);
  });

  it('drops lowest in 4d6dl1', () => {
    const p = parse('4d6dl1');
    if (isParseError(p)) throw new Error('parse');
    const r = roll('4d6dl1', p, deterministic([5, 4, 3, 2]));
    expect(r.total).toBe(12); // 5+4+3
    expect(r.kept).toEqual([0, 1, 2]);
  });

  it('keeps highest in 2d20kh1', () => {
    const p = parse('2d20kh1');
    if (isParseError(p)) throw new Error('parse');
    const r = roll('2d20kh1', p, deterministic([7, 18]));
    expect(r.total).toBe(18);
    expect(r.kept).toEqual([1]);
  });

  it('detects nat 20 crit', () => {
    const p = parse('1d20');
    if (isParseError(p)) throw new Error('parse');
    const r = roll('1d20', p, deterministic([20]));
    expect(r.critical).toBe('success');
  });

  it('detects nat 1 crit failure', () => {
    const p = parse('1d20');
    if (isParseError(p)) throw new Error('parse');
    const r = roll('1d20', p, deterministic([1]));
    expect(r.critical).toBe('failure');
  });

  it('explodes on max', () => {
    const p = parse('1d6!');
    if (isParseError(p)) throw new Error('parse');
    const r = roll('1d6!', p, deterministic([6, 6, 3]));
    expect(r.dice).toHaveLength(3);
    expect(r.total).toBe(15);
  });

  it('rerolls below threshold', () => {
    const p = parse('1d10r<3');
    if (isParseError(p)) throw new Error('parse');
    const r = roll('1d10r<3', p, deterministic([1, 8]));
    expect(r.dice[0].value).toBe(8);
    expect(r.dice[0].rerolled).toBe(true);
  });

  it('sums multiple groups', () => {
    const p = parse('2d8+1d6+3');
    if (isParseError(p)) throw new Error('parse');
    const r = roll('2d8+1d6+3', p, deterministic([5, 6, 4]));
    expect(r.total).toBe(18);
  });
});
