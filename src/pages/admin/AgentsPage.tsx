import { useState, useEffect } from 'react';
import { Server, Plus, Trash2, Copy, Check, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AgentKey, AgentType } from '../../lib/types';

interface NewKeyResult {
  rawKey: string;
  label: string;
  id: string;
}

export default function AgentsPage() {
  const [keys, setKeys] = useState<AgentKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [createForm, setCreateForm] = useState({ label: '', agentType: 'nas' as AgentType });
  const [creating, setCreating] = useState(false);

  async function loadKeys() {
    setLoading(true);
    const { data } = await supabase
      .from('agent_keys')
      .select('id, label, agent_type, agent_id, active, last_used_at, created_at')
      .order('created_at', { ascending: false });
    setKeys(
      (data ?? []).map(r => ({
        id: r.id,
        label: r.label,
        agentType: r.agent_type,
        agentId: r.agent_id,
        active: r.active,
        lastUsedAt: r.last_used_at,
        createdAt: r.created_at,
      }))
    );
    setLoading(false);
  }

  useEffect(() => { loadKeys(); }, []);

  async function createKey() {
    if (!createForm.label.trim()) return;
    setCreating(true);

    const rawKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const { data, error } = await supabase
      .from('agent_keys')
      .insert({
        label: createForm.label.trim(),
        agent_type: createForm.agentType,
        key_hash: keyHash,
      })
      .select('id')
      .single();

    if (!error && data) {
      setNewKey({ rawKey, label: createForm.label, id: data.id });
      setShowCreate(false);
      setCreateForm({ label: '', agentType: 'nas' });
      loadKeys();
    }
    setCreating(false);
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this key? The agent using it will stop working.')) return;
    await supabase.from('agent_keys').update({ active: false }).eq('id', id);
    loadKeys();
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold">Agents</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage agent API keys for NAS and render agents</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadKeys} className="btn-ghost p-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5">
            <Plus className="w-3.5 h-3.5" />
            New key
          </button>
        </div>
      </div>

      {newKey && (
        <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
          <p className="text-sm font-semibold text-emerald-300 mb-1">Key created: {newKey.label}</p>
          <p className="text-xs text-emerald-400/70 mb-3">Copy this key now — it won't be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-emerald-300 break-all">
              {newKey.rawKey}
            </code>
            <button onClick={copyKey} className="btn-secondary text-xs py-1.5 flex-shrink-0">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {showCreate && (
        <div className="mb-6 card p-5">
          <h3 className="text-sm font-semibold mb-4">Create agent key</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Label</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="e.g. NAS Agent - Server Room"
                value={createForm.label}
                onChange={e => setCreateForm(f => ({ ...f, label: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Agent type</label>
              <div className="flex gap-2">
                {(['nas', 'render'] as AgentType[]).map(t => (
                  <button
                    key={t}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      createForm.agentType === t
                        ? 'bg-brand-600/20 border-brand-600/50 text-brand-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                    onClick={() => setCreateForm(f => ({ ...f, agentType: t }))}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
            <button onClick={createKey} className="btn-primary text-xs py-1.5" disabled={creating || !createForm.label.trim()}>
              {creating ? 'Creating…' : 'Create key'}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-600">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <Server className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-600">No agent keys yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Label</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Last used</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {keys.map(key => (
                <tr key={key.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-200 font-medium">{key.label}</p>
                    <p className="text-xs text-slate-600 font-mono">{key.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded uppercase">
                      {key.agentType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {key.active ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <Wifi className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <WifiOff className="w-3 h-3" /> Revoked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {key.active && (
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="btn-ghost p-1.5 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                        title="Revoke key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
