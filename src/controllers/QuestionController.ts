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

	// TODO: Decouple this
	public startQuestion() {
		// current question will be data of the question

		console.log('Question', this.question);
		// Show the question
		this.socket.emit('showQuestion', this.question);
		const timeLimit = this.question!.timeLimit || DURATION;

		// Start the timer for the question
		this.globalTimer.startTimer(timeLimit, EVENT_ON_QUESTION);

		this.socket.on('selectOption', (data: any) => {
			console.log('Received data:', data);

			const points = this.calculatePoints();
			this.emit('questionAnswered');
		});

		// Listen for timer updates
		this.globalTimer.on(EVENT_ON_QUESTION + ':update', (elapsedTime) => {
			this.socket.emit(EVENT_ON_QUESTION + ':update', elapsedTime);
			console.log(elapsedTime);
		});

		// TODO: add proper handling of starting waiting time and showing result
		// When the time is up
		this.globalTimer.on(EVENT_ON_QUESTION + ':stop', () => {
			// Send the data of user points + top 5 players (and their points + ranking)
			this.socket.emit('showQuestionResult', {});

			// Start the timer for waiting for the next question
			this.globalTimer.startTimer(WAIT_DURATION, EVENT_WAIT_QUESTION);
		});

		this.globalTimer.on(EVENT_WAIT_QUESTION + ':update', (elapsedTime) => {
			this.socket.emit(EVENT_WAIT_QUESTION + ':update', elapsedTime);
			console.log(elapsedTime);
		});

		this.globalTimer.on(EVENT_WAIT_QUESTION + ':stop', () => {
			this.cleanupEventHandlers();
			console.log('question ended on question controller');
			this.emit('questionEnded');
		});
	}

	// TODO: Add proper scoring
	// Might consider to separate this logic
	public calculatePoints() {
		return 0;
	}

	public setNewQuestion(question: QuestionData) {
		this.question = question;
	}
}
