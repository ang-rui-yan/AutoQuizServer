import { Server, Socket } from 'socket.io';
import http from 'http';
import { calculateAndUpdatePoints } from './manager/pointsManager';
import GlobalQuizState from './utils/GlobalQuizState';
import { WaitingRoom } from '../../client/Trivia-Terrior/types/socketTypes';

import {
	EVENT_WAITING_ROOM,
	EVENT_USER_SELECTED_OPTION,
	EVENT_WAITING_ROOM_COUNT,
	EVENT_USER_CONNECT,
	EVENT_USER_DISCONNECT,
} from './constants/socketEventConstants';
import { DateTime } from 'luxon';

const convertToString = (query: any) => {
	// Type guard to check if query is a string
	if (typeof query === 'string') {
		return query;
	} else {
		// Handle the case where query is an array or undefined
		// For example, you can join the array elements into a string
		return Array.isArray(query) ? query.join(',') : '';
	}
};

export default (
	httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
	console.log('Booting up socket server.');
	const io = new Server(httpServer, {
		cors: {
			origin: '*',
		},
	});

	// Store waiting room participants
	const waitingRoom: WaitingRoom[] = [];

	const globalState = new GlobalQuizState();

	io.on(EVENT_USER_CONNECT, (socket: Socket) => {
		// TODO: Add error handler for null values on handshake
		const publicKey = convertToString(socket.handshake.query.publicKey);
		const userName = convertToString(socket.handshake.query.userName);

		// TODO: Add authentication for only registered users to participate in the quiz
		console.log(`User ${userName}(${publicKey}) has connected!`);

		console.log(`Game has ${globalState.getGameStatus() ? '' : 'not'} started`);
		// game has not started
		if (!globalState.getGameStatus()) {
			console.log('Created waiting room.');
			console.log('Enter waiting room status');
			socket.join(EVENT_WAITING_ROOM);

			// Add the socket to the waiting room
			waitingRoom.push({
				publicKey,
				userName,
				time: DateTime.now(),
			});

			// Emit the current number of participants to the socket
			io.to(EVENT_WAITING_ROOM).emit(EVENT_WAITING_ROOM_COUNT, waitingRoom);
			console.log('Waiting room count:', waitingRoom.length);
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

		// TODO: When user disconnects, I need to add somewhere to delete their data?
		socket.on(EVENT_USER_DISCONNECT, () => {
			const index = waitingRoom.findIndex(
				(item) => item.publicKey === socket.handshake.query.publicKey
			);

			if (index !== -1) {
				// Socket found
				waitingRoom.splice(index, 1);
				io.to(EVENT_WAITING_ROOM).emit(EVENT_WAITING_ROOM_COUNT, waitingRoom);
				console.log('Waiting room count:', waitingRoom.length);
				console.log(`User ${userName}(${publicKey}) disconnected.`);
			}
		});
	});

	return io;
};
