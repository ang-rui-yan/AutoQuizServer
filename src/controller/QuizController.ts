import { Server } from 'socket.io';
import {
	OptionServerData,
	QuestionClientData,
} from '../../../client/Trivia-Terrior/types/quizTypes';
import GlobalTimer from '../utils/GlobalTimer';
import QuizModel from '../models/QuizModel';
import GlobalState from '../utils/GlobalQuizState';

const WAITING_DURATION = 5;
const DEFAULT_QUESTION_DURATION = 10;

const EVENT_QUESTION_TIMER = 'timer:question';
const EVENT_WAITING_TIMER = 'timer:waiting';
const EVENT_START_QUESTION = 'startQuestion';
const EVENT_STOP_QUESTION = 'stopQuestion';
const EVENT_SHOW_LEADERBOARD = 'showLeaderboard';
const EVENT_END_QUIZ = 'endQuiz';
const EVENT_SEND_CORRECT_ANSWER = 'sendCorrectOption';

export default class QuizController {
	private io: Server;
	private quizModel: QuizModel;
	private globalTimer: GlobalTimer;
	private globalQuizState: GlobalState;
	private currentQuestionIndex: number;
	private hasEnded: boolean = false;

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
		this.startQuestion(this.getQuestion());
	}

	public getQuestion() {
		const questionForServer = this.quizModel.getQuestionForServer(this.currentQuestionIndex);
		this.globalQuizState.setCurrentQuestion(questionForServer);

		return this.quizModel.getQuestionForClient(this.currentQuestionIndex);
	}

	private updateQuestionIndex() {
		const questionCount = this.quizModel.getQuestionCount();
		this.currentQuestionIndex++;
		// check if the next question is the last
		if (this.currentQuestionIndex + 1 >= questionCount) {
			this.hasEnded = true;
			console.log('Next is the last');
		}
	}

	private startNextQuestion() {
		this.updateQuestionIndex();
		const question = this.getQuestion();
		this.startQuestion(question);
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

		// show the correct answer
		this.displayCorrectAnswer();

		// start the waiting timer
		this.startWaitingTimer();

		// display the current leaderboard
		this.displayLeaderBoard();

		// stop the waiting timer
		this.globalTimer.on(EVENT_WAITING_TIMER + ':stop', () => {
			this.stopWaitingTimer();

			if (this.hasEnded) {
				this.endQuiz();
				return;
			}

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

	private displayCorrectAnswer() {
		console.log('Send correct answer');
		const options = this.quizModel.getQuestionForServer(this.currentQuestionIndex).option;
		const correctOption: OptionServerData | null =
			options.find((option) => option.correct) || null;
		this.io.sockets.emit(EVENT_SEND_CORRECT_ANSWER, correctOption);
	}

	// emit: display current leaderboard
	private displayLeaderBoard() {
		this.io.sockets.emit(EVENT_SHOW_LEADERBOARD);
		console.log('Show leaderboard');
	}

	// emit: end quiz
	public endQuiz() {
		// TODO: need to emit the final leaderboard
		this.io.sockets.emit(EVENT_END_QUIZ);
		console.log('End quiz');
	}
}
