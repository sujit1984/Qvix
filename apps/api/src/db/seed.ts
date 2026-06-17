import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding Qvix database...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Create demo users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alex@qvix.app' },
      update: {},
      create: {
        username: 'alex_quantum',
        email: 'alex@qvix.app',
        passwordHash,
        bio: 'Quantum creator • AI + Tech',
        followersCount: 12400,
        videosCount: 42,
        isVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'maya@qvix.app' },
      update: {},
      create: {
        username: 'maya_loops',
        email: 'maya@qvix.app',
        passwordHash,
        bio: 'Dance loops and viral remixes',
        followersCount: 8600,
        videosCount: 31,
      },
    }),
    prisma.user.upsert({
      where: { email: 'nova@qvix.app' },
      update: {},
      create: {
        username: 'nova_newbie',
        email: 'nova@qvix.app',
        passwordHash,
        bio: 'First day on Qvix 🚀',
        followersCount: 0,
        videosCount: 1,
      },
    }),
    prisma.user.upsert({
      where: { email: 'rio@qvix.app' },
      update: {},
      create: {
        username: 'rio_parody',
        email: 'rio@qvix.app',
        passwordHash,
        bio: 'Parody and reaction loops',
        followersCount: 220,
        videosCount: 8,
      },
    }),
  ]);

  // Audio tracks
  const tracks = await Promise.all([
    prisma.audioTrack.upsert({
      where: { id: 'track-quantum-beat' },
      update: {},
      create: {
        id: 'track-quantum-beat',
        title: 'Quantum Beat',
        artist: 'DJ Warp',
        usedByCount: 22000,
      },
    }),
    prisma.audioTrack.upsert({
      where: { id: 'track-hyperloop' },
      update: {},
      create: {
        id: 'track-hyperloop',
        title: 'Hyperloop Echo',
        artist: 'Pulse Core',
        usedByCount: 9700,
      },
    }),
  ]);

  // Base trend video
  const baseVideo = await prisma.video.upsert({
    where: { id: 'video-base-1' },
    update: {},
    create: {
      id: 'video-base-1',
      creatorId: users[0].id,
      audioTrackId: tracks[0].id,
      videoUrl: '/uploads/processed/demo-base-1.mp4',
      thumbnailUrl: '/uploads/thumbnails/demo-base-1.jpg',
      description: 'POV: Building the future feed engine in 30 seconds ⚡',
      trendTitle: 'QuantumVibes',
      likesCount: 32000,
      commentsCount: 1800,
      sharesCount: 4200,
      viewsCount: 820000,
      status: 'published',
    },
  });

  // Variants for multi-thread
  await prisma.video.upsert({
    where: { id: 'video-variant-1' },
    update: {},
    create: {
      id: 'video-variant-1',
      creatorId: users[1].id,
      parentVideoId: baseVideo.id,
      audioTrackId: tracks[0].id,
      videoUrl: '/uploads/processed/demo-variant-1.mp4',
      thumbnailUrl: '/uploads/thumbnails/demo-variant-1.jpg',
      description: 'Dance loop version 💃 #QuantumVibes',
      trendTitle: 'QuantumVibes',
      likesCount: 11000,
      commentsCount: 530,
      sharesCount: 1200,
      viewsCount: 290000,
      status: 'published',
    },
  });

  await prisma.video.upsert({
    where: { id: 'video-variant-2' },
    update: {},
    create: {
      id: 'video-variant-2',
      creatorId: users[3].id,
      parentVideoId: baseVideo.id,
      audioTrackId: tracks[0].id,
      videoUrl: '/uploads/processed/demo-variant-2.mp4',
      thumbnailUrl: '/uploads/thumbnails/demo-variant-2.jpg',
      description: 'Reaction/parody mode 😂 #QuantumVibes',
      trendTitle: 'QuantumVibes',
      likesCount: 7800,
      commentsCount: 490,
      sharesCount: 900,
      viewsCount: 210000,
      status: 'published',
    },
  });

  // Warp drop video from zero-follower creator
  await prisma.video.upsert({
    where: { id: 'video-warp-1' },
    update: {},
    create: {
      id: 'video-warp-1',
      creatorId: users[2].id,
      audioTrackId: tracks[1].id,
      videoUrl: '/uploads/processed/demo-warp-1.mp4',
      thumbnailUrl: '/uploads/thumbnails/demo-warp-1.jpg',
      description: 'First upload ever... did this just explode? 🌟',
      trendTitle: 'WarpDrop',
      likesCount: 4500,
      commentsCount: 260,
      sharesCount: 700,
      viewsCount: 120000,
      isWarpDrop: true,
      status: 'published',
    },
  });

  console.log('✅ Seed complete');
  console.log('Demo login: alex@qvix.app / Password123!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
