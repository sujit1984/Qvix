'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { FeedVideo } from '@qvix/shared';

const PAGE_SIZE = 10;

async function fetchFeedPage({
  pageParam = 0,
}: {
  pageParam: number;
}): Promise<{ videos: FeedVideo[]; nextCursor: number | null }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/feed?cursor=${pageParam}&limit=${PAGE_SIZE}`,
    { credentials: 'include' }
  );
  if (!res.ok) {
    // Return mock data in development if API is unavailable
    return {
      videos: generateMockVideos(pageParam, PAGE_SIZE),
      nextCursor: pageParam + PAGE_SIZE,
    };
  }
  return res.json();
}

export function useQuantumFeed() {
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['quantum-feed'],
    queryFn: fetchFeedPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const videos = useMemo(
    () => data?.pages.flatMap((p) => p.videos) ?? [],
    [data]
  );

  const loadMore = useCallback(() => {
    if (!isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, isFetchingNextPage]);

  return { videos, loadMore, isLoading };
}

// ── Mock data generator for development ────────────────────────────────────
function generateMockVideos(cursor: number, count: number): FeedVideo[] {
  const isWarpDrop = (i: number) => i % 3 === 2; // every 3rd video is a Warp Drop

  return Array.from({ length: count }, (_, i) => {
    const id = cursor + i;
    const warp = isWarpDrop(i);
    return {
      id: `video-${id}`,
      videoUrl: `https://test-videos.co.uk/vids/bigbuck/${id % 2 === 0 ? 'mp4' : 'webm'}/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4`,
      thumbnailUrl: `https://picsum.photos/seed/${id}/400/700`,
      description: warp
        ? `🌟 Brand new creator moment! #WarpDrop #QuantumVibes`
        : `Living the quantum life — swipe right to see all takes 🎯 #trending ${id}`,
      trendTitle: warp ? 'WarpDrop' : 'QuantumVibes',
      likesCount: Math.floor(Math.random() * 500_000),
      commentsCount: Math.floor(Math.random() * 50_000),
      sharesCount: Math.floor(Math.random() * 20_000),
      viewsCount: Math.floor(Math.random() * 2_000_000),
      isWarpDrop: warp,
      creator: {
        id: `creator-${id}`,
        username: warp ? `nova_${id}` : `creator_${id}`,
        avatarUrl: `https://picsum.photos/seed/av${id}/100/100`,
        followersCount: warp ? 0 : Math.floor(Math.random() * 1_000_000),
        videosCount: warp ? 1 : Math.floor(Math.random() * 500),
        isVerified: !warp && id % 5 === 0,
        bio: 'Content creator on Qvix ✨',
      },
      audioTrack: {
        id: `audio-${id % 20}`,
        title: `Quantum Beat ${id % 20}`,
        artist: `DJ Warp`,
        usedByCount: Math.floor(Math.random() * 100_000),
      },
      variants: i % 2 === 0
        ? Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, vi) => ({
            id: `video-${id}-v${vi}`,
            videoUrl: `https://test-videos.co.uk/vids/bigbuck/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4`,
            thumbnailUrl: `https://picsum.photos/seed/${id}v${vi}/400/700`,
            description: `Alt take #${vi + 1} 🎬 #MultiThread`,
            trendTitle: 'MultiThread',
            likesCount: Math.floor(Math.random() * 200_000),
            commentsCount: Math.floor(Math.random() * 10_000),
            sharesCount: Math.floor(Math.random() * 5_000),
            viewsCount: Math.floor(Math.random() * 500_000),
            isWarpDrop: false,
            creator: {
              id: `creator-${id}-v${vi}`,
              username: `remixer_${vi}`,
              avatarUrl: `https://picsum.photos/seed/remi${vi}/100/100`,
              followersCount: Math.floor(Math.random() * 50_000),
              videosCount: Math.floor(Math.random() * 100),
              isVerified: false,
              bio: 'Remixer on Qvix',
            },
            audioTrack: {
              id: `audio-${id % 20}`,
              title: `Quantum Beat ${id % 20}`,
              artist: `DJ Warp`,
              usedByCount: Math.floor(Math.random() * 100_000),
            },
            variants: [],
          }))
        : [],
    };
  });
}
