import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db/prisma';

interface ProcessArgs {
  videoId: string;
  rawPath: string;
  uploadDir: string;
}

/**
 * Handles async transcoding and thumbnail extraction.
 * Produces:
 *   uploads/processed/{videoId}.mp4
 *   uploads/thumbnails/{videoId}.jpg
 */
export class VideoProcessingService {
  static async process({ videoId, rawPath, uploadDir }: ProcessArgs): Promise<void> {
    const processedPath = path.join(uploadDir, 'processed', `${videoId}.mp4`);
    const thumbnailPath = path.join(uploadDir, 'thumbnails', `${videoId}.jpg`);

    try {
      await this.transcode(rawPath, processedPath);
      await this.extractThumbnail(processedPath, thumbnailPath);
      const durationSeconds = await this.getDuration(processedPath);

      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'published',
          videoUrl: `/uploads/processed/${videoId}.mp4`,
          thumbnailUrl: `/uploads/thumbnails/${videoId}.jpg`,
          durationSeconds,
        },
      });

      // Remove raw file after successful processing
      fs.unlink(rawPath, () => {});
    } catch (err) {
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'failed' },
      });
      throw err;
    }
  }

  private static transcode(input: string, output: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
          '-pix_fmt yuv420p',
          // Keep portrait-first 9:19.5 feel while being device-safe
          '-vf scale=720:-2:flags=lanczos',
        ])
        .on('end', () => resolve())
        .on('error', (e) => reject(e))
        .save(output);
    });
  }

  private static extractThumbnail(input: string, output: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(output),
          folder: path.dirname(output),
          size: '480x854',
        })
        .on('end', () => resolve())
        .on('error', (e) => reject(e));
    });
  }

  private static getDuration(input: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) return reject(err);
        resolve(Math.round(metadata.format.duration ?? 0));
      });
    });
  }
}
