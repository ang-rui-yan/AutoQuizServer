import { DateTime } from 'luxon';
import QuizController from '../controller/QuizController';
import socketServer from '../socket';
import { clearInterval } from 'timers';
import { Server } from 'socket.io';
import http from 'http';
import DataService from '../services/dataService';
import GlobalQuizState from '../utils/GlobalQuizState';
import {
	EVENT_WAITING_ROOM,
	EVENT_WAITING_ROOM_COUNTDOWN,
} from '../constants/socketEventConstants';
import {
	DEVELOPMENT_COUNTDOWN,
	TIME_TO_LOCK_IN_QUIZ_IN_MINUTES,
	TIME_TO_LOCK_IN_QUIZ_IN_MINUTES_DEV,
	WAITING_ROOM_TIME,
	WAITING_ROOM_TIME_DEV,
	isDevelopment,
} from '../constants/variableConstants';

const globalQuizState: GlobalQuizState = GlobalQuizState.getInstance();

export const pollUntilQuizFound = async () => {
	console.log('Polling for upcoming quiz.');

	const time_before = isDevelopment
		? TIME_TO_LOCK_IN_QUIZ_IN_MINUTES_DEV
		: TIME_TO_LOCK_IN_QUIZ_IN_MINUTES;

	await DataService.getUpcomingQuizInXMinutes(time_before).then(async (currentQuizId) => {
		if (currentQuizId < 0) {
			console.log('No upcoming quiz');
			return false;
		} else {
			await globalQuizState.setQuiz(currentQuizId);

			console.log(
				'There is a quiz coming up:',
				globalQuizState.getQuizStartTime().toISODate(),
				globalQuizState.getQuizStartTime().toISOTime()
			);

			return true;
		}
	});
};

export const initialiseQuizFlow = (
	server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
	// 15 minutes before -> open waiting room
	// 0 minutes -> close waiting room, start quiz
	// quiz ended -> end quiz

	let countdownWaitingTimerId: NodeJS.Timeout;
	let countdownQuizStartTimerId: NodeJS.Timeout;
	let io: Server;

	let countdownToQuizStart = countdownToStart(isDevelopment);
	let countdownToWaitingRoomOpen =
		countdownToQuizStart - (isDevelopment ? WAITING_ROOM_TIME_DEV : WAITING_ROOM_TIME);

	const startQuizController = (io: Server) => {
		const quizController = new QuizController(io);
		quizController.startQuiz();
	};

	if (countdownToWaitingRoomOpen >= 0) {
		console.log(`${countdownToWaitingRoomOpen / 60 / 1000} minutes till waiting room opens.`);
	} else {
		console.log('Waiting room is open.');
	}

	// count till the room opens
	countdownWaitingTimerId = setInterval(() => {
		console.log('Initialising socket server.');
		io = socketServer(server);

		console.log('Created waiting room.');
		io.to(EVENT_WAITING_ROOM).emit(EVENT_WAITING_ROOM_COUNTDOWN, countdownToQuizStart);

		clearInterval(countdownWaitingTimerId);
		console.log(`${countdownToQuizStart / 60 / 1000} minutes till quiz starts.`);
	}, countdownToWaitingRoomOpen);

	countdownQuizStartTimerId = setInterval(() => {
		console.log('start quiz');
		clearInterval(countdownQuizStartTimerId);
		startQuizController(io);
	}, countdownToQuizStart);
};

export const countdownToStart = (isDev = false) => {
	if (isDev) {
		return DEVELOPMENT_COUNTDOWN;
	}

	if (globalQuizState.getQuizStartTime()) {
		return globalQuizState.getQuizStartTime().diff(DateTime.now().setZone('utc')).milliseconds;
	}

	throw 'No datetime found!';
};
