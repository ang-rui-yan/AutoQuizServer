import { DateTime } from 'luxon';
import { QuestionServerData } from '../../../client/Trivia-Terrior/types/quizTypes';

export default class GlobalState {
	private static instance: GlobalState;
	private currentQuestion: QuestionServerData | null = null;
	private currentQuestionStartTime: DateTime = DateTime.now();
	private currentQuestionDuration: number = 0;
	private DEFAULT_TIME_LIMIT = 60;

	constructor() {
		if (GlobalState.instance) {
			return GlobalState.instance;
		}
		GlobalState.instance = this;
	}

	public static getInstance(): GlobalState {
		if (!GlobalState.instance) {
			GlobalState.instance = new GlobalState();
		}
		return GlobalState.instance;
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
