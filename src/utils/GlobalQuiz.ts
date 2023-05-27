import { EventEmitter } from 'events';
import { QuizAdminData } from '../../../client/Trivia-Terrior/types/quizTypes';
import prisma from '../../prisma/client';

// TODO: Since i am using event emitter, make sure of it or remove
export default class GlobalQuiz extends EventEmitter {
	private static instance: GlobalQuiz;
	private quizForServer: QuizAdminData | null = null;
	private quizForClient: QuizAdminData | null = null;

	private constructor() {
		super();
		this.loadQuiz()
			.then((quiz) => {
				if (quiz) {
					({ server: this.quizForServer, client: this.quizForClient } = quiz);
				}
			})
			.catch((error) => {
				console.error('Error fetching upcoming quiz:', error);
			});
	}

	public static getInstance(): GlobalQuiz {
		if (!GlobalQuiz.instance) {
			GlobalQuiz.instance = new GlobalQuiz();
		}
		return GlobalQuiz.instance;
	}

	private async loadQuiz(): Promise<{ server: QuizAdminData; client: QuizAdminData } | null> {
		const currentDateTime = new Date();

		const quizForServer = await prisma.quiz.findFirst({
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

		const quizForClient = await prisma.quiz.findFirst({
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

		if (!quizForServer || !quizForClient) {
			return null;
		}

		return { server: quizForServer, client: quizForClient };
	}

	public getQuiz(): {
		server: QuizAdminData | null;
		client: QuizAdminData | null;
	} {
		return {
			server: this.quizForServer,
			client: this.quizForClient,
		};
	}
}
