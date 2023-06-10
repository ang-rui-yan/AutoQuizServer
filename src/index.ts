import 'reflect-metadata';
import express from 'express';
import http from 'http';
import socketServer from './socket';
import dataService from './services/dataService';
import { clearInterval } from 'timers';
import { Server } from 'socket.io';
import { DateTime, Duration } from 'luxon';
import { QuizData } from '../../client/Trivia-Terrior/types/quizTypes';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
let io: Server;

let startDateTime: DateTime;
let timerId: NodeJS.Timeout;
let quiz: QuizData | null;

// should be 10 minutes maybe
const fetchUpcomingQuizInterval = 2000;
const WAITING_ROOM_TIME = 1000;
const isDevelopment = true;

const fetchNextQuiz = async () => {
	(async () => {
		console.log('Waiting for quiz.');
		quiz = await dataService.getUpcomingQuiz();
		while (!quiz) {
			console.log(
				`No upcoming quiz, polling for next in ${fetchUpcomingQuizInterval} minutes.`
			);
			await new Promise((resolve) => setTimeout(resolve, fetchUpcomingQuizInterval));
		}
		startDateTime = DateTime.fromJSDate(quiz.startDateTime);
		console.log(
			'There is a quiz coming up:',
			startDateTime.toISODate(),
			startDateTime.toISOTime()
		);
		let countdownInterval = countdownToStart(isDevelopment) - WAITING_ROOM_TIME;

		console.log(`${countdownInterval} milliseconds till waiting room opens.`);
		timerId = setInterval(() => {
			console.log('Initialising socket server.');
			io = socketServer(server);
			clearInterval(timerId);
		}, countdownInterval);
	})();
};
const countdownToStart = (isDev = false) => {
	if (isDev) {
		return 1000;
	}

	if (startDateTime) {
		return startDateTime.diff(DateTime.now()).milliseconds;
	}
	throw 'No datetime found!';
};

server.listen(PORT, () => {
	console.log(`Socket.IO server is listening on port ${PORT}.`);
	fetchNextQuiz();
});
