import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { isParseError } from './types';

describe('parser', () => {
  it('parses simple dice', () => {
    const r = parse('1d20');
    expect(isParseError(r)).toBe(false);
    if (!isParseError(r)) {
      expect(r.groups[0]).toMatchObject({ count: 1, sides: 20 });
      expect(r.modifier).toBe(0);
    }
  });

  it('parses with modifier', () => {
    const r = parse('1d20+5');
    if (isParseError(r)) throw new Error('parse failed');
    expect(r.modifier).toBe(5);
  });

  it('parses 4d6dl1+2 stat roll', () => {
    const r = parse('4d6dl1+2');
    if (isParseError(r)) throw new Error('parse failed');
    expect(r.groups[0]).toMatchObject({ count: 4, sides: 6, drop: { type: 'lowest', n: 1 } });
    expect(r.modifier).toBe(2);
  });

  it('parses advantage 2d20kh1', () => {
    const r = parse('2d20kh1');
    if (isParseError(r)) throw new Error('parse failed');
    expect(r.groups[0].keep).toEqual({ type: 'highest', n: 1 });
  });

  it('parses exploding 1d6!', () => {
    const r = parse('1d6!');
    if (isParseError(r)) throw new Error('parse failed');
    expect(r.groups[0].explode).toBe(true);
  });

  it('parses reroll 1d10r<2', () => {
    const r = parse('1d10r<2');
    if (isParseError(r)) throw new Error('parse failed');
    expect(r.groups[0].reroll).toEqual({ op: '<', value: 2 });
  });

  it('parses multiple groups 2d8+1d6+3', () => {
    const r = parse('2d8+1d6+3');
    if (isParseError(r)) throw new Error('parse failed');
    expect(r.groups).toHaveLength(2);
    expect(r.modifier).toBe(3);
  });

  it('rejects unsupported die', () => {
    expect(isParseError(parse('1d7'))).toBe(true);
  });

  it('rejects empty', () => {
    expect(isParseError(parse(''))).toBe(true);
  });

  it('rejects garbage modifier', () => {
    expect(isParseError(parse('1d6xyz'))).toBe(true);
  });
});
