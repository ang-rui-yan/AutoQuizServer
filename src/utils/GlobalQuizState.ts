import { DateTime } from 'luxon';
import { QuestionServerData } from '../../../client/Trivia-Terrior/types/quizTypes';

export default class GlobalState {
	private static instance: GlobalState;
	private currentQuestion: QuestionServerData | null = null;
	private currentQuestionStartTime: DateTime = DateTime.now();
	private currentQuestionDuration: number = 0;

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
	}

	getCurrentQuestion() {
		return this.currentQuestion;
	}

	setCurrentQuestionStartTime(startTime: DateTime) {
		this.currentQuestionStartTime = startTime;
	}

	getCurrentQuestionStartTime() {
		return this.currentQuestionStartTime;
	}

	setCurrentQuestionDuration(duration: number) {
		this.currentQuestionDuration = duration;
	}

	getCurrentQuestionDuration() {
		return this.currentQuestionDuration;
	}
}
