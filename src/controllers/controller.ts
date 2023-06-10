import { Socket } from 'socket.io';
import { QuizAdminData, QuestionData } from '../../../client/Trivia-Terrior/types/quizTypes';
import GlobalTimer from '../utils/GlobalTimer';

const WAITING_DURATION = 5;
const DEFAULT_QUESTION_DURATION = 10;

export default class Controller {
	private socket: Socket;
	private clientQuestion: QuestionData[];
	private adminQuestion: QuestionData[];
	public globalTimer: GlobalTimer;

	public constructor(
		socket: Socket,
		clientQuestion: QuestionData[],
		adminQuestion: QuestionData[]
	) {
		this.socket = socket;
		this.clientQuestion = clientQuestion;
		this.adminQuestion = adminQuestion;
		this.globalTimer = GlobalTimer.getInstance();
	}

	// emit: start quiz
	public startQuiz() {
		// emit the relevant quiz information
		this.socket.emit('startQuiz');
		console.log('Start Quiz');
	}

	// emit: question started
	public startQuestion(question: QuestionData) {
		// pass to the client, only the question and options without the correct/wrong
		this.socket.emit('startQuestion', question);
		console.log('Start Question', question);
		this.globalTimer.startTimer(
			question?.timeLimit || DEFAULT_QUESTION_DURATION,
			'questionStarted'
		);

		this.globalTimer.on('questionStarted:stop', () => {
			this.endQuestion();
		});
	}

	// on: question answered + calculate points for those who answered

	// emit: question ended
	private endQuestion() {
		console.log('End question');
		// start the waiting timer
		this.startWaitingTimer();
		this.globalTimer.startTimer(WAITING_DURATION, 'waitingTimer');
		console.log('Start waiting timer');

		// display the current leaderboard
		this.displayLeaderBoard();

		// stop the waiting timer
		this.globalTimer.on('waitingTimer:stop', () => {
			this.stopWaitingTimer();
		});
	}

	// emit: waiting timer started
	private startWaitingTimer() {
		this.socket.emit('startWaitingTime');
		console.log('Start waiting time');
	}

	// emit: display current leaderboard
	private displayLeaderBoard() {
		this.socket.emit('sendLeaderBoard');
		console.log('Show leaderboard');
	}

	// emit: waiting timer ended
	private stopWaitingTimer() {
		this.socket.emit('stopWaitingTime');
		console.log('Stop waiting time');
	}

	// emit: end quiz
	public endQuiz() {
		this.socket.emit('endQuiz');
		console.log('End quiz');
	}
}
