import 'reflect-metadata';
import express from 'express';
import http from 'http';
import socketServer from './socket';

const app = express();
const server = http.createServer(app);
const io = socketServer(server);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
	console.log(`Socket.IO server is listening on port ${PORT}`);
});
