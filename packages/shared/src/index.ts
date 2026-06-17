// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  videosCount: number;
  isVerified: boolean;
  isCreator: boolean;
  createdAt: string;
}

export interface AuthTokenPayload {
  sub: string; // user id
  username: string;
  iat: number;
  exp: number;
}

// ─── Audio ───────────────────────────────────────────────────────────────────

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  durationSeconds?: number;
  usedByCount: number;
}

// ─── Creator (lightweight, embedded in videos) ───────────────────────────────

export interface CreatorRef {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  followersCount: number;
  videosCount: number;
  isVerified: boolean;
}

// ─── Video ───────────────────────────────────────────────────────────────────

export interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description: string;
  trendTitle?: string;
  durationSeconds?: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isWarpDrop: boolean;
  creator: CreatorRef;
  audioTrack?: AudioTrack;
  createdAt?: string;
}

/** A video as served by the Quantum Feed (includes Multi-Thread variants) */
export interface FeedVideo extends Video {
  variants: Video[]; // alternate takes on the same audio/trend
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export type FeedSlot = 'curated' | 'warp_drop';

export interface FeedItem {
  video: FeedVideo;
  slot: FeedSlot;
  score: number;
}

export interface FeedPage {
  videos: FeedVideo[];
  nextCursor: number | null;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface UploadRequest {
  title: string;
  description: string;
  trendTitle?: string;
  audioTrackId?: string;
  isOriginalAudio: boolean;
}

export interface UploadResponse {
  videoId: string;
  uploadUrl: string; // presigned PUT URL
  cdnUrl: string;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  likesCount: number;
  author: CreatorRef;
  replies?: Comment[];
}

// ─── API response wrappers ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Quantum Feed algorithm ──────────────────────────────────────────────────

export interface QuantumFeedConfig {
  /** Fraction of curated (interest-matched) slots — default 0.7 */
  curatedRatio: number;
  /** Fraction of Warp Drop (wildcard zero-follower) slots — default 0.3 */
  warpDropRatio: number;
  /** Page size */
  pageSize: number;
  /** How many variants to attach per video */
  variantsPerVideo: number;
}

export const DEFAULT_QUANTUM_CONFIG: QuantumFeedConfig = {
  curatedRatio: 0.7,
  warpDropRatio: 0.3,
  pageSize: 10,
  variantsPerVideo: 5,
};
