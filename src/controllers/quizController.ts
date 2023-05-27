import { Server, Socket } from 'socket.io';
import GlobalTimer from '../utils/GlobalTimer';
import GlobalQuiz from '../utils/GlobalQuiz';
import { QuizAdminData, QuestionData } from '../../../client/Trivia-Terrior/types/quizTypes';
import QuestionController from './QuestionController';

const globalTimer = GlobalTimer.getInstance();
const globalQuiz = GlobalQuiz.getInstance();

const WAIT_DURATION = 3;

const cleanupEventHandlers = (socket: Socket) => {
	socket.removeAllListeners();
};

let quizForServer: QuizAdminData;
let quizForClient: QuizAdminData;
let currentQuestion: QuestionController;
let currentQuestionIndex = 0;

// TODO: Add start question, Add end question, ending quiz, break down

export const quizController = (socket: Socket) => {
	const quiz = globalQuiz.getQuiz();
	console.log(quiz);
	if (quiz && quiz.server && quiz.client) {
		quizForServer = quiz.server;
		quizForClient = quiz.client;

		console.log('start quiz');

		socket.emit('startQuiz');
		currentQuestion = new QuestionController(
			socket,
			quizForClient.question[currentQuestionIndex]
		);
		currentQuestion.startQuestion();
	}

	currentQuestion.on('questionEnded', () => {
		cleanupEventHandlers(socket);
		console.log('question ended');

		// when question ended, check if there is a next
		if (currentQuestionIndex < quizForClient.question.length - 1) {
			// start the next quesiton
			currentQuestionIndex++;

			currentQuestion.setNewQuestion(quizForClient.question[currentQuestionIndex]);
			currentQuestion.startQuestion();
			return;
		}

		// end quiz
		console.log('end quiz');
		socket.emit('endQuiz');
	});
};