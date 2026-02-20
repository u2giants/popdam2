import { Search, X, ChevronDown } from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { useCharacters } from '../../hooks/useCharacters';
import type { AssetFilter, AssetFileType, ThumbnailStatus } from '../../lib/types';

interface AssetFiltersProps {
  filters: AssetFilter;
  onChange: (filters: AssetFilter) => void;
}

export default function AssetFilters({ filters, onChange }: AssetFiltersProps) {
  const { properties } = useProperties();
  const { characters } = useCharacters(filters.propertyId);

  const hasActiveFilters =
    filters.search ||
    (filters.fileType && filters.fileType.length > 0) ||
    filters.propertyId ||
    filters.characterId ||
    filters.thumbnailStatus ||
    filters.needsReview;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-52 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          className="input pl-8 py-1.5 text-xs"
          placeholder="Search files…"
          value={filters.search ?? ''}
          onChange={e => onChange({ ...filters, search: e.target.value || undefined })}
        />
      </div>

      <div className="relative">
        <select
          className="select py-1.5 text-xs pr-7 pl-3 min-w-24"
          value={filters.fileType?.[0] ?? ''}
          onChange={e =>
            onChange({
              ...filters,
              fileType: e.target.value ? [e.target.value as AssetFileType] : undefined,
            })
          }
        >
          <option value="">All types</option>
          <option value="psd">PSD</option>
          <option value="ai">AI</option>
          <option value="unknown">Unknown</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          className="select py-1.5 text-xs pr-7 pl-3 min-w-28"
          value={filters.propertyId ?? ''}
          onChange={e =>
            onChange({ ...filters, propertyId: e.target.value || undefined, characterId: undefined })
          }
        >
          <option value="">All properties</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
      </div>

      {filters.propertyId && (
        <div className="relative">
          <select
            className="select py-1.5 text-xs pr-7 pl-3 min-w-28"
            value={filters.characterId ?? ''}
            onChange={e =>
              onChange({ ...filters, characterId: e.target.value || undefined })
            }
          >
            <option value="">All characters</option>
            {characters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
        </div>
      )}

      <div className="relative">
        <select
          className="select py-1.5 text-xs pr-7 pl-3 min-w-32"
          value={filters.thumbnailStatus ?? ''}
          onChange={e =>
            onChange({ ...filters, thumbnailStatus: (e.target.value as ThumbnailStatus) || undefined })
          }
        >
          <option value="">All thumbs</option>
          <option value="done">Has thumbnail</option>
          <option value="pending">Pending</option>
          <option value="render_queued">Queued</option>
          <option value="error">Error</option>
          <option value="generating">Generating</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
      </div>

      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
        <input
          type="checkbox"
          className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500"
          checked={filters.needsReview ?? false}
          onChange={e => onChange({ ...filters, needsReview: e.target.checked || undefined })}
        />
        Needs review
      </label>

      {hasActiveFilters && (
        <button
          className="btn-ghost py-1.5 text-xs text-slate-500 hover:text-slate-300"
          onClick={() => onChange({})}
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
