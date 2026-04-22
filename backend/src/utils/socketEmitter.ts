import { Server } from 'socket.io';

let io: Server | null = null;

export const setIo = (socketIo: Server) => {
  io = socketIo;
};

export const getIo = (): Server | null => {
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
    // Also try legacy room names
    io.to(`seller-${userId}`).emit(event, data);
    io.to(`delivery-${userId}`).emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: any) => {
  if (io) {
    io.to(`role-${role.toLowerCase()}`).emit(event, data);
    // Legacy support
    if (role.toLowerCase() === 'admin') {
      io.to('admin-notifications').emit(event, data);
    }
  }
};
