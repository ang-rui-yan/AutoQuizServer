import { EventEmitter } from 'events';
import dataService from './dataService';

const START_QUIZ_EVENT = 'startQuiz';

// WIP
export default class CountdownTimer extends EventEmitter {
	private static instance: CountdownTimer;
	private intervalId: NodeJS.Timeout | null = null;

	public static getInstance(): CountdownTimer {
		if (!CountdownTimer.instance) {
			CountdownTimer.instance = new CountdownTimer();
		}
		return CountdownTimer.instance;
	}

	public async startCountdown() {
		console.log('start countdown');

		let targetDateTime = (await dataService.getUpcomingQuiz())?.startDateTime;

		if (!targetDateTime) {
			return;
		}

		const targetTime = new Date(targetDateTime).getTime();

		// Calculate the initial time remaining
		const currentTime = new Date().getTime();
		const timeRemaining = targetTime - currentTime;

		if (timeRemaining <= 0) {
			// Target time has already passed
			this.stopCountdown();

			// this.emit(START_QUIZ_EVENT);
		} else {
			// Start the countdown
			// clean up
			// this.removeAllListeners();

			console.log('Countdown started');
			console.log('Target DateTime:', new Date(targetDateTime));

			// Initial display of remaining time
			this.handleTimerUpdate(timeRemaining);

			// Update the timer every second
			this.intervalId = setInterval(() => {
				const currentTime = new Date().getTime();
				const remainingTime = targetTime - currentTime;

				if (remainingTime <= 0) {
					// Timer has ended
					this.stopCountdown();
				} else {
					// Timer is still running
					this.handleTimerUpdate(remainingTime);
				}
			}, 1000); // Update every second
		}
	}

	public stopCountdown() {
		console.log('stop countdown');
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.handleTimerEnd();
		}
	}

	private handleTimerUpdate(remainingTime: number) {
		// Handle timer update event
		const seconds = Math.floor(remainingTime / 1000) % 60;
		const minutes = Math.floor(remainingTime / 1000 / 60) % 60;
		const hours = Math.floor(remainingTime / 1000 / 60 / 60) % 24;
		const days = Math.floor(remainingTime / 1000 / 60 / 60 / 24);

		console.log(
			`Remaining time: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`
		);
	}

	private handleTimerEnd() {
		// Handle timer end event
		console.log('Timer ended');
	}
}
