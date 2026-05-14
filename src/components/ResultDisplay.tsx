import type { Roll } from '../dice/types';

export function ResultDisplay({ roll }: { roll: Roll | null }) {
  if (!roll) return null;
  const keptSet = new Set(roll.kept);
  const breakdown = roll.dice.map((d, i) => {
    const cls = keptSet.has(i) ? 'kept' : 'dropped';
    return (
      <span key={i} className={cls}>
        {d.value}
        {i < roll.dice.length - 1 ? ',' : ''}
      </span>
    );
  });

  const critClass =
    roll.critical === 'success' ? 'crit-success' : roll.critical === 'failure' ? 'crit-failure' : '';

  return (
    <div className="result-overlay" aria-live="polite">
      {roll.label && <div className="result-label">{roll.label}</div>}
      <div className={`result-total ${critClass}`}>
        {roll.total}
        {roll.critical === 'success' && ' ★'}
        {roll.critical === 'failure' && ' ✗'}
      </div>
      <div className="result-breakdown">
        [{breakdown}]
        {roll.modifier !== 0 && (roll.modifier > 0 ? ` +${roll.modifier}` : ` ${roll.modifier}`)}
        {' = '}
        {roll.total}
      </div>
    </div>
  );
}
