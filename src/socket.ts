import { Server, Socket } from 'socket.io';
import http from 'http';
import DataService from './services/dataService';
import { calculatePoints } from './manager/pointsManager';
import GlobalState from './utils/GlobalQuizState';

const EVENT_USER_SELECTED_OPTION = 'selectOption';
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
	const waitingRoom: Socket[] = [];
	console.log('Created waiting room.');

	const globalState = new GlobalState();

	io.on('connection', (socket: Socket) => {
		// TODO: Add error handler for null values on handshake
		const publicKey = socket.handshake.query.publicKey;
		const userName = socket.handshake.query.userName;

		// Add the socket to the waiting room
		waitingRoom.push(socket);

		// Emit the current number of participants to the socket
		socket.emit('waiting-room-count', waitingRoom.length);

		// TODO: Add authentication for only registered users to participate in the quiz
		console.log(
			`User ${userName}(${publicKey}) has connected!`,
			'Waiting room count:',
			waitingRoom.length
		);

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
					await calculatePoints(
						quizId,
						questionId,
						chosenOptionId,
						globalState.getCurrentQuestionStartTime(),
						globalState.getCurrentQuestionDuration(),
						currentQuestion.points
					).then((points) => {
						DataService.updatePointsForCurrentQuiz(
							publicKey,
							quizId,
							questionId,
							points
						);
					});
				}
			}
		);

		// TODO: When user disconnects, I need to add somewhere to delete their data?
		socket.on('disconnect', () => {
			const index = waitingRoom.indexOf(socket);
			if (index !== -1) {
				waitingRoom.splice(index, 1);
			}
			console.log(
				`User ${userName}(${publicKey}) disconnected.`,
				'Waiting room count:',
				waitingRoom.length
			);
		});
	});

	return io;
};
