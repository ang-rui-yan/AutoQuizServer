import { Socket } from 'socket.io';
import { QuestionData } from '../../../client/Trivia-Terrior/types/quizTypes';
import GlobalTimer from '../utils/GlobalTimer';
import { EventEmitter } from 'stream';

const DURATION = 4;
const WAIT_DURATION = 2;
const EVENT_ON_QUESTION = 'questionTimer';
const EVENT_WAIT_QUESTION = 'waitQuestionTimer';

export default class QuestionController extends EventEmitter {
	private socket: Socket;
	private question: QuestionData;
	public globalTimer: GlobalTimer;

	public constructor(socket: Socket, question: QuestionData) {
		super();
		this.socket = socket;
		this.question = question;
		this.globalTimer = GlobalTimer.getInstance();
	}

	private cleanupEventHandlers() {
		this.socket.removeAllListeners();
		this.globalTimer.removeAllListeners();
	}

	public startQuestion() {
		// current question will be data of the question

		console.log('Question', this.question);
		// Show the question
		this.socket.emit('showQuestion', this.question);

		// Start the timer for the question
		this.globalTimer.startTimer(DURATION, EVENT_ON_QUESTION);

		this.socket.on('selectOption', (data: any) => {
			console.log('Received data:', data);

			const points = this.calculatePoints();
			this.emit('questionAnswered');
		});

		// Listen for timer updates
		this.globalTimer.on(EVENT_ON_QUESTION + ':update', (elapsedTime) => {
			this.socket.off(EVENT_ON_QUESTION + ':stop', () => {});
			this.socket.emit(EVENT_ON_QUESTION + ':update', elapsedTime);
			console.log(elapsedTime);
		});

		// When the time is up
		this.globalTimer.on(EVENT_ON_QUESTION + ':stop', () => {
			this.socket.off(EVENT_ON_QUESTION + ':update', () => {});

			// Send the data of user points + top 5 players (and their points + ranking)
			this.socket.emit('showQuestionResult', {
				data: 10,
				top: [
					{ ranking: 1, publicKey: 'pubkey1', points: 50 },
					{ ranking: 2, publicKey: 'pubkey2', points: 45 },
					{ ranking: 3, publicKey: 'pubkey3', points: 43 },
					{ ranking: 4, publicKey: 'pubkey4', points: 42 },
					{ ranking: 5, publicKey: 'pubkey5', points: 40 },
				],
			});

			// Start the timer for waiting for the next question
			this.globalTimer.startTimer(WAIT_DURATION, EVENT_WAIT_QUESTION);
		});

		this.globalTimer.on(EVENT_WAIT_QUESTION + ':update', (elapsedTime) => {
			this.socket.off(EVENT_WAIT_QUESTION + ':stop', () => {});
			this.socket.emit(EVENT_WAIT_QUESTION + ':update', elapsedTime);
			console.log(elapsedTime);
		});

		this.globalTimer.on(EVENT_WAIT_QUESTION + ':stop', () => {
			// this.socket.off(EVENT_WAIT_QUESTION + ':update', () => {});
			this.cleanupEventHandlers();
			console.log('question ended on question controller');
			this.emit('questionEnded');
		});
	}

	public calculatePoints() {
		return 0;
	}

	public setNewQuestion(question: QuestionData) {
		this.question = question;
	}
}
