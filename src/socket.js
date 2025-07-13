import { io } from 'socket.io-client';

// IMPORTANT: Set VITE_SERVER_URL in your .env file for production!
// Example: VITE_SERVER_URL=https://your-backend-url.onrender.com
// For local development, it will default to http://localhost:5000
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
export const socket = io(URL, { autoConnect: false });
