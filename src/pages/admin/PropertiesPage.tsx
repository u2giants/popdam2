import { useState, useEffect } from 'react';
import { Film, Plus, Pencil, Check, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Property } from '../../lib/types';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', studio: '' });
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', studio: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('properties')
      .select('id, name, studio, created_at')
      .order('name');
    setProperties(
      (data ?? []).map(r => ({
        id: r.id,
        name: r.name,
        studio: r.studio ?? '',
        createdAt: r.created_at,
      }))
    );
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!createForm.name.trim()) return;
    setCreating(true);
    await supabase.from('properties').insert({
      name: createForm.name.trim(),
      studio: createForm.studio.trim() || null,
    });
    setShowCreate(false);
    setCreateForm({ name: '', studio: '' });
    load();
    setCreating(false);
  }

  function startEdit(p: Property) {
    setEditId(p.id);
    setEditForm({ name: p.name, studio: p.studio ?? '' });
  }

  async function saveEdit() {
    if (!editId || !editForm.name.trim()) return;
    setSaving(true);
    await supabase.from('properties').update({
      name: editForm.name.trim(),
      studio: editForm.studio.trim() || null,
    }).eq('id', editId);
    setEditId(null);
    load();
    setSaving(false);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold">Properties</h1>
          <p className="text-xs text-slate-500 mt-0.5">IP franchises and studios</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost p-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add property
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="mb-6 card p-5">
          <h3 className="text-sm font-semibold mb-4">Add property</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Property name</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="e.g. Star Wars"
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Studio / publisher</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="e.g. Lucasfilm"
                value={createForm.studio}
                onChange={e => setCreateForm(f => ({ ...f, studio: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
            <button
              onClick={create}
              className="btn-primary text-xs py-1.5"
              disabled={creating || !createForm.name.trim()}
            >
              {creating ? 'Adding…' : 'Add property'}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-600">Loading…</div>
        ) : properties.length === 0 ? (
          <div className="p-8 text-center">
            <Film className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-600">No properties yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Studio</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {properties.map(prop => (
                <tr key={prop.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    {editId === prop.id ? (
                      <input
                        type="text"
                        className="input text-xs py-1"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-slate-200 font-medium">{prop.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editId === prop.id ? (
                      <input
                        type="text"
                        className="input text-xs py-1"
                        value={editForm.studio}
                        onChange={e => setEditForm(f => ({ ...f, studio: e.target.value }))}
                      />
                    ) : (
                      <span className="text-xs text-slate-500">{prop.studio || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(prop.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editId === prop.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={saveEdit}
                          className="btn-ghost p-1.5 text-emerald-400 hover:text-emerald-300"
                          disabled={saving}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="btn-ghost p-1.5 text-slate-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(prop)}
                        className="btn-ghost p-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
