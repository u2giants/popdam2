import { useState, useCallback } from 'react';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import AssetFilters from '../components/assets/AssetFilters';
import AssetCard from '../components/assets/AssetCard';
import AssetDetailDrawer from '../components/assets/AssetDetailDrawer';
import { useAssets } from '../hooks/useAssets';
import type { AssetFilter, ListAssetsParams } from '../lib/types';

const PAGE_SIZE = 48;

export default function AssetsPage() {
  const [filters, setFilters] = useState<AssetFilter>({});
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const params: ListAssetsParams = {
    ...filters,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    sortBy: 'created_at',
    sortDir: 'desc',
  };

  const { assets, total, loading, refetch } = useAssets(params);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFilterChange = useCallback((f: AssetFilter) => {
    setFilters(f);
    setPage(1);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-semibold text-slate-100">Assets</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? 'Loading…' : `${total.toLocaleString()} file${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} className="btn-ghost p-1.5" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex bg-slate-800 rounded-lg p-0.5">
              <button
                className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => setView('list')}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <AssetFilters filters={filters} onChange={handleFilterChange} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && assets.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-square bg-slate-800 animate-pulse" />
                <div className="p-2.5">
                  <div className="h-3 bg-slate-800 rounded animate-pulse mb-1.5" />
                  <div className="h-2.5 bg-slate-800/60 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && assets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">No assets found</p>
            <p className="text-xs text-slate-600 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {assets.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {assets.map(asset => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onClick={() => setSelectedId(asset.id)}
              />
            ))}
          </div>
        )}

        {assets.length > 0 && view === 'list' && (
          <div className="space-y-px">
            <div className="grid grid-cols-[1fr_80px_100px_120px] gap-4 px-3 py-2 text-xs font-medium text-slate-600 uppercase tracking-wider border-b border-slate-800 mb-1">
              <span>File</span>
              <span>Type</span>
              <span>Size</span>
              <span>Thumbnail</span>
            </div>
            {assets.map(asset => (
              <button
                key={asset.id}
                onClick={() => setSelectedId(asset.id)}
                className="w-full grid grid-cols-[1fr_80px_100px_120px] gap-4 px-3 py-2.5 text-xs text-left hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-slate-200 font-medium truncate">{asset.fileName}</p>
                  <p className="text-slate-600 truncate font-mono text-xs">{asset.relativePath}</p>
                </div>
                <span className="text-slate-400 uppercase self-center">{asset.fileType}</span>
                <span className="text-slate-400 self-center">
                  {asset.fileSizeBytes ? `${(asset.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '—'}
                </span>
                <span className={`self-center capitalize ${
                  asset.thumbnailStatus === 'done' ? 'text-emerald-400' :
                  asset.thumbnailStatus === 'error' ? 'text-amber-400' :
                  'text-slate-500'
                }`}>
                  {asset.thumbnailStatus?.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/50">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} — {total.toLocaleString()} total
          </p>
          <div className="flex items-center gap-1">
            <button
              className="btn-ghost py-1 px-2 text-xs"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  className={`w-7 h-7 text-xs rounded-md transition-colors ${
                    p === page ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn-ghost py-1 px-2 text-xs"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AssetDetailDrawer assetId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
