let io = null;

const userIdSocketIdMap = {};

export function setIO(serverIO) {
  io = serverIO;
}

export function registerUserSocket(userId, socketId) {
  if (userId) userIdSocketIdMap[userId] = socketId;
}

export function unregisterUserSocket(userId) {
  if (userId) delete userIdSocketIdMap[userId];
}

export function emitToUser(userId, event, payload) {
  try {
    const socketId = userIdSocketIdMap[userId];
    if (io && socketId) {
      io.to(socketId).emit(event, payload);
      return true;
    }
  } catch (e) {
    console.error('emitToUser error', e);
  }
  return false;
}

export function getMap() {
  return userIdSocketIdMap;
}

export default {
  setIO,
  registerUserSocket,
  unregisterUserSocket,
  emitToUser,
  getMap
};

