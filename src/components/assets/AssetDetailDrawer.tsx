import { useEffect, useState } from 'react';
import { X, FileImage, Calendar, HardDrive, Tag, Users, Film, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AssetDetail } from '../../lib/types';

interface AssetDetailDrawerProps {
  assetId: string | null;
  onClose: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function TagBadge({ source, value }: { source: string; value: string }) {
  const cls =
    source === 'ai' ? 'tag-ai' :
    source === 'manual' ? 'tag-manual' :
    'tag-proposed';
  return <span className={cls}>{value}</span>;
}

export default function AssetDetailDrawer({ assetId, onClose }: AssetDetailDrawerProps) {
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assetId) {
      setAsset(null);
      return;
    }
    setLoading(true);
    supabase.rpc('get_asset_detail', { p_asset_id: assetId }).then(({ data, error }) => {
      if (!error && data) setAsset(data as unknown as AssetDetail);
      setLoading(false);
    });
  }, [assetId]);

  if (!assetId) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-slate-900 border-l border-slate-800 z-50 flex flex-col animate-slide-in-right overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-200">Asset Detail</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && asset && (
            <div className="p-5 space-y-6">
              <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {asset.thumbnailStatus === 'done' && asset.thumbnailKey ? (
                  <img src={asset.thumbnailKey} alt={asset.fileName} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <FileImage className="w-10 h-10" />
                    <span className="text-xs">No thumbnail</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-slate-100 break-all">{asset.fileName}</h3>
                <p className="text-xs text-slate-500 mt-1 break-all font-mono">{asset.relativePath}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetaItem icon={HardDrive} label="Size" value={formatBytes(asset.fileSizeBytes ?? 0)} />
                <MetaItem
                  icon={FileImage}
                  label="Type"
                  value={(asset.fileType ?? '').toUpperCase()}
                />
                <MetaItem icon={Calendar} label="Created" value={asset.createdAt ? formatDate(asset.createdAt) : '—'} />
                <MetaItem icon={Calendar} label="Updated" value={asset.updatedAt ? formatDate(asset.updatedAt) : '—'} />
              </div>

              {asset.thumbnailStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg text-xs text-amber-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Thumbnail error: {asset.thumbnailError ?? 'unknown'}
                </div>
              )}

              <Section title="Tags" icon={Tag}>
                {(asset.tags ?? []).length === 0 ? (
                  <p className="text-xs text-slate-600">No tags</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(asset.tags ?? []).map((tag, i) => (
                      <TagBadge key={i} source={tag.source} value={tag.value} />
                    ))}
                  </div>
                )}
              </Section>

              {(asset as unknown as { proposedTags?: Array<{ value: string; source: string }> }).proposedTags?.length ? (
                <Section title="Proposed Tags" icon={Tag}>
                  <div className="flex flex-wrap gap-1.5">
                    {(asset as unknown as { proposedTags: Array<{ value: string; source: string }> }).proposedTags.map((tag, i) => (
                      <TagBadge key={i} source="proposed" value={tag.value} />
                    ))}
                  </div>
                </Section>
              ) : null}

              <Section title="Characters" icon={Users}>
                {(asset.characters ?? []).length === 0 ? (
                  <p className="text-xs text-slate-600">None linked</p>
                ) : (
                  <div className="space-y-1">
                    {(asset.characters ?? []).map(c => (
                      <div key={c.characterId} className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{c.name}</span>
                        <span className={c.source === 'ai' ? 'text-brand-400' : c.source === 'manual' ? 'text-emerald-400' : 'text-amber-400'}>
                          {c.source}
                          {c.confidence != null ? ` ${Math.round(c.confidence * 100)}%` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Properties" icon={Film}>
                {(asset.properties ?? []).length === 0 ? (
                  <p className="text-xs text-slate-600">None linked</p>
                ) : (
                  <div className="space-y-1">
                    {(asset.properties ?? []).map(p => (
                      <div key={p.propertyId} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-300">{p.name}</span>
                          {p.studio && <span className="text-slate-600 ml-1">({p.studio})</span>}
                        </div>
                        <span className={p.source === 'ai' ? 'text-brand-400' : p.source === 'manual' ? 'text-emerald-400' : 'text-amber-400'}>
                          {p.source}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <div className="pt-2">
                <p className="text-xs text-slate-700 font-mono">{asset.id}</p>
              </div>
            </div>
          )}

          {!loading && !asset && (
            <div className="flex items-center justify-center h-40 text-sm text-slate-600">
              Asset not found
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 p-2.5 bg-slate-800/50 rounded-lg">
      <Icon className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xs font-medium text-slate-200 truncate">{value}</p>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}
