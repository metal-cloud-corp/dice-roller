import { useCallback, useRef } from 'react';
import { parse } from '../dice/parser';
import { roll as computeRoll } from '../dice/roller';
import { isParseError } from '../dice/types';
import { useStore } from '../store';
import type { DiceScene } from '../three/DiceScene';

export function useRoll(sceneRef: React.MutableRefObject<DiceScene | null>) {
  const addRoll = useStore((s) => s.addRoll);
  const setRolling = useStore((s) => s.setRolling);
  const rolling = useStore((s) => s.rolling);
  const settings = useStore((s) => s.settings);
  const busy = useRef(false);

  const submit = useCallback(
    async (notation: string, label?: string) => {
      if (busy.current) return { ok: false as const, error: 'Already rolling' };
      const parsed = parse(notation);
      if (isParseError(parsed)) return { ok: false as const, error: parsed.error };

      busy.current = true;
      setRolling(true);
      try {
        const result = computeRoll(notation, parsed);
        if (label) result.label = label;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (sceneRef.current && !reducedMotion) {
          await sceneRef.current.rollDice(result.dice);
        }
        await addRoll(result);

        if (settings.hapticsEnabled && navigator.vibrate) {
          navigator.vibrate(result.critical ? 200 : 30);
        }

        return { ok: true as const, roll: result };
      } finally {
        busy.current = false;
        setRolling(false);
      }
    },
    [addRoll, setRolling, sceneRef, settings.hapticsEnabled]
  );

  return { submit, rolling };
}
