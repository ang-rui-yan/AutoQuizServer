// makes update to the database

import { QuizAdminData } from '../../../client/Trivia-Terrior/types/quizTypes';
import prisma from '../../prisma/client';

async function getUpcomingQuiz() {
	console.log('get upcoming quiz');
	return await prisma.quiz.findFirst({
		where: {
			ended: false,
			startDateTime: {
				gte: new Date(),
			},
		},
	});
}

async function getCurrentQuizForServer(currentDateTime: Date) {
	return await prisma.quiz.findFirst({
		where: {
			ended: false,
			startDateTime: {
				gte: currentDateTime,
			},
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
}

async function getCurrentQuizForClient(currentDateTime: Date) {
	return prisma.quiz.findFirst({
		where: {
			ended: false,
			startDateTime: {
				gte: currentDateTime,
			},
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
			quizEntry: true,
		},
	});
}

async function getCurrentQuiz() {
	const currentDateTime = new Date();

	const quizForServer: QuizAdminData | null = await getCurrentQuizForServer(currentDateTime);
	const quizForClient: QuizAdminData | null = await getCurrentQuizForClient(currentDateTime);

	if (!quizForServer || !quizForClient) {
		return null;
	}

	return { server: quizForServer, client: quizForClient };
}

async function updateDatabase() {
	console.log('updated database');
	return;
}

const dataService = {
	getUpcomingQuiz,
	updateDatabase,
	getCurrentQuiz,
};

export default dataService;
