import { EventEmitter } from 'events';
import { QuizAdminData, QuizData } from '../../../client/Trivia-Terrior/types/quizTypes';
import prisma from '../prisma/client';

export default class GlobalQuiz extends EventEmitter {
	private static instance: GlobalQuiz;
	private quizForServer: QuizAdminData | null = null;
	private quizForClient: QuizAdminData | null = null;

	private constructor() {
		super();
		this.setQuiz()
			.then((quiz) => {
				this.quizForServer = quiz![0];
				this.quizForClient = quiz![1];
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

	private async setQuiz(): Promise<[QuizAdminData, QuizAdminData] | null> {
		const quizForServer = await prisma.quiz.findMany({
			where: {
				ended: false,
				startDateTime: {
					gte: new Date(),
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

		if (quizForServer.length == 0) {
			return null;
		}

		const quizForClient: QuizAdminData = {
			...quizForServer[0],
			question: quizForServer[0].question.map((question) => ({
				...question,
				option: question.option.map((option) => {
					return {
						optionId: option.optionId,
						questionId: option.questionId,
						text: option.text,
					};
				}),
			})),
		};

		return [quizForServer[0], quizForClient];
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
