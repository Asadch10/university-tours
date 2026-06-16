// Socket.IO chat gateway with a Redis adapter for multi-instance fan-out (Part I §3.2).
// Realtime events: message:send (in) -> message:new (out), typing.
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { connection } from './queues.js';
import { logger } from './logger.js';

export function startChatServer(port: number) {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    path: '/socket',
    cors: { origin: true, credentials: true },
  });

  // Redis adapter so messages fan out across worker instances.
  const pubClient = connection.duplicate();
  const subClient = connection.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    // TODO: authenticate the Bearer token from socket.handshake.auth and attach the principal.
    void socket;
    next();
  });

  io.on('connection', (socket) => {
    logger.debug({ id: socket.id }, 'socket connected');

    socket.on('message:send', async (payload) => {
      // TODO: validate, apply contact-masking, persist the message, emit to the conversation room.
      socket.emit('message:new', { ...payload, pending: true });
    });

    socket.on('typing', (payload) => {
      socket.broadcast.emit('typing', payload);
    });

    socket.on('disconnect', () => logger.debug({ id: socket.id }, 'socket disconnected'));
  });

  httpServer.listen(port, () => logger.info(`Socket.IO chat gateway on :${port}/socket`));
  return io;
}
