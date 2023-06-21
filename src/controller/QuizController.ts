import { Server } from 'socket.io';
import {
	OptionServerData,
	QuestionClientData,
} from '../../../client/Trivia-Terrior/types/quizTypes';
import GlobalTimer from '../utils/GlobalTimer';
import QuizModel from '../models/QuizModel';
import GlobalQuizState from '../utils/GlobalQuizState';

import {
	EVENT_QUESTION_TIMER,
	EVENT_WAITING_TIMER,
	EVENT_START_QUESTION,
	EVENT_WAITING_ROOM,
	EVENT_STOP_QUESTION,
	EVENT_SEND_CORRECT_ANSWER,
	EVENT_SHOW_LEADERBOARD,
	EVENT_END_QUIZ,
	EVENT_START_QUIZ,
} from '../constants/socketEventConstants';
import { currentQuizData } from '../manager/pointsManager';
import DataService from '../services/dataService';

const WAITING_DURATION = 5;
const DEFAULT_QUESTION_DURATION = 10;

export default class QuizController {
	private io: Server;
	private quizModel: QuizModel;
	private globalTimer: GlobalTimer;
	private globalQuizState: GlobalQuizState;
	private currentQuestionIndex: number;
	private hasEnded: boolean = false;

	public constructor(io: Server, quizModel: QuizModel) {
		this.io = io;
		this.quizModel = quizModel;
		this.globalTimer = GlobalTimer.getInstance();
		this.globalQuizState = GlobalQuizState.getInstance();
		this.currentQuestionIndex = 0;
	}

	private leaveWaitingRoomStatus() {
		this.globalQuizState.setGameStatus(true);
		this.io.sockets.to(EVENT_WAITING_ROOM).socketsLeave(EVENT_WAITING_ROOM);
		console.log('Exiting waiting room status');
	}

	// emit: start quiz
	public startQuiz() {
		this.leaveWaitingRoomStatus();

		// emit the relevant quiz information
		this.io.sockets.emit(EVENT_START_QUIZ, this.quizModel.getQuizForClient());

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
		this.io.sockets.emit(
			EVENT_SHOW_LEADERBOARD,
			currentQuizData.sort((userA, userB) => userB.points - userA.points)
		);
		console.log('Show leaderboard');
	}

	// emit: end quiz
	public endQuiz() {
		// TODO: need to emit the final leaderboard
		this.io.sockets.emit(
			EVENT_SHOW_LEADERBOARD,
			currentQuizData.sort((userA, userB) => userB.points - userA.points)
		);
		this.io.sockets.emit(EVENT_END_QUIZ);

		const quizId = this.quizModel.getQuizId();
		DataService.endQuiz(quizId);
		DataService.updateRankings(quizId, currentQuizData);
		console.log('End quiz');
	}
}
