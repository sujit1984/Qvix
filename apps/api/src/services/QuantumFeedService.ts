import { prisma } from '../db/prisma';
import type { FeedPage, FeedVideo, QuantumFeedConfig } from '@qvix/shared';
import { DEFAULT_QUANTUM_CONFIG } from '@qvix/shared';

interface GetPageOptions {
  userId?: string;
  cursor: number;
  limit: number;
}

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
    if (userId) {
      // Personalised: prefer videos from followed creators + matching interest tags
      const followedIds = await prisma.follow
        .findMany({ where: { followerId: userId }, select: { followingId: true } })
        .then((rows: Array<{ followingId: string }>) => rows.map((r: { followingId: string }) => r.followingId));

      const videos = await prisma.video.findMany({
        where: {
          status: 'published',
          isWarpDrop: false,
          ...(followedIds.length > 0 ? { creatorId: { in: followedIds } } : {}),
        },
        include: { creator: true, audioTrack: true },
        orderBy: { viewsCount: 'desc' },
        skip: cursor,
        take: count,
      });

      // If not enough personalised content, fall back to global trending
      if (videos.length < count) {
        const extra = await prisma.video.findMany({
          where: {
            status: 'published',
            isWarpDrop: false,
            id: { notIn: videos.map((v: any) => v.id) },
          },
          include: { creator: true, audioTrack: true },
          orderBy: { viewsCount: 'desc' },
          take: count - videos.length,
        });
        videos.push(...extra);
      }

      return videos.map(toFeedVideo);
    }

    // Anonymous: global trending
    const videos = await prisma.video.findMany({
      where: { status: 'published', isWarpDrop: false },
      include: { creator: true, audioTrack: true },
      orderBy: [{ viewsCount: 'desc' }, { createdAt: 'desc' }],
      skip: cursor,
      take: count,
    });
    return videos.map(toFeedVideo);
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
