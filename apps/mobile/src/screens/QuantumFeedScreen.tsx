import { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useFeedStore } from '@/store/feedStore';
import { colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 60;

export function QuantumFeedScreen() {
  const {
    videos,
    currentIndex,
    variantIndex,
    nextVideo,
    prevVideo,
    nextVariant,
    prevVariant,
    isWarpActive,
    triggerWarp,
    resetWarp,
  } = useFeedStore();

  const video = videos[currentIndex];
  const activeVideo = useMemo(() => {
    if (!video) return undefined;
    return variantIndex > 0 ? video.variants[variantIndex - 1] ?? video : video;
  }, [video, variantIndex]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const warpOpacity = useSharedValue(0);
  const cameraRef = useRef<CameraView | null>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdFired = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordAsWarpDrop, setRecordAsWarpDrop] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const openRecorder = async (asWarpDrop: boolean) => {
    const granted = permission?.granted ?? false;
    if (!granted) {
      const req = await requestPermission();
      if (!req.granted) {
        setUploadState('error');
        setUploadMessage('Camera permission is required for Pulse recording.');
        return;
      }
    }

    setRecordAsWarpDrop(asWarpDrop);
    setRecordedUri(null);
    setDescription('');
    setUploadState('idle');
    setUploadMessage('');
    setShowRecorder(true);
  };

  const closeRecorder = () => {
    if (isRecording) {
      cameraRef.current?.stopRecording();
    }
    setIsRecording(false);
    setShowRecorder(false);
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setUploadState('idle');
      setUploadMessage('Recording...');
      setIsRecording(true);

      const result = await cameraRef.current.recordAsync({
        maxDuration: 30,
      });

      if (result?.uri) {
        setRecordedUri(result.uri);
        setUploadMessage('Recording captured.');
      }
    } catch {
      setUploadState('error');
      setUploadMessage('Failed to record video.');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !isRecording) return;
    cameraRef.current.stopRecording();
  };

  const uploadRecording = async () => {
    if (!recordedUri) return;

    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const authToken = process.env.EXPO_PUBLIC_QVIX_AUTH_TOKEN;

    if (!apiUrl) {
      setUploadState('error');
      setUploadMessage('EXPO_PUBLIC_API_URL is not configured.');
      return;
    }

    if (!authToken) {
      setUploadState('error');
      setUploadMessage('EXPO_PUBLIC_QVIX_AUTH_TOKEN is required for upload auth.');
      return;
    }

    const form = new FormData();
    form.append(
      'file',
      {
        uri: recordedUri,
        name: `pulse-${Date.now()}.mp4`,
        type: 'video/mp4',
      } as any
    );
    form.append('description', description.trim() || 'Recorded with mobile Pulse Trigger');
    form.append('trendTitle', activeVideo?.trendTitle ?? 'PulseTrigger');
    form.append('isWarpDrop', String(recordAsWarpDrop));

    try {
      setUploadState('uploading');
      setUploadMessage('Uploading Pulse clip...');

      const res = await fetch(`${apiUrl}/api/upload/video`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Upload failed');
      }

      setUploadState('done');
      setUploadMessage('Upload accepted. Processing started.');
      setTimeout(() => {
        setShowRecorder(false);
      }, 700);
    } catch (err) {
      setUploadState('error');
      setUploadMessage(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const onSwipeVertical = (dy: number) => {
    if (dy < -SWIPE_THRESHOLD) {
      // Swipe up -> Creator Profile (placeholder action)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (dy > SWIPE_THRESHOLD) {
      // Swipe down -> Next Trend
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      nextVideo();
    }
  };

  const onSwipeHorizontal = (dx: number) => {
    if (dx > SWIPE_THRESHOLD) {
      // Swipe right -> Next Variant
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      nextVariant();
    } else if (dx < -SWIPE_THRESHOLD) {
      // Swipe left -> Previous Variant
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      prevVariant();
    }
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      rotateY.value = e.translationX * 0.08;
    })
    .onEnd((e) => {
      runOnJS(onSwipeVertical)(e.translationY);
      runOnJS(onSwipeHorizontal)(e.translationX);

      translateX.value = withSpring(0, { damping: 20, stiffness: 180 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
      rotateY.value = withSpring(0, { damping: 20, stiffness: 180 });
    });

  const animatedVideoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const animatedWarpStyle = useAnimatedStyle(() => ({
    opacity: warpOpacity.value,
  }));

  const onPulseTap = () => {
    Haptics.selectionAsync();
    openRecorder(false);
  };

  const onPulseHoldStart = () => {
    holdFired.current = false;
    holdTimer.current = setTimeout(() => {
      holdFired.current = true;
      triggerWarp();
      openRecorder(true);
      warpOpacity.value = withTiming(1, { duration: 180 }, () => {
        warpOpacity.value = withTiming(0, { duration: 800 }, () => {
          runOnJS(resetWarp)();
          runOnJS(nextVideo)();
        });
      });
    }, 650);
  };

  const onPulseHoldEnd = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (!holdFired.current) {
      onPulseTap();
    }
  };

  if (!activeVideo) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Calibrating Quantum Feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.topButton}>
          <Text style={styles.topButtonText}>⚡ WARP SPEED</Text>
        </Pressable>
        <Text style={styles.brand}>QVIX</Text>
        <Pressable style={styles.iconButton}>
          <Text style={styles.iconText}>⚙️</Text>
        </Pressable>
      </View>

      {/* Main Video Surface with 4-axis gesture */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.videoWrap, animatedVideoStyle]}>
          <Video
            source={{ uri: activeVideo.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted={false}
          />

          {/* Mid-left Audio Remix Node */}
          <Pressable style={[styles.horizonNode, styles.leftNode]}>
            <Text style={styles.nodeEmoji}>📢</Text>
            <Text style={styles.nodeLabel}>AUDIO REMIX</Text>
          </Pressable>

          {/* Mid-right Sound Toggle Node */}
          <Pressable style={[styles.horizonNode, styles.rightNode]}>
            <Text style={styles.nodeEmoji}>🔊</Text>
            <Text style={styles.nodeLabel}>SOUND</Text>
          </Pressable>

          {/* Bottom Dashboard Dock */}
          <BlurView intensity={35} tint="dark" style={styles.dock}>
            <View style={styles.metaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.handle}>@{activeVideo.creator.username}</Text>
                <Text numberOfLines={1} style={styles.description}>
                  {activeVideo.description}
                </Text>
              </View>
              <Pressable style={styles.discoverBtn}>
                <Text style={styles.discoverText}>💠 DISCOVER</Text>
              </Pressable>
            </View>

            <View style={styles.controlsRow}>
              <Text style={styles.hint}>◄ ALT REEL</Text>

              <Pressable
                onPressIn={onPulseHoldStart}
                onPressOut={onPulseHoldEnd}
                style={styles.pulseTrigger}
              >
                <View style={styles.pulseCore} />
              </Pressable>

              <Text style={styles.hint}>NEXT TREND ►</Text>
            </View>
          </BlurView>
        </Animated.View>
      </GestureDetector>

      {/* Warp overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.warpOverlay, animatedWarpStyle]}
      >
        <Text style={styles.warpText}>WARP DROP</Text>
      </Animated.View>

      {/* Debug direction map hints */}
      <View style={styles.navHintMap} pointerEvents="none">
        <Text style={styles.mapHint}>▲ Profile</Text>
        <View style={styles.mapMidRow}>
          <Text style={styles.mapHint}>◄ Prev Variant</Text>
          <Text style={styles.mapHint}>Next Variant ►</Text>
        </View>
        <Text style={styles.mapHint}>▼ Next Trend</Text>
      </View>

      {isWarpActive && <View style={styles.warpPulse} />}

      {showRecorder && (
        <View style={styles.recorderOverlay}>
          <View style={styles.recorderCard}>
            <View style={styles.recorderHeader}>
              <Text style={styles.recorderTitle}>
                {recordAsWarpDrop ? 'Warp Drop Capture' : 'Pulse Recorder'}
              </Text>
              <Pressable onPress={closeRecorder} style={styles.closeRecorderBtn}>
                <Text style={styles.closeRecorderText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.cameraPreviewWrap}>
              {recordedUri ? (
                <Video
                  source={{ uri: recordedUri }}
                  style={styles.cameraPreview}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                />
              ) : (
                <CameraView
                  ref={cameraRef}
                  style={styles.cameraPreview}
                  facing="front"
                  mode="video"
                  mute={false}
                />
              )}
            </View>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a caption"
              placeholderTextColor="rgba(185,185,214,0.8)"
              style={styles.captionInput}
            />

            <View style={styles.recorderActions}>
              <Pressable
                style={[styles.recorderBtn, !recordedUri ? styles.recorderBtnPrimary : null]}
                onPress={startRecording}
                disabled={isRecording || !!recordedUri}
              >
                <Text style={styles.recorderBtnText}>Record</Text>
              </Pressable>
              <Pressable
                style={styles.recorderBtn}
                onPress={stopRecording}
                disabled={!isRecording}
              >
                <Text style={styles.recorderBtnText}>Stop</Text>
              </Pressable>
              <Pressable
                style={[styles.recorderBtn, styles.recorderBtnPrimary]}
                onPress={uploadRecording}
                disabled={!recordedUri || uploadState === 'uploading'}
              >
                <Text style={styles.recorderBtnText}>
                  {uploadState === 'uploading' ? 'Uploading...' : 'Upload'}
                </Text>
              </Pressable>
            </View>

            {uploadMessage ? (
              <View style={styles.statusRow}>
                {uploadState === 'uploading' && (
                  <ActivityIndicator size="small" color={colors.warp} />
                )}
                <Text style={styles.statusText}>{uploadMessage}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)',
    backgroundColor: 'rgba(0,212,255,0.12)',
  },
  topButtonText: {
    color: colors.warp,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brand: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 16 },
  videoWrap: {
    flex: 1,
  },
  video: {
    width,
    height,
  },
  horizonNode: {
    position: 'absolute',
    top: height * 0.42,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  leftNode: {
    left: 14,
    borderColor: 'rgba(123,95,245,0.6)',
    backgroundColor: 'rgba(123,95,245,0.2)',
  },
  rightNode: {
    right: 14,
    borderColor: 'rgba(0,212,255,0.6)',
    backgroundColor: 'rgba(0,212,255,0.2)',
  },
  nodeEmoji: { fontSize: 18 },
  nodeLabel: {
    position: 'absolute',
    bottom: -16,
    color: '#B9B9D6',
    fontSize: 8,
    letterSpacing: 0.3,
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42,42,62,0.8)',
    backgroundColor: 'rgba(10,10,15,0.7)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  handle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 2,
  },
  description: {
    color: colors.muted,
    fontSize: 12,
  },
  discoverBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.5)',
    backgroundColor: 'rgba(0,212,255,0.15)',
  },
  discoverText: {
    color: colors.warp,
    fontSize: 10,
    fontWeight: '700',
  },
  controlsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    color: colors.muted,
    fontSize: 10,
  },
  pulseTrigger: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pulse,
    shadowColor: colors.pulse,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  pulseCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  warpOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  warpText: {
    color: colors.warp,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  navHintMap: {
    position: 'absolute',
    top: height * 0.16,
    left: 0,
    right: 0,
    zIndex: 12,
    alignItems: 'center',
    gap: 6,
  },
  mapMidRow: {
    width: '100%',
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
  },
  warpPulse: {
    position: 'absolute',
    top: height * 0.45,
    left: width * 0.35,
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: 'rgba(0,212,255,0.25)',
    zIndex: 41,
  },
  recorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 70,
    backgroundColor: 'rgba(0,0,0,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  recorderCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(16,16,24,0.96)',
    padding: 12,
    gap: 10,
  },
  recorderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recorderTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  closeRecorderBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  closeRecorderText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '700',
  },
  cameraPreviewWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 320,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#000',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
  },
  captionInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  recorderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  recorderBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  recorderBtnPrimary: {
    borderColor: 'rgba(0,212,255,0.5)',
    backgroundColor: 'rgba(0,212,255,0.15)',
  },
  recorderBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: colors.muted,
    fontSize: 12,
  },
});
