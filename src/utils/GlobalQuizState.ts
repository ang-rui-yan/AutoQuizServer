import { DateTime } from 'luxon';
import {
	QuestionClientData,
	QuestionServerData,
	QuizClientData,
	QuizInformation,
	QuizServerData,
} from '../../../client/Trivia-Terrior/types/quizTypes';
import DataService from '../services/dataService';

/**
 * Defines the state and stores data of the quiz. It follows the Singleton design pattern.
 */
export default class GlobalQuizState {
	// Singleton pattern
	private static instance: GlobalQuizState;
	
	// Checks if the quiz has started
	private hasGameStarted: boolean = false;

	// Stores the current quiz details
	private quizDataForServer: QuizServerData | null = null;
	private quizDataForClient: QuizClientData | null = null;

	// Stores the current question for the server side
	private questionIndex: number = -1;

	private questionStartTime: DateTime = DateTime.now();
	private questionDuration: number = 0;

	constructor() {
		if (GlobalQuizState.instance) {
			return GlobalQuizState.instance;
		}
		GlobalQuizState.instance = this;
	}

	public static getInstance(): GlobalQuizState {
		if (!GlobalQuizState.instance) {
			GlobalQuizState.instance = new GlobalQuizState();
		}
		return GlobalQuizState.instance;
	}

	getHasUpcomingQuiz() {
		return this.quizDataForClient != null;
	}

	getHasGameStarted() {
		return this.hasGameStarted;
	}

	setGameStatus(gameStatus: boolean) {
		this.hasGameStarted = gameStatus;
	}

	// TODO: if there are no data, it should return null..?
	getQuizStartTime() {
		if (!this.quizDataForClient) return DateTime.now().setZone('utc');
		return DateTime.fromJSDate(this.quizDataForClient.startDateTime).setZone('utc');
	}

	getQuestionCount() {
		if (!this.quizDataForClient) return 0;
		return this.quizDataForClient.question.length;
	}

	getCurrentQuestionForClient() {
		if (this.questionIndex < 0) return null;
		return this.quizDataForClient?.question[this.questionIndex];
	}

	getQuizInformation(): QuizInformation | null {
		if (!this.quizDataForClient) return null;
		return {
			quizId: this.quizDataForClient.quizId,
			name: this.quizDataForClient.name,
			description: this.quizDataForClient.description,
			ended: this.quizDataForClient.ended,
			week: this.quizDataForClient.week,
			startDateTime: this.quizDataForClient.startDateTime,
		};
	}

	setCurrentQuestion(questionIndex: number) {
		// Question id is not equals or more than 0
		if (questionIndex < 0) {
			throw 'error: no question id';
		}

		// Checks if there is a quiz stored in state
		if (!this.quizDataForClient) {
			throw 'error: no quiz in state';
		}

		// Check if the question id exists in it
		if (questionIndex >= this.quizDataForClient.question.length) {
			throw 'error: no such question';
		}

		this.questionIndex = questionIndex;
		this.questionStartTime = DateTime.now();
		this.questionDuration = this.quizDataForClient.question[questionIndex].timeLimit;
	}

	// TODO: add exceptions
	getCurrentQuestionStartTime() {
		return this.questionStartTime;
	}

	// TODO: add exceptions
	getCurrentQuestionDuration() {
		return this.questionDuration;
	}

	getQuestionForClient(index: number): QuestionClientData {
		if (!this.quizDataForClient) {
			throw 'error: cannot find quiz';
		}

		const question = this.quizDataForClient.question[index];
		if (question) {
			return question;
		}
		throw 'Cannot find question';
	}

	getQuestionForServer(index: number): QuestionServerData {
		if (!this.quizDataForServer) {
			throw 'error: cannot find quiz';
		}

		const question = this.quizDataForServer.question[index];
		if (question) {
			return question;
		}
		throw 'Cannot find question';
	}

	/**
	 * Gets the current quiz id
	 * @returns number - is for telling the quiz id. if none, it is -1
	 */
	getQuizId() {
		if (this.quizDataForClient) return this.quizDataForClient.quizId;
		return -1;
	}

	async setQuiz(quizId: number) {
		this.quizDataForServer = await DataService.getCurrentQuizForServer(quizId);
		this.quizDataForClient = await DataService.getCurrentQuizForClient(quizId);
	}

	resetQuiz() {
		this.quizDataForServer = null;
		this.quizDataForClient = null;
		this.questionIndex = -1;
		this.questionStartTime = DateTime.now();
		this.questionDuration = 0;
	}

	// Reset the quiz states after the quiz has ended
	resetQuizState() {
		this.hasGameStarted = false;

		this.resetQuiz();
	}
}
