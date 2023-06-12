import { EventEmitter } from 'events';

export default class GlobalTimer extends EventEmitter {
	private static instance: GlobalTimer;
	private timerId: NodeJS.Timeout | null = null;
	private startTime: number = 0;
	private remainingTime: number = 0;
	private isDevelopment: boolean = true;

	private constructor() {
		super();
	}

	public static getInstance(): GlobalTimer {
		if (!GlobalTimer.instance) {
			GlobalTimer.instance = new GlobalTimer();
		}
		return GlobalTimer.instance;
	}

	private cleanupEventHandler(event: string) {
		this.removeAllListeners(event + ':update');
		this.removeAllListeners(event + ':stop');
	}

	public startTimer(event: string, duration: number) {
		this.removeAllListeners(event + ':stop');

		this.startTime = Date.now();
		this.remainingTime = duration;

		this.emit(event + ':update', this.remainingTime);
		console.log('Started timer for', event);

		this.timerId = setInterval(() => {
			const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
			this.remainingTime = duration - elapsedTime;

			if (this.isDevelopment) {
				console.log(this.remainingTime);
			}

			if (this.remainingTime > 0) {
				this.emit(event + ':update', this.remainingTime);
			} else {
				this.stopTimer(event);
			}
		}, 1000);
	}

	public stopTimer(event: string) {
		this.removeAllListeners(event + ':update');

		if (this.timerId) {
			clearInterval(this.timerId);

			this.timerId = null;
			this.remainingTime = 0;
			this.emit(event + ':stop', this.remainingTime);
		}
	}

	public getRemainingTime(): number {
		const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
		return Math.max(this.remainingTime - elapsedTime, 0);
	}
}
