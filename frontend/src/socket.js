import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000';

export const socket = io(URL, {
    autoConnect: false,
    withCredentials: true,
    reconnection: true,    // Enable reconnection
  reconnectionAttempts: Infinity, // Number of reconnection attempts (-1 for infinity)
  reconnectionDelay: 1000,        // Initial delay in milliseconds before attempting to reconnect
  reconnectionDelayMax: 5000,     // Maximum delay in milliseconds between reconnect attempts
  randomizationFactor: 0.5        // Randomization factor applied to the reconnection delay
  });
