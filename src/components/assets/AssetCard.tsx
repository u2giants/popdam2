import { FileImage, AlertTriangle, Clock, Loader, Tag } from 'lucide-react';
import type { AssetRow } from '../../lib/types';

interface AssetCardProps {
  asset: AssetRow;
  onClick: () => void;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  psd: 'text-blue-400 bg-blue-900/30 border-blue-800/40',
  ai: 'text-orange-400 bg-orange-900/30 border-orange-800/40',
  unknown: 'text-slate-400 bg-slate-800/50 border-slate-700/40',
};

function ThumbnailSlot({ asset }: { asset: AssetRow }) {
  if (asset.thumbnailStatus === 'done' && asset.thumbnailKey) {
    return (
      <img
        src={asset.thumbnailKey}
        alt={asset.fileName}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      {asset.thumbnailStatus === 'pending' && (
        <>
          <Clock className="w-6 h-6 text-slate-600" />
          <span className="text-xs text-slate-600">Pending</span>
        </>
      )}
      {(asset.thumbnailStatus === 'generating' || asset.thumbnailStatus === 'render_queued') && (
        <>
          <Loader className="w-6 h-6 text-brand-500 animate-spin" />
          <span className="text-xs text-slate-500">
            {asset.thumbnailStatus === 'render_queued' ? 'Queued' : 'Generating'}
          </span>
        </>
      )}
      {asset.thumbnailStatus === 'error' && (
        <>
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          <span className="text-xs text-slate-600">Error</span>
        </>
      )}
      {asset.thumbnailStatus !== 'pending' &&
        asset.thumbnailStatus !== 'generating' &&
        asset.thumbnailStatus !== 'render_queued' &&
        asset.thumbnailStatus !== 'error' && (
          <FileImage className="w-8 h-8 text-slate-700" />
        )}
    </div>
  );
}

export default function AssetCard({ asset, onClick }: AssetCardProps) {
  const typeColor = FILE_TYPE_COLORS[asset.fileType] ?? FILE_TYPE_COLORS.unknown;
  const tagCount = asset.tags?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="group card overflow-hidden text-left hover:border-slate-600 hover:shadow-lg hover:shadow-black/30 transition-all duration-200 animate-fade-in"
    >
      <div className="aspect-square bg-slate-950 relative overflow-hidden">
        <ThumbnailSlot asset={asset} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-xs font-semibold rounded border ${typeColor} uppercase`}>
          {asset.fileType}
        </div>
      </div>

      <div className="p-2.5">
        <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">
          {asset.fileName}
        </p>
        <p className="text-xs text-slate-600 truncate mt-0.5">
          {asset.relativePath?.split('/').slice(0, -1).join('/') || '/'}
        </p>
        {tagCount > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Tag className="w-3 h-3 text-slate-600" />
            <span className="text-xs text-slate-600">{tagCount} tag{tagCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </button>
  );
}
