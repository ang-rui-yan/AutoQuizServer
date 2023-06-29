import { DateTime } from 'luxon';
import {
	QuestionClientData,
	QuestionServerData,
	QuizClientData,
	QuizEntry,
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
	private quizInformation: QuizInformation | null = null;
	private questionForServer: QuestionServerData[] | null = null;
	private questionForClient: QuestionClientData[] | null = null;

	// need to update this constantly
	private quizEntries: QuizEntry[] | null = null;

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
		return this.quizInformation != null;
	}

	getHasGameStarted() {
		return this.hasGameStarted;
	}

	setGameStatus(gameStatus: boolean) {
		this.hasGameStarted = gameStatus;
	}

	// TODO: if there are no data, it should return null..?
	getQuizStartTime() {
		if (!this.quizInformation) return DateTime.now().setZone('utc');
		return DateTime.fromJSDate(this.quizInformation.startDateTime).setZone('utc');
	}

	getQuestionCount() {
		if (!this.questionForClient) return 0;
		return this.questionForClient.length;
	}

	getCurrentQuestionForClient() {
		if (this.questionIndex < 0 || !this.questionForClient) return null;
		return this.questionForClient[this.questionIndex];
	}

	getQuizInformation(): QuizInformation | null {
		return this.quizInformation;
	}

	setCurrentQuestion(questionIndex: number) {
		// Question id is not equals or more than 0
		if (questionIndex < 0) {
			throw 'error: no question id';
		}

		// Checks if there is a quiz stored in state
		if (!this.questionForClient) {
			throw 'error: no quiz in state';
		}

		// Check if the question id exists in it
		if (questionIndex >= this.questionForClient.length) {
			throw 'error: no such question';
		}

		this.questionIndex = questionIndex;
		this.questionStartTime = DateTime.now();
		this.questionDuration = this.questionForClient[questionIndex].timeLimit;
	}

	getQuizEntry() {
		return this.quizEntries;
	}

	async updateQuizEntry() {
		if (!this.quizInformation) return false;
		this.quizEntries = await DataService.getQuizEntryFor(this.quizInformation.quizId);
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
		if (!this.questionForClient) {
			throw 'error: cannot find quiz';
		}

		const question = this.questionForClient[index];
		if (question) {
			return question;
		}
		throw 'Cannot find question';
	}

	getQuestionForServer(index: number): QuestionServerData {
		if (!this.questionForServer) {
			throw 'error: cannot find quiz';
		}

		const question = this.questionForServer[index];
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
		if (this.quizInformation) return this.quizInformation.quizId;
		return -1;
	}

	async setQuiz(quizId: number) {
		this.quizInformation = await DataService.getCurrentQuizInformation(quizId);
		this.questionForServer = await DataService.getCurrentQuestionListForServer(quizId);
		this.questionForClient = await DataService.getCurrentQuestionListForClient(quizId);
	}

	resetQuiz() {
		this.quizInformation = null;
		this.questionForClient = null;
		this.questionForServer = null;
		this.quizEntries = null;

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
