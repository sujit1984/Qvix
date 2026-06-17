import type { Server as SocketIOServer, Socket } from 'socket.io';

export function registerSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    socket.on('feed:join', (payload: { userId?: string }) => {
      if (payload.userId) {
        socket.join(`user:${payload.userId}`);
      }
    });

    socket.on('video:view', (payload: { videoId: string }) => {
      // Could aggregate real-time view counters here (Redis + batching)
      io.emit('video:view:update', {
        videoId: payload.videoId,
        delta: 1,
      });
    });

    socket.on('video:like', (payload: { videoId: string; liked: boolean }) => {
      io.emit('video:like:update', payload);
    });

    socket.on('disconnect', () => {
      // no-op for now
    });
  });
}
