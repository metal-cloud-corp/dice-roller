import { useStore } from '../store';
import { exportHistory } from '../storage/db';

export function HistoryDrawer({ onClose }: { onClose: () => void }) {
  const history = useStore((s) => s.history);
  const deleteRoll = useStore((s) => s.deleteRoll);
  const clearHistory = useStore((s) => s.clearHistory);

  const handleExport = async () => {
    const blob = await exportHistory();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dice-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer bottom">
        <div className="drawer-header">
          <strong>History ({history.length})</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExport}>Export</button>
            <button onClick={() => confirm('Clear all rolls?') && clearHistory()}>Clear</button>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="drawer-body">
          {history.length === 0 && <p style={{ color: 'var(--muted)' }}>No rolls yet.</p>}
          {history.map((r) => (
            <div key={r.id} className="history-row">
              <div>
                <div>
                  <strong>{r.notation}</strong>
                  {r.label && <span style={{ color: 'var(--muted)' }}> — {r.label}</span>}
                </div>
                <div className="meta">{new Date(r.timestamp).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="total">{r.total}</div>
                <button className="delete-btn" onClick={() => deleteRoll(r.id)} aria-label="Delete roll">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
