import { DateTime } from 'luxon';
import { QuizServerData, QuizClientData } from '../../../client/Trivia-Terrior/types/quizTypes';
import QuizController from '../controller/quizController';
import socketServer from '../socket';
import { clearInterval } from 'timers';
import { Server } from 'socket.io';
import http from 'http';
import QuizModel from '../models/QuizModel';
import DataService from '../services/dataService';

export const startQuiz = async (
	server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
	let startDateTime: DateTime;
	let countdownWaitingTimerId: NodeJS.Timeout;
	let countdownQuizStartTimerId: NodeJS.Timeout;
	let currentQuizId: number | null;
	let serverQuiz: QuizServerData;
	let clientQuiz: QuizClientData;
	let io: Server;

	// should be 10 minutes maybe
	const FETCH_UPCOMING_QUIZ_INTERVAL = 5000;
	const WAITING_ROOM_TIME = 5000;
	const isDevelopment = true;

	const fetchNextQuiz = async () => {
		console.log('Waiting for quiz.');
		currentQuizId = await DataService.getUpcomingQuizId();

		while (!currentQuizId) {
			console.log(
				`No upcoming quiz, polling for next in ${
					FETCH_UPCOMING_QUIZ_INTERVAL / 1000
				} seconds.`
			);
			await new Promise((resolve) => setTimeout(resolve, FETCH_UPCOMING_QUIZ_INTERVAL));
		}

		serverQuiz = await DataService.getCurrentQuizForServer(currentQuizId);
		clientQuiz = await DataService.getCurrentQuizForClient(currentQuizId);

		startDateTime = DateTime.fromJSDate(serverQuiz.startDateTime);
		console.log(
			'There is a quiz coming up:',
			startDateTime.toISODate(),
			startDateTime.toISOTime()
		);

		let countdownToQuizStart = countdownToStart(isDevelopment);
		let countdownToWaitingRoomOpen = countdownToQuizStart - WAITING_ROOM_TIME;

		// count till the room opens
		console.log(`${countdownToWaitingRoomOpen / 1000} seconds till waiting room opens.`);
		countdownWaitingTimerId = setInterval(() => {
			console.log('Initialising socket server.');
			io = socketServer(server);
			clearInterval(countdownWaitingTimerId);
			console.log(`${WAITING_ROOM_TIME / 1000} seconds till quiz starts.`);
		}, countdownToWaitingRoomOpen);

		countdownQuizStartTimerId = setInterval(() => {
			console.log('start quiz');
			clearInterval(countdownQuizStartTimerId);
			startQuizController(io);
		}, countdownToQuizStart);
	};

	const countdownToStart = (isDev = false) => {
		if (isDev) {
			return 5000;
		}

		if (startDateTime) {
			return startDateTime.diff(DateTime.now()).milliseconds;
		}
		throw 'No datetime found!';
	};

	const startQuizController = (io: Server) => {
		const quizController = new QuizController(io, new QuizModel(serverQuiz, clientQuiz));
		quizController.startQuiz();
	};

	await fetchNextQuiz();
};
