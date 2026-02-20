import { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Check, X, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Character, Property } from '../../lib/types';

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPropertyId, setFilterPropertyId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', propertyId: '', aliases: '' });
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', aliases: '' });
  const [saving, setSaving] = useState(false);

  async function loadProperties() {
    const { data } = await supabase.from('properties').select('id, name, studio, created_at').order('name');
    setProperties((data ?? []).map(r => ({ id: r.id, name: r.name, studio: r.studio ?? '', createdAt: r.created_at })));
  }

  async function loadCharacters() {
    setLoading(true);
    let q = supabase.from('characters').select('id, name, aliases, property_id, created_at').order('name');
    if (filterPropertyId) q = q.eq('property_id', filterPropertyId);
    const { data } = await q;
    setCharacters((data ?? []).map(r => ({
      id: r.id,
      name: r.name,
      aliases: r.aliases ?? [],
      propertyId: r.property_id,
      createdAt: r.created_at,
    })));
    setLoading(false);
  }

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [filterPropertyId]); // eslint-disable-line

  async function create() {
    if (!createForm.name.trim() || !createForm.propertyId) return;
    setCreating(true);
    const aliases = createForm.aliases
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);
    await supabase.from('characters').insert({
      name: createForm.name.trim(),
      property_id: createForm.propertyId,
      aliases,
    });
    setShowCreate(false);
    setCreateForm({ name: '', propertyId: '', aliases: '' });
    loadCharacters();
    setCreating(false);
  }

  function startEdit(c: Character) {
    setEditId(c.id);
    setEditForm({ name: c.name, aliases: c.aliases.join(', ') });
  }

  async function saveEdit() {
    if (!editId || !editForm.name.trim()) return;
    setSaving(true);
    const aliases = editForm.aliases.split(',').map(a => a.trim()).filter(Boolean);
    await supabase.from('characters').update({ name: editForm.name.trim(), aliases }).eq('id', editId);
    setEditId(null);
    loadCharacters();
    setSaving(false);
  }

  const propertyMap = Object.fromEntries(properties.map(p => [p.id, p.name]));

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold">Characters</h1>
          <p className="text-xs text-slate-500 mt-0.5">Fictional characters tied to properties</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              className="select py-1.5 text-xs pr-7 pl-3 min-w-32"
              value={filterPropertyId}
              onChange={e => setFilterPropertyId(e.target.value)}
            >
              <option value="">All properties</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
          <button onClick={loadCharacters} className="btn-ghost p-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add character
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="mb-6 card p-5">
          <h3 className="text-sm font-semibold mb-4">Add character</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="e.g. Luke Skywalker"
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Property</label>
              <select
                className="select text-sm"
                value={createForm.propertyId}
                onChange={e => setCreateForm(f => ({ ...f, propertyId: e.target.value }))}
              >
                <option value="">Select property…</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Aliases <span className="text-slate-600">(comma-separated)</span>
              </label>
              <input
                type="text"
                className="input text-sm"
                placeholder="e.g. Luke, The Farm Boy"
                value={createForm.aliases}
                onChange={e => setCreateForm(f => ({ ...f, aliases: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
            <button
              onClick={create}
              className="btn-primary text-xs py-1.5"
              disabled={creating || !createForm.name.trim() || !createForm.propertyId}
            >
              {creating ? 'Adding…' : 'Add character'}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-600">Loading…</div>
        ) : characters.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-600">No characters yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Property</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Aliases</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {characters.map(char => (
                <tr key={char.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    {editId === char.id ? (
                      <input
                        type="text"
                        className="input text-xs py-1"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-slate-200 font-medium">{char.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">{propertyMap[char.propertyId] ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editId === char.id ? (
                      <input
                        type="text"
                        className="input text-xs py-1"
                        value={editForm.aliases}
                        onChange={e => setEditForm(f => ({ ...f, aliases: e.target.value }))}
                        placeholder="comma-separated"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">
                        {char.aliases.length > 0 ? char.aliases.join(', ') : '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editId === char.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={saveEdit}
                          className="btn-ghost p-1.5 text-emerald-400 hover:text-emerald-300"
                          disabled={saving}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditId(null)} className="btn-ghost p-1.5 text-slate-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(char)} className="btn-ghost p-1.5">
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
