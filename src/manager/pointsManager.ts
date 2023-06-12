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

	if (!isAnswerCorrect) return 0;

	const timeTaken = submittedTime.diff(startTime).milliseconds;
	if (timeLimitInSeconds <= 0) return 0;

	return ((timeLimitInSeconds - timeTaken) / timeLimitInSeconds) * points;
};
