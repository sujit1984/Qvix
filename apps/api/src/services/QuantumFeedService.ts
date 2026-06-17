import { prisma } from '../db/prisma';
import type { FeedPage, FeedVideo, QuantumFeedConfig } from '@qvix/shared';
import { DEFAULT_QUANTUM_CONFIG } from '@qvix/shared';

interface GetPageOptions {
  userId?: string;
  cursor: number;
  limit: number;
}

interface InterestProfile {
  followedCreatorIds: Set<string>;
  creator: Map<string, number>;
  audio: Map<string, number>;
  trend: Map<string, number>;
}

interface CandidateSignal {
  watchSignal: number;
  interestSignal: number;
  noveltySignal: number;
  creatorBoost: number;
  engagementSignal: number;
}

const CURATED_POOL_MULTIPLIER = readEnvNumber('QVIX_FEED_CANDIDATE_POOL_MULTIPLIER', 8);
const CURATED_MIN_POOL = readEnvNumber('QVIX_FEED_CANDIDATE_POOL_MIN', 40);
const WATCH_HALF_LIFE_HOURS = readEnvNumber('QVIX_FEED_WATCH_HALF_LIFE_HOURS', 72);
const NOVELTY_HALF_LIFE_HOURS = readEnvNumber('QVIX_FEED_NOVELTY_HALF_LIFE_HOURS', 36);

/**
 * The Quantum Feed Service
 *
 * Implements the 70/30 Warp Split:
 *   70% → Curated content based on user interests (follows, watch history, likes)
 *   30% → Warp Drops (zero/low-follower creators, randomly selected, hyper-viral potential)
 *
 * Each curated video carries up to N "variants" — other creators' takes on the
 * same audio track — enabling the Multi-Thread swipe-left/right experience.
 */
export class QuantumFeedService {
  private config: QuantumFeedConfig;

  constructor(config: Partial<QuantumFeedConfig> = {}) {
    this.config = { ...DEFAULT_QUANTUM_CONFIG, ...config };
  }

  async getPage({ userId, cursor, limit }: GetPageOptions): Promise<FeedPage> {
    const actualLimit = Math.min(limit, this.config.pageSize);
    const curatedCount = Math.round(actualLimit * this.config.curatedRatio);
    const warpCount = actualLimit - curatedCount;

    const [curatedVideos, warpVideos] = await Promise.all([
      this.getCuratedVideos(userId, curatedCount, cursor),
      this.getWarpDropVideos(warpCount),
    ]);

    // Interleave: every ~3rd slot is a Warp Drop
    const merged = this.interleaveFeed(curatedVideos, warpVideos);

    // Attach Multi-Thread variants for each video
    const withVariants = await Promise.all(
      merged.map((v) => this.attachVariants(v))
    );

    return {
      videos: withVariants,
      nextCursor: withVariants.length < actualLimit ? null : cursor + actualLimit,
    };
  }

