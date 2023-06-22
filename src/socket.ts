import { Server, Socket } from 'socket.io';
import http from 'http';
import { calculateAndUpdatePoints } from './manager/pointsManager';
import GlobalQuizState from './utils/GlobalQuizState';

import {
	EVENT_WAITING_ROOM,
	EVENT_USER_SELECTED_OPTION,
	EVENT_WAITING_ROOM_COUNT,
	EVENT_USER_CONNECT,
	EVENT_USER_DISCONNECT,
} from './constants/socketEventConstants';
import { convertToString } from './utils/handleQuery';
import {
	addUserIntoWaitingRoom,
	removeUserFromWaitingRoom,
	waitingRoom,
} from './waitingRoom/waitingRoomManager';

export default (
	httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
	console.log('Booting up socket server.');
	const io = new Server(httpServer, {
		cors: {
			origin: '*',
		},
	});

	const globalState = new GlobalQuizState();

	io.on(EVENT_USER_CONNECT, async (socket: Socket) => {
		// TODO: Add error handler for null values on handshake
		const publicKey = convertToString(socket.handshake.query.publicKey);
		const userName = convertToString(socket.handshake.query.userName);

		// TODO: Add authentication for only registered users to participate in the quiz
		console.log(`User ${userName}(${publicKey}) has connected!`);
		console.log(`Game has${globalState.getGameStatus() ? ' ' : ' not '}started`);

		const currentQuizId = globalState.getCurrentQuizId();
		// game has not started
		if (!globalState.getGameStatus() && currentQuizId) {
			console.log('Created waiting room.');
			console.log('Enter waiting room status');
			const hasAddedUser = await addUserIntoWaitingRoom(publicKey, userName, currentQuizId);

			// check if registered & handle duplicates
			if (hasAddedUser) {
				socket.join(EVENT_WAITING_ROOM);
				io.to(EVENT_WAITING_ROOM).emit(EVENT_WAITING_ROOM_COUNT, waitingRoom);
			}
		}

		socket.on(
			EVENT_USER_SELECTED_OPTION,
			async (
				publicKey: string,
				quizId: number,
				questionId: number,
				chosenOptionId: number
			) => {
				console.log(`${publicKey} has selected ${chosenOptionId}`);
				const currentQuestion = globalState.getCurrentQuestion();
				if (currentQuestion) {
					await calculateAndUpdatePoints(
						publicKey,
						userName,
						quizId,
						questionId,
						chosenOptionId,
						globalState.getCurrentQuestionStartTime(),
						globalState.getCurrentQuestionDuration(),
						currentQuestion.points
					);
				}
			}
		);

		socket.on(EVENT_USER_DISCONNECT, () => {
			const publicKey = convertToString(socket.handshake.query.publicKey);
			const hasRemoved = removeUserFromWaitingRoom(publicKey);
			if (hasRemoved) {
				io.to(EVENT_WAITING_ROOM).emit(EVENT_WAITING_ROOM_COUNT, waitingRoom);
				console.log(`User ${userName}(${publicKey}) disconnected.`);
			}
		});
	});

	return io;
};
