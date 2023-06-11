// makes update to the database

import { QuizServerData } from '../../../client/Trivia-Terrior/types/quizTypes';
import prisma from '../../prisma/client';

export default class DataService {
	public static async getUpcomingQuizId(): Promise<number | null> {
		const quiz = await prisma.quiz.findFirst({
			where: {
				ended: false,
				startDateTime: {
					gte: new Date(),
				},
			},
			select: {
				quizId: true,
			},
		});
		return quiz ? quiz.quizId : null;
	}

	public static async getCurrentQuizForServer(quizId: number) {
		const quiz = await prisma.quiz.findFirst({
			where: {
				quizId: quizId,
			},
			orderBy: {
				startDateTime: 'asc',
			},
			include: {
				question: {
					include: {
						option: true,
					},
				},
				quizEntry: true,
			},
		});

		if (!quiz) {
			throw '';
		}
		return quiz;
	}

	public static async getCurrentQuizForClient(quizId: number) {
		const quiz = await prisma.quiz.findFirst({
			where: {
				quizId: quizId,
			},
			orderBy: {
				startDateTime: 'asc',
			},
			include: {
				question: {
					include: {
						option: {
							select: {
								optionId: true,
								questionId: true,
								quizId: true,
								text: true,
								correct: false,
							},
						},
					},
				},
			},
		});
		if (!quiz) {
			throw '';
		}
		return quiz;
	}

	public static async isAnswerCorrect(
		quizId: number,
		questionId: number,
		chosenOptionId: number
	) {
		const option = await prisma.option.findFirst({
			where: {
				quizId: quizId,
				questionId: questionId,
				optionId: chosenOptionId,
			},
		});
		if (!option) {
			throw '';
		}
		return option.correct;
	}

	// TODO
	public static async updatePointsForCurrentQuiz(
		publicKey: string,
		quizId: number,
		questionId: number,
		points: number
	) {
		console.log(`${publicKey} earned ${points} for Quiz ${quizId}, Question ${questionId}`);
	}

	public static async updateDatabase() {
		console.log('updated database');
		return;
	}
}
