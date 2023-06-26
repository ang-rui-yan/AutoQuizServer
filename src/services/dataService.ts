// makes update to the database
import { DateTime } from 'luxon';
import {
	CurrentQuizData,
	QuizClientData,
	QuizServerData,
} from '../../../client/Trivia-Terrior/types/quizTypes';
import prisma from '../../../client/Trivia-Terrior/prisma/client';

export default class DataService {
	public static async getUpcomingQuizInXMinutes(minutes: number): Promise<number> {
		// Get the most upcoming quiz
		const currentDateTime = DateTime.now().setZone('utc');
		const quiz = await prisma.quiz.findFirst({
			where: {
				ended: false,
				startDateTime: {
					gte: currentDateTime.toJSDate(),
				},
			},
			select: {
				quizId: true,
				startDateTime: true,
			},
			orderBy: {
				startDateTime: 'asc',
			},
		});

		if (!quiz) {
			return -1;
		}

		// check if the quiz is X minutes before now
		const startDateTimeMinusXMinutes = DateTime.fromJSDate(quiz.startDateTime).minus({
			minutes: minutes,
		});

		if (currentDateTime >= startDateTimeMinusXMinutes) {
			return quiz.quizId;
		}
		return -1;
	}

	public static async getCurrentQuizForServer(quizId: number): Promise<QuizServerData | null> {
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
			return null;
		}
		return quiz;
	}

	public static async getCurrentQuizForClient(quizId: number): Promise<QuizClientData | null> {
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
			throw null;
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

	public static async getUserQuizEntry(publicKey: string, quizId: number): Promise<number> {
		if (!publicKey) {
			return -1;
		}

		const currentQuizEntry = await prisma.quizEntry.findFirst({
			where: {
				publicKey,
				quizId,
			},
			select: {
				quizEntryId: true,
			},
		});

		if (currentQuizEntry) {
			return currentQuizEntry.quizEntryId;
		}
		return -1;
	}

	// TODO
	public static async updatePointsForCurrentQuiz(
		publicKey: string,
		quizId: number,
		points: number
	) {
		if (points <= 0) {
			return;
		}
		const quizEntryId = await this.getUserQuizEntry(publicKey, quizId);

		if (quizEntryId >= 0) {
			await prisma.quizEntry.update({
				where: {
					quizEntryId: quizEntryId,
				},
				data: {
					points: {
						increment: points,
					},
					numOfCorrect: {
						increment: 1,
					},
				},
			});

			console.log(`${publicKey} earned ${points} for Quiz ${quizId}`);
			return;
		}

		console.log('Error: user cannot be found');
	}

	public static async endQuiz(quizId: number) {
		await prisma.quiz.update({
			where: {
				quizId,
			},
			data: {
				ended: true,
			},
		});
	}

	public static async updateRankings(quizId: number, rankings: CurrentQuizData[]) {
		rankings.sort((userA, userB) => userB.points - userA.points);
		for (let i = 0; i < rankings.length; i++) {
			const quizEntryId = await this.getUserQuizEntry(rankings[i].publicKey, quizId);
			await prisma.quizEntry.update({
				where: {
					quizEntryId,
				},
				data: {
					ranking: i + 1,
				},
			});
		}
	}

	public static async hasUserRegistered(publicKey: string, quizId: number) {
		if (!publicKey || !quizId) {
			return false;
		}

		let quizEntryId = await DataService.getUserQuizEntry(publicKey, quizId);
		if (quizEntryId < 0) {
			return false;
		}
		return true;
	}
}
