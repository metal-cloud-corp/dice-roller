import { useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useStore } from './store';
import { DiceScene } from './three/DiceScene';
import { parse } from './dice/parser';
import { isParseError } from './dice/types';
import { useRoll } from './hooks/useRoll';
import { ResultDisplay } from './components/ResultDisplay';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100];

const BUILTIN_PRESETS: { name: string; notation: string }[] = [
  { name: 'Stat roll', notation: '4d6dl1' },
  { name: 'Advantage', notation: '2d20kh1' },
  { name: 'Disadvantage', notation: '2d20kl1' },
];

export function App() {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DiceScene | null>(null);
  const init = useStore((s) => s.init);
  const presets = useStore((s) => s.presets);
  const savePreset = useStore((s) => s.savePreset);
  const deletePreset = useStore((s) => s.deletePreset);
  const settings = useStore((s) => s.settings);
  const currentRoll = useStore((s) => s.currentRoll);

  const [notation, setNotation] = useState('1d20');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { submit, rolling } = useRoll(sceneRef);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!canvasWrapRef.current) return;
    const scene = new DiceScene(canvasWrapRef.current);
    scene.setColor(settings.diceColor);
    scene.setGravity(settings.gravity);
    sceneRef.current = scene;
    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setColor(settings.diceColor);
    sceneRef.current?.setGravity(settings.gravity);
  }, [settings.diceColor, settings.gravity]);

  const parsed = parse(notation);
  const valid = !isParseError(parsed);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!valid) return;
    submit(notation);
  };

  const rollQuick = (sides: number) => {
    const n = `1d${sides}`;
    setNotation(n);
    submit(n);
  };

  const addPreset = () => {
    if (!valid) return;
    const name = prompt('Name this preset:', notation);
    if (!name) return;
    savePreset({ id: uuid(), name, notation, createdAt: Date.now() });
  };

  return (
    <div className="app">
      <div className="topbar">
        <h1>🎲 Dice Roller</h1>
        <div className="actions">
          <button onClick={() => setShowHistory(true)} aria-label="History">History</button>
          <button onClick={() => setShowSettings(true)} aria-label="Settings">⚙</button>
        </div>
      </div>

      <div className="canvas-wrap" ref={canvasWrapRef}>
        <ResultDisplay roll={currentRoll} />
      </div>

      <div className="controls">
        <div className="quick-bar">
          {QUICK_DICE.map((s) => (
            <button key={s} onClick={() => rollQuick(s)} disabled={rolling}>
              d{s}
            </button>
          ))}
        </div>

        <form className="notation-row" onSubmit={handleSubmit}>
          <input
            type="text"
            value={notation}
            onChange={(e) => setNotation(e.target.value)}
            className={notation === '' ? '' : valid ? 'valid' : 'invalid'}
            placeholder="e.g. 4d6dl1+2"
            aria-label="Dice notation"
          />
          <button type="submit" className="primary" disabled={!valid || rolling}>
            Roll
          </button>
        </form>

        <div className="presets">
          {BUILTIN_PRESETS.map((p) => (
            <button key={p.name} onClick={() => { setNotation(p.notation); submit(p.notation, p.name); }} disabled={rolling}>
              {p.name}
            </button>
          ))}
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => { setNotation(p.notation); submit(p.notation, p.name); }}
              onContextMenu={(e) => { e.preventDefault(); if (confirm(`Delete preset "${p.name}"?`)) deletePreset(p.id); }}
              disabled={rolling}
            >
              {p.name}
            </button>
          ))}
          <button className="preset-add" onClick={addPreset} disabled={!valid}>+ Save</button>
        </div>
      </div>

      {showHistory && <HistoryDrawer onClose={() => setShowHistory(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
