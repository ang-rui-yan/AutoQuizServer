import 'reflect-metadata';
import express from 'express';
import http from 'http';
import { startQuiz } from './manager/quizManager';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

const startServer = async () => {
	server.listen(PORT, () => {
		console.log(`Socket.IO server is listening on port ${PORT}.`);
		startQuiz(server);
	});
};

startServer();
