export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type ThumbnailStatus = 'pending' | 'generating' | 'done' | 'error' | 'render_queued';
export type AssetFileType = 'psd' | 'ai' | 'unknown';
export type TagSource = 'ai' | 'manual' | 'proposed';
export type AgentStatus = 'online' | 'offline' | 'degraded';
export type AgentType = 'nas' | 'render';
export type ScanStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

export interface Tag {
  value: string;
  source: TagSource;
  confidence?: number;
}

export interface CharacterRef {
  characterId: string;
  source: TagSource;
  confidence?: number;
}

export interface PropertyRef {
  propertyId: string;
  source: TagSource;
  confidence?: number;
}

export interface AssetRow {
  id: string;
  shareId: string;
  relativePath: string;
  fileName: string;
  fileType: AssetFileType;
  fileSizeBytes: number;
  thumbnailStatus: ThumbnailStatus;
  thumbnailKey: string | null;
  thumbnailError: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  characterIds: string[];
  propertyIds: string[];
}

export interface AssetDetail extends AssetRow {
  characters: Array<{ characterId: string; name: string; source: TagSource; confidence?: number }>;
  properties: Array<{ propertyId: string; name: string; studio: string; source: TagSource; confidence?: number }>;
}

export interface Character {
  id: string;
  name: string;
  aliases: string[];
  propertyId: string;
  createdAt: string;
}

export interface Property {
  id: string;
  name: string;
  studio: string;
  createdAt: string;
}

export interface Share {
  id: string;
  label: string;
  host: string;
  ipAddress: string | null;
  shareName: string;
  containerMountPath: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  keyId: string;
  label: string;
  agentType: AgentType;
  status: AgentStatus;
  lastHeartbeatAt: string | null;
  scanStatus: ScanStatus;
  hostname: string | null;
  version: string | null;
}

export interface AgentKey {
  id: string;
  label: string;
  agentType: AgentType;
  agentId: string | null;
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invitedByUserId: string;
  invitedByEmail: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface ScanJob {
  id: string;
  shareId: string;
  agentId: string;
  status: ScanStatus;
  startedAt: string | null;
  completedAt: string | null;
  filesScanned: number;
  filesAdded: number;
  filesUpdated: number;
  filesMoved: number;
  filesNoop: number;
  filesErrored: number;
}

export interface AssetFilter {
  search?: string;
  fileType?: AssetFileType[];
  propertyId?: string;
  characterId?: string;
  thumbnailStatus?: ThumbnailStatus;
  needsReview?: boolean;
}

export interface ListAssetsParams extends AssetFilter {
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'file_name';
  sortDir?: 'asc' | 'desc';
}
