import jwt from "jsonwebtoken";

export function authenticateSocket(socket, next) {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to socket
    socket.userData = { id: decoded.id };
    
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new Error("Authentication error: Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new Error("Authentication error: Token expired"));
    }
    return next(new Error("Authentication error"));
  }
}