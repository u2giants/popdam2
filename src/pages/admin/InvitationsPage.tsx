import { useState, useEffect } from 'react';
import { Users, Plus, Copy, Check, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Invitation, UserRole } from '../../lib/types';

export default function InvitationsPage() {
  const { profile } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', role: 'viewer' as UserRole, expiresInDays: 7 });
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadInvitations() {
    setLoading(true);
    const { data } = await supabase
      .from('invitations')
      .select('id, email, role, invited_by_user_id, invited_by_email, expires_at, accepted_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    setInvitations(
      (data ?? []).map(r => ({
        id: r.id,
        email: r.email,
        role: r.role,
        invitedByUserId: r.invited_by_user_id,
        invitedByEmail: r.invited_by_email,
        expiresAt: r.expires_at,
        acceptedAt: r.accepted_at,
        createdAt: r.created_at,
      }))
    );
    setLoading(false);
  }

  useEffect(() => { loadInvitations(); }, []);

  async function createInvitation() {
    if (!createForm.email.trim() || !profile?.id) return;
    setCreating(true);

    const rawToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawToken));
    const tokenHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + createForm.expiresInDays);

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        email: createForm.email.trim().toLowerCase(),
        role: createForm.role,
        invited_by_user_id: profile.id,
        invited_by_email: profile.email,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (!error && data) {
      setCreatedId(data.id);
      setShowCreate(false);
      setCreateForm({ email: '', role: 'viewer', expiresInDays: 7 });
      loadInvitations();
    }
    setCreating(false);
  }

  function copyId() {
    if (!createdId) return;
    navigator.clipboard.writeText(createdId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getStatus(inv: Invitation) {
    if (inv.acceptedAt) return 'accepted';
    if (new Date(inv.expiresAt) < new Date()) return 'expired';
    return 'pending';
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold">Invitations</h1>
          <p className="text-xs text-slate-500 mt-0.5">Invite new users by email</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadInvitations} className="btn-ghost p-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5">
            <Plus className="w-3.5 h-3.5" />
            Invite user
          </button>
        </div>
      </div>

      {createdId && (
        <div className="mb-6 p-4 bg-brand-900/20 border border-brand-700/40 rounded-xl">
          <p className="text-sm font-semibold text-brand-300 mb-1">Invitation created</p>
          <p className="text-xs text-brand-400/70 mb-3">Share this invitation ID with the user so they can register.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-brand-300 break-all">
              {createdId}
            </code>
            <button onClick={copyId} className="btn-secondary text-xs py-1.5 flex-shrink-0">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setCreatedId(null)} className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {showCreate && (
        <div className="mb-6 card p-5">
          <h3 className="text-sm font-semibold mb-4">Create invitation</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                className="input text-sm"
                placeholder="user@example.com"
                value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
              <select
                className="select text-sm"
                value={createForm.role}
                onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Expires in (days)</label>
              <input
                type="number"
                className="input text-sm"
                min={1}
                max={90}
                value={createForm.expiresInDays}
                onChange={e => setCreateForm(f => ({ ...f, expiresInDays: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
            <button
              onClick={createInvitation}
              className="btn-primary text-xs py-1.5"
              disabled={creating || !createForm.email.trim()}
            >
              {creating ? 'Creating…' : 'Create invitation'}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-600">Loading…</div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-600">No invitations yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Expires</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Invited by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invitations.map(inv => {
                const status = getStatus(inv);
                return (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-200">{inv.email}</p>
                      <p className="text-xs text-slate-600 font-mono">{inv.id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium capitalize text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {inv.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {status === 'accepted' && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> Accepted
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="flex items-center gap-1.5 text-xs text-brand-400">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                      {status === 'expired' && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                          <XCircle className="w-3 h-3" /> Expired
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-32">
                      {inv.invitedByEmail}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
