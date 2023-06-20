// makes update to the database
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
		points: number
	) {
		if (points <= 0) {
			return;
		}
		console.log(publicKey, quizId, points);
		const currentQuizEntry = await prisma.user.findFirst({
			where: {
				publicKey: publicKey,
			},
			select: {
				quizEntry: {
					where: {
						quizId: quizId,
					},
					select: {
						quizEntryId: true,
					},
				},
			},
		});
		console.log(currentQuizEntry);
		if (currentQuizEntry) {
			const currentQuizEntryId = currentQuizEntry.quizEntry[0].quizEntryId;
			await prisma.quizEntry.update({
				where: {
					quizEntryId: currentQuizEntryId,
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
		}
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
}

// TODO
// Add a function to update the ranking