export const calculatePoints = (
	startTime: luxon.DateTime,
	endTime: luxon.DateTime,
	submittedTime: luxon.DateTime,
	points: number,
	isCorrect: boolean
) => {
	if (!isCorrect) return 0;

	const interval = endTime.diff(startTime).milliseconds;
	const timeTaken = submittedTime.diff(startTime).milliseconds;
	if (interval <= 0) return 0;

	return ((interval - timeTaken) / interval) * points;
};
