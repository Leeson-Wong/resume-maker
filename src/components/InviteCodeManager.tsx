import { useState, useEffect, useCallback } from 'react';

interface InviteCode {
  code: string;
  label: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt: string | null;
  accessLog: Array<{ time: string; tool: string }>;
}

export function InviteCodeManager() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/invite-codes');
      if (res.ok) {
        setCodes(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    const res = await fetch('/api/invite-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel.trim() }),
    });
    if (res.ok) {
      setNewLabel('');
      fetchCodes();
    }
  };

  const handleRevoke = async (code: string) => {
    const res = await fetch(`/api/invite-codes/${code}`, { method: 'DELETE' });
    if (res.ok) fetchCodes();
  };

  const toggleExpand = (code: string) => {
    setExpandedCode(expandedCode === code ? null : code);
  };

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>;

  const activeCodes = codes.filter((c) => c.status === 'active');
  const revokedCodes = codes.filter((c) => c.status === 'revoked');

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Invite Codes</h3>

      {/* Create new */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label (e.g. Google-HR)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={!newLabel.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate
        </button>
      </div>

      {/* Active codes */}
      {activeCodes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">Active ({activeCodes.length})</h4>
          {activeCodes.map((c) => (
            <CodeCard key={c.code} code={c} onRevoke={handleRevoke} expanded={expandedCode === c.code} onToggle={() => toggleExpand(c.code)} />
          ))}
        </div>
      )}

      {/* Revoked codes */}
      {revokedCodes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Revoked ({revokedCodes.length})</h4>
          {revokedCodes.map((c) => (
            <CodeCard key={c.code} code={c} expanded={expandedCode === c.code} onToggle={() => toggleExpand(c.code)} />
          ))}
        </div>
      )}

      {codes.length === 0 && (
        <p className="text-sm text-gray-500">No invite codes yet. Generate one to share with recruiters.</p>
      )}
    </div>
  );
}

function CodeCard({
  code,
  onRevoke,
  expanded,
  onToggle,
}: {
  code: InviteCode;
  onRevoke?: (code: string) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accessCount = code.accessLog.length;
  const isRevoked = code.status === 'revoked';

  return (
    <div className={`border rounded-lg p-3 ${isRevoked ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-300 bg-white'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <code className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono select-all">{code.code}</code>
          <span className="text-sm text-gray-600 truncate">{code.label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onToggle} className="text-xs text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1">
            {accessCount} accesses
            <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {onRevoke && (
            <button
              onClick={() => onRevoke(code.code)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Revoke
            </button>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Created {new Date(code.createdAt).toLocaleDateString()}
        {isRevoked && code.revokedAt && ` · Revoked ${new Date(code.revokedAt).toLocaleDateString()}`}
      </div>
      {expanded && code.accessLog.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            {code.accessLog.slice(-10).reverse().map((log, i) => (
              <div key={i} className="flex justify-between">
                <span>{log.tool}</span>
                <span>{new Date(log.time).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
