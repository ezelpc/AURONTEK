import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PERMISSIONS } from '../Constants/permissions';
// Note: We cannot easily import from another microservice source in TS without path mapping. 
// For now, we decode the token which should have permissions if we updated auth.controller to include them?
// ACTUALLY: The token usually only has basic info.
// Option A: Token has permissions (bloated token).
// Option B: Fetch from DB/Redis.
// Option C: We passed 'permisos' in the login response, but maybe not in the token.
// Let's check what auth.controller puts in the token. 
// Checking auth.controller previously: payload = { usuario: { _id, nombre, ..., rol, empresa } }.
// It does NOT seem to include `permisos` in the token payload itself, only in the JSON response.
// WE NEED TO FETCH PERMISSIONS.
// Or, for MVP, we just rely on Role if we can't fetch.
// BETTER: The `internal.listener` uses user ID.
// Let's implement basic JWT validaton first.

export interface SocketWithUser extends Socket {
    user?: any;
}

export const socketAuthMiddleware = (socket: SocketWithUser, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
        return next(new Error('Autenticación requerida'));
    }

    try {
        const secret = process.env.JWT_SECRET || 'secret_dev'; // Fallback for dev
        const decoded = jwt.verify(token, secret);
        socket.user = decoded;

        // Join own room
        // "user:{ID}"
        const userId = (decoded as any).id || (decoded as any).uid || (decoded as any)._id; // Normalize ID
        if (userId) {
            socket.join(`user:${userId}`);
            // console.log(`[Socket] User ${userId} authenticated and joined user:${userId}`);
        }

        next();
    } catch (error) {
        next(new Error('Token inválido'));
    }
};