  async getWarpDrop(): Promise<FeedVideo> {
    const [video] = await this.getWarpDropVideos(1);
    return this.attachVariants(video);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async getCuratedVideos(
    userId: string | undefined,
    count: number,
    cursor: number
  ): Promise<FeedVideo[]> {
    const poolSize = Math.max(count * CURATED_POOL_MULTIPLIER, CURATED_MIN_POOL);

    const profile = userId ? await this.buildInterestProfile(userId) : null;
    const recentVideoIds = userId ? await this.getRecentlyWatchedVideoIds(userId) : [];

    const whereClause = {
      status: 'published' as const,
      isWarpDrop: false,
      ...(recentVideoIds.length > 0 ? { id: { notIn: recentVideoIds } } : {}),
    };

    const candidates = await prisma.video.findMany({
      where: whereClause,
      include: { creator: true, audioTrack: true },
      orderBy: [{ createdAt: 'desc' }, { viewsCount: 'desc' }],
      skip: cursor,
      take: poolSize,
    });

    if (candidates.length === 0) return [];

    const watchStats = await prisma.videoWatch.groupBy({
      by: ['videoId'],
      where: {
        videoId: { in: candidates.map((video) => video.id) },
      },
      _sum: { watchedSeconds: true },
      _avg: { completionRate: true },
      _count: { _all: true },
    });

    const statsByVideo = new Map(
      watchStats.map((row) => [row.videoId, row])
    );

    const ranked = candidates
      .map((video) => {
        const stats = statsByVideo.get(video.id);
        const signal = this.computeSignals(video, stats, profile);
        const score =
          signal.watchSignal * 0.34 +
          signal.interestSignal * 0.3 +
          signal.noveltySignal * 0.16 +
          signal.creatorBoost * 0.1 +
          signal.engagementSignal * 0.1;

        return { video, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map((row) => toFeedVideo(row.video));

    return ranked;
  }

  private async getWarpDropVideos(count: number): Promise<FeedVideo[]> {
    // Warp Drops: zero or low follower creators, newest first
    const videos = await prisma.video.findMany({
      where: {
        status: 'published',
        isWarpDrop: true,
        creator: { followersCount: { lte: 100 } },
      },
      include: { creator: true, audioTrack: true },
      orderBy: { createdAt: 'desc' },
      take: count * 5, // oversample then randomise
    });

    // Fisher-Yates shuffle then take `count`
    for (let i = videos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [videos[i], videos[j]] = [videos[j], videos[i]];
    }

    return videos.slice(0, count).map((v: any) => ({ ...toFeedVideo(v), isWarpDrop: true }));
  }

  private interleaveFeed(curated: FeedVideo[], warp: FeedVideo[]): FeedVideo[] {
    const result: FeedVideo[] = [];
    let ci = 0;
    let wi = 0;

    while (ci < curated.length || wi < warp.length) {
      // Insert 2 curated, then 1 warp
      for (let i = 0; i < 2 && ci < curated.length; i++, ci++) {
        result.push(curated[ci]);
      }
      if (wi < warp.length) {
        result.push(warp[wi++]);
      }
    }
    return result;
  }

  private async attachVariants(video: FeedVideo): Promise<FeedVideo> {
    if (!video.audioTrack?.id) return video;

    const variants = await prisma.video.findMany({
      where: {
        status: 'published',
        audioTrackId: video.audioTrack.id,
        id: { not: video.id },
      },
      include: { creator: true, audioTrack: true },
      orderBy: { viewsCount: 'desc' },
      take: this.config.variantsPerVideo,
    });

    return { ...video, variants: variants.map(toFeedVideo) };
  }

  private async buildInterestProfile(userId: string): Promise<InterestProfile> {
    const [follows, likes, watches] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
      prisma.like.findMany({
        where: { userId },
        include: {
          video: {
            select: {
              creatorId: true,
              audioTrackId: true,
              trendTitle: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 250,
      }),
      prisma.videoWatch.findMany({
        where: { userId },
        include: {
          video: {
            select: {
              creatorId: true,
              audioTrackId: true,
              trendTitle: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ]);

    const creator = new Map<string, number>();
    const audio = new Map<string, number>();
    const trend = new Map<string, number>();
    const followedCreatorIds = new Set(follows.map((f) => f.followingId));

    const addWeight = (bucket: Map<string, number>, key: string | null, weight: number) => {
      if (!key || weight <= 0) return;
      bucket.set(key, (bucket.get(key) ?? 0) + weight);
    };

    const now = Date.now();
    for (const like of likes) {
      const ageHours = Math.max(1, (now - like.createdAt.getTime()) / (1000 * 60 * 60));
      const recency = Math.exp(-ageHours / 168);
      const w = 1.0 * recency;

      addWeight(creator, like.video.creatorId, w);
      addWeight(audio, like.video.audioTrackId, w);
      addWeight(trend, like.video.trendTitle, w);
    }

    for (const watch of watches) {
      const ageHours = Math.max(1, (now - watch.createdAt.getTime()) / (1000 * 60 * 60));
      const recency = Math.exp(-ageHours / WATCH_HALF_LIFE_HOURS);
      const completionWeight = Math.min(1.2, Math.max(0.05, watch.completionRate));
      const w = completionWeight * recency;

      addWeight(creator, watch.video.creatorId, w);
      addWeight(audio, watch.video.audioTrackId, w);
      addWeight(trend, watch.video.trendTitle, w);
    }

    for (const creatorId of followedCreatorIds) {
      addWeight(creator, creatorId, 3.0);
    }

    return { followedCreatorIds, creator, audio, trend };
  }

  private async getRecentlyWatchedVideoIds(userId: string): Promise<string[]> {
    const recent = await prisma.videoWatch.findMany({
      where: { userId },
      select: { videoId: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return Array.from(new Set(recent.map((row) => row.videoId)));
  }

  private computeSignals(video: any, stats: any, profile: InterestProfile | null): CandidateSignal {
    const watchCount = stats?._count?._all ?? 0;
    const sumWatchSeconds = stats?._sum?.watchedSeconds ?? 0;
    const avgCompletion = stats?._avg?.completionRate ?? 0;
    const avgDuration = Math.max(video.durationSeconds ?? 15, 5);

    const watchDepth = Math.min(1, sumWatchSeconds / Math.max(avgDuration * 40, 1));
    const watchReliability = Math.min(1, Math.log1p(watchCount) / Math.log(20));
    const watchSignal = Math.min(1, avgCompletion * 0.7 + watchDepth * 0.3) * (0.5 + watchReliability * 0.5);

    const creatorMatch = profile ? this.normalizeInterest(profile.creator.get(video.creatorId)) : 0;
    const audioMatch = profile ? this.normalizeInterest(profile.audio.get(video.audioTrackId ?? '')) : 0;
    const trendMatch = profile ? this.normalizeInterest(profile.trend.get(video.trendTitle ?? '')) : 0;
    const interestSignal = creatorMatch * 0.45 + audioMatch * 0.3 + trendMatch * 0.25;

    const hoursSinceCreated = Math.max(1, (Date.now() - video.createdAt.getTime()) / (1000 * 60 * 60));
    const noveltySignal = Math.exp(-hoursSinceCreated / NOVELTY_HALF_LIFE_HOURS);

    const followerPenalty = Math.min(1, Math.log10((video.creator.followersCount ?? 0) + 1) / 6);
    const emergentBoost = 1 - followerPenalty;
    const followBoost = profile?.followedCreatorIds.has(video.creatorId) ? 0.35 : 0;
    const creatorBoost = Math.min(1, emergentBoost * 0.7 + followBoost);

    const engagementNumerator =
      video.likesCount * 1.1 +
      video.commentsCount * 1.3 +
      video.sharesCount * 1.8;
    const engagementRate = engagementNumerator / Math.max(video.viewsCount, 10);
    const engagementSignal = Math.min(1, engagementRate);

    return {
      watchSignal,
      interestSignal,
      noveltySignal,
      creatorBoost,
      engagementSignal,
    };
  }

  private normalizeInterest(weight: number | undefined): number {
    if (!weight || weight <= 0) return 0;
    return Math.min(1, Math.log1p(weight) / Math.log(6));
  }
}

// ── Type mapping ─────────────────────────────────────────────────────────────

function toFeedVideo(v: any): FeedVideo {
  return {
    id: v.id,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl ?? undefined,
    description: v.description,
    trendTitle: v.trendTitle ?? undefined,
    durationSeconds: v.durationSeconds ?? undefined,
    likesCount: v.likesCount,
    commentsCount: v.commentsCount,
    sharesCount: v.sharesCount,
    viewsCount: v.viewsCount,
    isWarpDrop: v.isWarpDrop,
    createdAt: v.createdAt?.toISOString(),
    creator: {
      id: v.creator.id,
      username: v.creator.username,
      avatarUrl: v.creator.avatarUrl ?? undefined,
      bio: v.creator.bio ?? undefined,
      followersCount: v.creator.followersCount,
      videosCount: v.creator.videosCount,
      isVerified: v.creator.isVerified,
    },
    audioTrack: v.audioTrack
      ? {
          id: v.audioTrack.id,
          title: v.audioTrack.title,
          artist: v.audioTrack.artist,
          coverUrl: v.audioTrack.coverUrl ?? undefined,
          durationSeconds: v.audioTrack.durationSeconds ?? undefined,
          usedByCount: v.audioTrack.usedByCount,
        }
      : undefined,
    variants: [],
  };
}

function readEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return parsed;
}
