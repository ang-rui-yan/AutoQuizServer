import { DateTime } from 'luxon';
import { QuestionServerData } from '../../../client/Trivia-Terrior/types/quizTypes';

export default class GlobalQuizState {
	private static instance: GlobalQuizState;
	private hasGameStarted: boolean = false;
	private currentQuestion: QuestionServerData | null = null;
	private currentQuestionStartTime: DateTime = DateTime.now();
	private currentQuestionDuration: number = 0;
	private DEFAULT_TIME_LIMIT = 60;

	constructor() {
		if (GlobalQuizState.instance) {
			return GlobalQuizState.instance;
		}
		GlobalQuizState.instance = this;
	}

	public getGameStatus() {
		return this.hasGameStarted;
	}

	public setGameStatus(gameStatus: boolean) {
		this.hasGameStarted = gameStatus;
	}

	public static getInstance(): GlobalQuizState {
		if (!GlobalQuizState.instance) {
			GlobalQuizState.instance = new GlobalQuizState();
		}
		return GlobalQuizState.instance;
	}

	setCurrentQuestion(question: QuestionServerData | null) {
		this.currentQuestion = question;
		this.currentQuestionStartTime = DateTime.now();
		if (this.currentQuestion) {
			this.currentQuestionDuration = this.currentQuestion.timeLimit;
		} else {
			this.currentQuestionDuration = this.DEFAULT_TIME_LIMIT;
		}
	}

	getCurrentQuestion() {
		return this.currentQuestion;
	}

	getCurrentQuestionStartTime() {
		return this.currentQuestionStartTime;
	}

	getCurrentQuestionDuration() {
		return this.currentQuestionDuration;
	}
}
