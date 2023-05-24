import { Server, Socket } from 'socket.io';
import GlobalTimer from '../utils/GlobalTimer';

const globalTimer = GlobalTimer.getInstance();
const DURATION = 4;
const WAIT_DURATION = 2;
const NUMBER_OF_QUESTIONS_IN_TEST = 3;

const pointsCalculator = () => {
	return 0;
};

export const questionController = (io: Server) => {
	// we need to have a timer that is async

	io.on('connection', (socket: Socket) => {
		let currentQuestion = 1;

		const startQuestion = () => {
			// Show the question
			socket.emit('showQuestion', currentQuestion);

			// Start the timer for the question
			globalTimer.startTimer(DURATION, 'questionTimer');

			socket.on('selectOption', (data: any) => {
				console.log('Received data:', data);

				const points = pointsCalculator();
			});
		};

		// Listen for timer updates
		globalTimer.on('questionTimer:update', (elapsedTime) => {
			socket.emit('questionTimer:update', elapsedTime);
			console.log(elapsedTime);
		});

		// When the time is up
		globalTimer.on('questionTimer:stop', () => {
			// Send the data of user points + top 5 players (and their points + ranking)
			socket.emit('showQuestionResult', {
				data: 10,
				top: [
					{ ranking: 1, publicKey: 'pubkey1', points: 50 },
					{ ranking: 2, publicKey: 'pubkey2', points: 45 },
					{ ranking: 3, publicKey: 'pubkey3', points: 43 },
					{ ranking: 4, publicKey: 'pubkey4', points: 42 },
					{ ranking: 5, publicKey: 'pubkey5', points: 40 },
				],
			});

			if (currentQuestion < NUMBER_OF_QUESTIONS_IN_TEST) {
				// Start the timer for waiting for the next question
				globalTimer.startTimer(WAIT_DURATION, 'waitingTimer');
				currentQuestion += 1;
			} else {
				// All questions have been answered
				console.log('Quiz ended');

				// show overall leaderboard
			}
		});

		globalTimer.on('waitingTimer:update', (elapsedTime) => {
			socket.emit('waitingTimer:update', elapsedTime);
			console.log(elapsedTime);
		});

		globalTimer.on('waitingTimer:stop', () => {
			// Repeat for the next question
			startQuestion();
		});

		// Start the first question
		startQuestion();
	});
};
