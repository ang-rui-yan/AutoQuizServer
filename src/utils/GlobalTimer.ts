import { Server } from 'socket.io';
import { EventEmitter } from 'events';

export default class GlobalTimer extends EventEmitter {
	private static instance: GlobalTimer;
	private timerId: NodeJS.Timeout | null = null;
	private elapsedTime = 0;

	private constructor() {
		super();
	}

	public static getInstance(): GlobalTimer {
		if (!GlobalTimer.instance) {
			GlobalTimer.instance = new GlobalTimer();
		}
		return GlobalTimer.instance;
	}

	private setDuration(duration: number) {
		this.elapsedTime = duration;
	}

	public startTimer(duration: number, event: string) {
		this.setDuration(duration);
		if (!this.timerId) {
			this.timerId = setInterval(() => {
				this.emit(event + ':update', this.elapsedTime);
				if (this.elapsedTime > 0) {
					this.elapsedTime -= 1;
				} else {
					this.stopTimer(event);
				}
			}, 1000);
		}
	}

	public stopTimer(event: string) {
		if (this.timerId) {
			clearInterval(this.timerId);
			this.timerId = null;
			this.elapsedTime = 0;
			this.emit(event + ':stop', this.elapsedTime);
		}
	}

	public getElapsedTime(): number {
		return this.elapsedTime;
	}
}
