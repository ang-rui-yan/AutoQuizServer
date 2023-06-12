import DataService from '../services/dataService';
import { DateTime } from 'luxon';

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
