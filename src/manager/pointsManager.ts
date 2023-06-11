import DataService from '../services/dataService';
import { DateTime } from 'luxon';

export const calculatePoints = async (
	quizId: number,
	questionId: number,
	chosenOptionId: number,
	startTime: luxon.DateTime,
	endTime: luxon.DateTime,
	points: number
) => {
	const isAnswerCorrect = await DataService.isAnswerCorrect(quizId, questionId, chosenOptionId);
	const submittedTime = DateTime.now();

	if (!isAnswerCorrect) return 0;

	const interval = endTime.diff(startTime).milliseconds;
	const timeTaken = submittedTime.diff(startTime).milliseconds;
	if (interval <= 0) return 0;

	return ((interval - timeTaken) / interval) * points;
};
