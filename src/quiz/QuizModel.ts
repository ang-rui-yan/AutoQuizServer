import { DateTime } from 'luxon';
import {
	QuizServerData,
	QuizClientData,
	QuestionClientData,
	QuestionServerData,
} from '../../../client/Trivia-Terrior/types/quizTypes';

export default class QuizModel {
	private serverQuiz: QuizServerData;
	private clientQuiz: QuizClientData;

	constructor(serverQuiz: QuizServerData, clientQuiz: QuizClientData) {
		this.serverQuiz = serverQuiz;
		this.clientQuiz = clientQuiz;
	}

	// Getter methods for accessing quiz data
	public getQuestionCount() {
		return this.clientQuiz.question.length;
	}

	public getQuestionForClient(index: number): QuestionClientData {
		const question = this.clientQuiz.question[index];
		if (question) {
			return question;
		}
		throw 'Cannot find question';
	}
    
	public getQuestionForServer(index: number): QuestionServerData {
		const question = this.serverQuiz.question[index];
		if (question) {
			return question;
		}
		throw 'Cannot find question';
	}

	public isAnswerCorrect(
		index: number,
		quizId: number,
		questionId: number,
		chosenOptionId: number
	): boolean {
		this.serverQuiz.question[index]?.option.forEach((option) => {
			if (
				option.correct &&
				option.quizId == quizId &&
				option.questionId == questionId &&
				option.optionId == chosenOptionId
			) {
				return true;
			}
		});
		return false;
	}
}
