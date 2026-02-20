import { useState, useEffect } from 'react';
import { Settings, Save, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AiConfigRow {
  id: string;
  provider: string;
  model_name: string;
  enabled: boolean;
  tag_prompt: string | null;
}

interface SpacesConfigRow {
  id: string;
  public_base_url: string;
  endpoint: string;
  region: string;
  bucket_name: string;
}

export default function ConfigPage() {
  const [aiConfig, setAiConfig] = useState<AiConfigRow | null>(null);
  const [spacesConfig, setSpacesConfig] = useState<SpacesConfigRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [aiForm, setAiForm] = useState({ provider: 'gemini', model_name: '', enabled: true, tag_prompt: '' });
  const [spacesForm, setSpacesForm] = useState({ public_base_url: '', endpoint: '', region: '', bucket_name: '' });

  const [savingAi, setSavingAi] = useState(false);
  const [savingSpaces, setSavingSpaces] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [spacesSaved, setSpacesSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [ai, spaces] = await Promise.all([
        supabase.from('ai_config').select('*').maybeSingle(),
        supabase.from('spaces_config').select('*').maybeSingle(),
      ]);

      if (ai.data) {
        setAiConfig(ai.data);
        setAiForm({
          provider: ai.data.provider,
          model_name: ai.data.model_name,
          enabled: ai.data.enabled,
          tag_prompt: ai.data.tag_prompt ?? '',
        });
      }

      if (spaces.data) {
        setSpacesConfig(spaces.data);
        setSpacesForm({
          public_base_url: spaces.data.public_base_url ?? '',
          endpoint: spaces.data.endpoint ?? '',
          region: spaces.data.region ?? '',
          bucket_name: spaces.data.bucket_name ?? '',
        });
      }

      setLoading(false);
    }
    load();
  }, []);

  async function saveAi() {
    setSavingAi(true);
    setError('');
    const payload = {
      provider: aiForm.provider,
      model_name: aiForm.model_name,
      enabled: aiForm.enabled,
      tag_prompt: aiForm.tag_prompt || null,
    };
    const { error: err } = aiConfig
      ? await supabase.from('ai_config').update(payload).eq('id', aiConfig.id)
      : await supabase.from('ai_config').insert(payload);
    if (err) {
      setError(err.message);
    } else {
      setAiSaved(true);
      setTimeout(() => setAiSaved(false), 2000);
    }
    setSavingAi(false);
  }

  async function saveSpaces() {
    setSavingSpaces(true);
    setError('');
    const payload = {
      public_base_url: spacesForm.public_base_url,
      endpoint: spacesForm.endpoint,
      region: spacesForm.region,
      bucket_name: spacesForm.bucket_name,
    };
    const { error: err } = spacesConfig
      ? await supabase.from('spaces_config').update(payload).eq('id', spacesConfig.id)
      : await supabase.from('spaces_config').insert(payload);
    if (err) {
      setError(err.message);
    } else {
      setSpacesSaved(true);
      setTimeout(() => setSpacesSaved(false), 2000);
    }
    setSavingSpaces(false);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-40">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-base font-semibold">Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">AI tagging and storage settings</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold">AI Tagging</h2>
          <label className="ml-auto flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <div
              className={`relative w-8 h-4 rounded-full transition-colors ${aiForm.enabled ? 'bg-brand-600' : 'bg-slate-700'}`}
              onClick={() => setAiForm(f => ({ ...f, enabled: !f.enabled }))}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${aiForm.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            {aiForm.enabled ? 'Enabled' : 'Disabled'}
          </label>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Provider</label>
              <div className="relative">
                <select
                  className="select text-sm"
                  value={aiForm.provider}
                  onChange={e => setAiForm(f => ({ ...f, provider: e.target.value }))}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
              <input
                type="text"
                className="input text-sm"
                placeholder={aiForm.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o'}
                value={aiForm.model_name}
                onChange={e => setAiForm(f => ({ ...f, model_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Tag prompt <span className="text-slate-600">(optional override)</span>
            </label>
            <textarea
              className="input text-sm resize-none"
              rows={4}
              placeholder="Describe what tags to extract from design files…"
              value={aiForm.tag_prompt}
              onChange={e => setAiForm(f => ({ ...f, tag_prompt: e.target.value }))}
            />
          </div>

          <div className="flex justify-end">
            <button onClick={saveAi} className="btn-primary text-xs py-1.5" disabled={savingAi}>
              {aiSaved ? (
                <><Check className="w-3.5 h-3.5" /> Saved</>
              ) : savingAi ? 'Saving…' : (
                <><Save className="w-3.5 h-3.5" /> Save AI config</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold">DigitalOcean Spaces</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Region</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="nyc3"
                value={spacesForm.region}
                onChange={e => setSpacesForm(f => ({ ...f, region: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Bucket name</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="my-dam-bucket"
                value={spacesForm.bucket_name}
                onChange={e => setSpacesForm(f => ({ ...f, bucket_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Endpoint URL</label>
            <input
              type="url"
              className="input text-sm"
              placeholder="https://nyc3.digitaloceanspaces.com"
              value={spacesForm.endpoint}
              onChange={e => setSpacesForm(f => ({ ...f, endpoint: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Public base URL</label>
            <input
              type="url"
              className="input text-sm"
              placeholder="https://my-dam-bucket.nyc3.cdn.digitaloceanspaces.com"
              value={spacesForm.public_base_url}
              onChange={e => setSpacesForm(f => ({ ...f, public_base_url: e.target.value }))}
            />
          </div>

          <p className="text-xs text-slate-600">
            Access keys are managed via environment variables on the agent, not stored here.
          </p>

          <div className="flex justify-end">
            <button onClick={saveSpaces} className="btn-primary text-xs py-1.5" disabled={savingSpaces}>
              {spacesSaved ? (
                <><Check className="w-3.5 h-3.5" /> Saved</>
              ) : savingSpaces ? 'Saving…' : (
                <><Save className="w-3.5 h-3.5" /> Save Spaces config</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
