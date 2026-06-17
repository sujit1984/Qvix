import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuantumFeedScreen } from '@/screens/QuantumFeedScreen';
import { useFeedStore } from '@/store/feedStore';
import { colors } from '@/constants/theme';
import type { FeedVideo } from '@qvix/shared';

export default function HomeScreen() {
  const setVideos = useFeedStore((s) => s.setVideos);

  useEffect(() => {
    setVideos(MOCK_VIDEOS);
  }, [setVideos]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <QuantumFeedScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});

const MOCK_VIDEOS: FeedVideo[] = [
  {
    id: '1',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuck/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    thumbnailUrl: '',
    description: 'Quantum Feed prototype with multi-axis gestures 🚀 #QuantumVibes',
    trendTitle: 'QuantumVibes',
    likesCount: 32000,
    commentsCount: 1200,
    sharesCount: 540,
    viewsCount: 800000,
    isWarpDrop: false,
    creator: {
      id: 'c1',
      username: 'alex_quantum',
      avatarUrl: '',
      bio: 'Qvix creator',
      followersCount: 10000,
      videosCount: 40,
      isVerified: true,
    },
    audioTrack: { id: 'a1', title: 'Quantum Beat', artist: 'DJ Warp', usedByCount: 22000 },
    variants: [
      {
        id: '1-v1',
        videoUrl: 'https://test-videos.co.uk/vids/bigbuck/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
        thumbnailUrl: '',
        description: 'Parody version #1',
        trendTitle: 'QuantumVibes',
        likesCount: 8000,
        commentsCount: 200,
        sharesCount: 90,
        viewsCount: 120000,
        isWarpDrop: false,
        creator: {
          id: 'c2',
          username: 'rio_parody',
          avatarUrl: '',
          bio: 'Parody loops',
          followersCount: 220,
          videosCount: 8,
          isVerified: false,
        },
        audioTrack: { id: 'a1', title: 'Quantum Beat', artist: 'DJ Warp', usedByCount: 22000 },
      },
    ],
  },
  {
    id: '2',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuck/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    thumbnailUrl: '',
    description: 'Zero follower warp drop moment 🌟 #WarpDrop',
    trendTitle: 'WarpDrop',
    likesCount: 4500,
    commentsCount: 260,
    sharesCount: 140,
    viewsCount: 120000,
    isWarpDrop: true,
    creator: {
      id: 'c3',
      username: 'nova_newbie',
      avatarUrl: '',
      bio: 'First day on Qvix',
      followersCount: 0,
      videosCount: 1,
      isVerified: false,
    },
    audioTrack: { id: 'a2', title: 'Hyperloop Echo', artist: 'Pulse Core', usedByCount: 9700 },
    variants: [],
  },
];
