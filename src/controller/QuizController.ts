import { Server } from 'socket.io';
import { QuestionClientData } from '../../../client/Trivia-Terrior/types/quizTypes';
import GlobalTimer from '../utils/GlobalTimer';
import QuizModel from '../models/QuizModel';
import luxon from 'luxon';
import { calculatePoints } from '../manager/pointsManager';
import DataService from '../services/dataService';

const WAITING_DURATION = 5;
const DEFAULT_QUESTION_DURATION = 10;

const EVENT_QUESTION = 'timer:question';
const EVENT_WAITING = 'timer:waiting';

export default class QuizController {
	private io: Server;
	private quizModel: QuizModel;
	private globalTimer: GlobalTimer;
	private currentQuestionIndex: number;

	public constructor(io: Server, quizModel: QuizModel) {
		this.io = io;
		this.quizModel = quizModel;
		this.globalTimer = GlobalTimer.getInstance();
		this.currentQuestionIndex = 0;
	}

	// emit: start quiz
	public startQuiz() {
		// emit the relevant quiz information
		this.io.sockets.emit('startQuiz');

		// starts the first question
		this.startNextQuestion();
	}

	private startNextQuestion() {
		if (this.currentQuestionIndex < this.quizModel.getQuestionCount()) {
			const question = this.quizModel.getQuestionForClient(this.currentQuestionIndex);
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
		this.io.sockets.emit('startQuestion', question);
		const startTime = luxon.DateTime.now();
		const endTime = startTime.plus({ seconds: question.timeLimit });

		console.log('Start Question', question);
		this.globalTimer.startTimer(
			question?.timeLimit || DEFAULT_QUESTION_DURATION,
			EVENT_QUESTION
		);

		// on: question answered + calculate points for those who answered
		this.io.on(
			'selectOption',
			(publicKey: string, quizId: number, questionId: number, chosenOptionId: number) => {
				const submittedTime = luxon.DateTime.now();
				const isAnswerCorrect = this.quizModel.isAnswerCorrect(
					this.currentQuestionIndex,
					quizId,
					questionId,
					chosenOptionId
				);
				const points = calculatePoints(
					startTime,
					endTime,
					submittedTime,
					question.points,
					isAnswerCorrect
				);
				DataService.updatePointsForCurrentQuiz(publicKey, quizId, questionId, points);
			}
		);

		this.globalTimer.on(EVENT_QUESTION + ':stop', () => {
			this.endQuestion();
		});
	}

	// emit: question ended
	private endQuestion() {
		this.io.sockets.emit('stopQuestion');
		console.log('End question');
		// start the waiting timer
		this.startWaitingTimer();

		// display the current leaderboard
		this.displayLeaderBoard();

		// stop the waiting timer
		this.globalTimer.on(EVENT_WAITING + ':stop', () => {
			this.stopWaitingTimer();

			// Start the next question
			this.startNextQuestion();
		});
	}

	// emit: waiting timer started
	private startWaitingTimer() {
		this.io.sockets.emit('startWaitingTime', WAITING_DURATION);
		this.globalTimer.startTimer(WAITING_DURATION, EVENT_WAITING);
		console.log('Start waiting time');
	}

	// emit: display current leaderboard
	private displayLeaderBoard() {
		this.io.sockets.emit('sendLeaderBoard');
		console.log('Show leaderboard');
	}

	// emit: waiting timer ended
	private stopWaitingTimer() {
		this.io.sockets.emit('stopWaitingTime');
		console.log('Stop waiting time');
	}

	// emit: end quiz
	public endQuiz() {
		this.io.sockets.emit('endQuiz');
		console.log('End quiz');
	}
}
