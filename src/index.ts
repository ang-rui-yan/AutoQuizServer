import 'reflect-metadata';
import express from 'express';
import http from 'http';
import { initialiseQuizFlow, pollUntilQuizFound } from './manager/quizManager';
import GlobalQuizState from './utils/GlobalQuizState';
import { EventEmitter } from 'stream';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

const FETCH_UPCOMING_QUIZ_INTERVAL = 5000;

const quizListener = new EventEmitter();

const startServer = async () => {
	server.listen(PORT, async () => {
		console.log(`Socket.IO server is listening on port ${PORT}.`);

		quizListener.on('change', async (hasQuizStarted: boolean) => {
			if (hasQuizStarted) {
				quizListener.removeAllListeners('change');
				initialiseQuizFlow(server);
				clearInterval(interval);
			} else {
				await pollUntilQuizFound();
			}
		});

		// check if there is a quiz
		// if no quiz within the next 30 minutes, start/continue the poll for a quiz
		const interval = setInterval(() => {
			quizListener.emit('change', GlobalQuizState.getInstance().getHasUpcomingQuiz());
		}, 2000);
	});
};

startServer();
