import { CurrentQuizData } from '../../../client/Trivia-Terrior/types/quizTypes';
import DataService from '../services/dataService';
import { DateTime } from 'luxon';

export const currentQuizData: CurrentQuizData[] = [];

export const calculateAndUpdatePoints = async (
	publicKey: string,
	userName: string,
	quizId: number,
	questionId: number,
	chosenOptionId: number,
	startTime: luxon.DateTime,
	timeLimitInSeconds: number,
	points: number
) => {
	await calculatePoints(
		quizId,
		questionId,
		chosenOptionId,
		startTime,
		timeLimitInSeconds,
		points
	).then(async (points) => await updatePoints(publicKey, userName, quizId, points));
};

export const calculatePoints = async (
	quizId: number,
	questionId: number,
	chosenOptionId: number,
	startTime: luxon.DateTime,
	timeLimitInSeconds: number,
	points: number
) => {
	const isAnswerCorrect = await DataService.isAnswerCorrect(quizId, questionId, chosenOptionId);
	const submittedTime = DateTime.now();

	let earnedPoints = 0;
	if (isAnswerCorrect) {
		const timeTaken = submittedTime.diff(startTime).milliseconds;
		timeLimitInSeconds *= 1000;
		if (timeLimitInSeconds <= 0) return 0;
		earnedPoints = Math.round(((timeLimitInSeconds - timeTaken) / timeLimitInSeconds) * points);
	}

	return earnedPoints;
};

export const updatePoints = async (
	publicKey: string,
	userName: string,
	quizId: number,
	points: number
) => {
	DataService.updatePointsForCurrentQuiz(publicKey, quizId, points);

	const userIndex = currentQuizData.findIndex((user) => user.publicKey == publicKey);
	if (userIndex != -1) {
		currentQuizData[userIndex] = {
			publicKey: publicKey,
			name: userName,
			points: points + currentQuizData[userIndex].points,
			numOfCorrect:
				points > 0
					? currentQuizData[userIndex].numOfCorrect + 1
					: currentQuizData[userIndex].numOfCorrect,
		};
	} else {
		currentQuizData.push({
			publicKey: publicKey,
			name: userName,
			points: points,
			numOfCorrect: points > 0 ? 1 : 0,
		});
	}
};
