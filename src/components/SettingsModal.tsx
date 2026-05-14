import { useStore } from '../store';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer bottom">
        <div className="drawer-header">
          <strong>Settings</strong>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="drawer-body">
          <div className="settings-row">
            <label htmlFor="dice-color">Dice color</label>
            <input
              id="dice-color"
              type="color"
              value={settings.diceColor}
              onChange={(e) => update({ diceColor: e.target.value })}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="material">Material</label>
            <select
              id="material"
              value={settings.diceMaterial}
              onChange={(e) => update({ diceMaterial: e.target.value as 'plastic' | 'metal' | 'wood' })}
            >
              <option value="plastic">Plastic</option>
              <option value="metal">Metal</option>
              <option value="wood">Wood</option>
            </select>
          </div>
          <div className="settings-row">
            <label htmlFor="gravity">Gravity ({settings.gravity.toFixed(2)})</label>
            <input
              id="gravity"
              type="range"
              min="1"
              max="25"
              step="0.1"
              value={settings.gravity}
              onChange={(e) => update({ gravity: parseFloat(e.target.value) })}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="haptics">Haptics</label>
            <input
              id="haptics"
              type="checkbox"
              checked={settings.hapticsEnabled}
              onChange={(e) => update({ hapticsEnabled: e.target.checked })}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="sound">Sound</label>
            <input
              id="sound"
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => update({ soundEnabled: e.target.checked })}
            />
          </div>
        </div>
      </div>
    </>
  );
}
