import 'reflect-metadata';
import express from 'express';
import http from 'http';
import { initialiseQuizFlow, pollUntilQuizFound } from './manager/quizManager';
import GlobalQuizState from './utils/GlobalQuizState';
import { EventEmitter } from 'stream';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

const FETCH_UPCOMING_QUIZ_INTERVAL = 1000 * 5;
const FETCH_END_QUIZ_INTERVAL = 1000 * 60;

const quizListener = new EventEmitter();

const startServer = async () => {
	let fetchInterval = FETCH_UPCOMING_QUIZ_INTERVAL;
	let currentQuizState = false;

	server.listen(PORT, async () => {
		console.log(`Socket.IO server is listening on port ${PORT}.`);

		quizListener.on('change', async (hasQuizStarted: boolean) => {
			if (hasQuizStarted && hasQuizStarted != currentQuizState) {
				await initialiseQuizFlow(server);
				fetchInterval = FETCH_END_QUIZ_INTERVAL;
				currentQuizState = true;
			} else if (hasQuizStarted) {
				fetchInterval = FETCH_END_QUIZ_INTERVAL;
			} else {
				await pollUntilQuizFound();
				fetchInterval = FETCH_UPCOMING_QUIZ_INTERVAL;
				currentQuizState = false;
			}
		});

		// check if there is a quiz
		// if no quiz within the next 30 minutes, start/continue the poll for a quiz
		const interval = setInterval(() => {
			quizListener.emit('change', GlobalQuizState.getInstance().getHasUpcomingQuiz());
		}, fetchInterval);
	});
};

startServer();
