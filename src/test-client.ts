import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
	console.log('Connected to Socket.IO server');

	// Emit a chat message to the server
	socket.emit('chatMessage', 'Hello, server!');
});

socket.on('chatMessage', (message: string) => {
	console.log('Received chat message from server:', message);
});
