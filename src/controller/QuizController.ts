import { Server } from 'socket.io';
import { QuestionClientData } from '../../../client/Trivia-Terrior/types/quizTypes';
import GlobalTimer from '../utils/GlobalTimer';
import QuizModel from '../models/QuizModel';
import { DateTime } from 'luxon';
import GlobalState from '../utils/GlobalQuizState';

const WAITING_DURATION = 5;
const DEFAULT_QUESTION_DURATION = 10;

const EVENT_QUESTION_TIMER = 'timer:question';
const EVENT_WAITING_TIMER = 'timer:waiting';
const EVENT_START_QUESTION = 'startQuestion';
const EVENT_STOP_QUESTION = 'stopQuestion';
const EVENT_SHOW_LEADERBOARD = 'showLeaderboard';
const EVENT_END_QUIZ = 'endQuiz';

export default class QuizController {
	private io: Server;
	private quizModel: QuizModel;
	private globalTimer: GlobalTimer;
	private globalQuizState: GlobalState;
	private currentQuestionIndex: number;

	public constructor(io: Server, quizModel: QuizModel) {
		this.io = io;
		this.quizModel = quizModel;
		this.globalTimer = GlobalTimer.getInstance();
		this.globalQuizState = GlobalState.getInstance();
		this.currentQuestionIndex = 0;
	}

	// emit: start quiz
	public startQuiz() {
		// emit the relevant quiz information
		this.io.sockets.emit('startQuiz', this.quizModel.getQuizForClient());

		// starts the first question
		this.startNextQuestion();
	}

	private startNextQuestion() {
		if (this.currentQuestionIndex < this.quizModel.getQuestionCount()) {
			const question = this.quizModel.getQuestionForClient(this.currentQuestionIndex);
			const questionForServer = this.quizModel.getQuestionForServer(
				this.currentQuestionIndex
			);
			this.globalQuizState.setCurrentQuestion(questionForServer);
			this.startQuestion(question);
			this.currentQuestionIndex++;
		} else {
			// No more questions, end the quiz
			this.endQuiz();
		}
	}

	// emit: question started
	private startQuestion(question: QuestionClientData) {
		// pass to the client, only the question and options without the correct/wrong
		this.io.sockets.emit(EVENT_START_QUESTION, question);

		console.log('Start Question', question);
		this.io.sockets.emit(EVENT_QUESTION_TIMER, question.timeLimit || DEFAULT_QUESTION_DURATION);
		this.globalTimer.startTimer(
			EVENT_QUESTION_TIMER,
			question.timeLimit || DEFAULT_QUESTION_DURATION
		);

		this.globalTimer.on(EVENT_QUESTION_TIMER + ':stop', () => {
			this.endQuestion();
		});
	}

	// emit: question ended
	private endQuestion() {
		this.globalQuizState.setCurrentQuestion(null);
		this.io.sockets.emit(EVENT_QUESTION_TIMER + ':stop');
		this.io.sockets.emit(EVENT_STOP_QUESTION);

		console.log('End question');
		// start the waiting timer
		this.startWaitingTimer();

		// display the current leaderboard
		this.displayLeaderBoard();

		// stop the waiting timer
		this.globalTimer.on(EVENT_WAITING_TIMER + ':stop', () => {
			this.stopWaitingTimer();

			// Start the next question
			this.startNextQuestion();
		});
	}

	// emit: waiting timer started
	private startWaitingTimer() {
		this.io.sockets.emit(EVENT_WAITING_TIMER, WAITING_DURATION);
		this.globalTimer.startTimer(EVENT_WAITING_TIMER, WAITING_DURATION);
		console.log('Start waiting time');
	}

	// emit: waiting timer ended
	private stopWaitingTimer() {
		this.io.sockets.emit(`${EVENT_WAITING_TIMER}:stop`);
		console.log('Stop waiting time');
	}

	// emit: display current leaderboard
	private displayLeaderBoard() {
		this.io.sockets.emit(EVENT_SHOW_LEADERBOARD);
		console.log('Show leaderboard');
	}

	// emit: end quiz
	public endQuiz() {
		this.io.sockets.emit(EVENT_END_QUIZ);
		console.log('End quiz');
	}
}
