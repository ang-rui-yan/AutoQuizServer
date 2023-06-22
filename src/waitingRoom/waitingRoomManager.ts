import { DateTime } from 'luxon';
import { WaitingRoom } from '../../../client/Trivia-Terrior/types/socketTypes';
import DataService from '../services/dataService';

// Store waiting room participants
export const waitingRoom: WaitingRoom[] = [];

export const addUserIntoWaitingRoom = async (
	publicKey: string,
	userName: string,
	currentQuizId: number
) => {
	const hasRegistered = await DataService.hasUserRegistered(publicKey, currentQuizId);

	// check if registered & handle duplicates
	if (hasRegistered && waitingRoom.findIndex((user) => user.publicKey) < 0) {
		// Add the socket to the waiting room
		waitingRoom.push({
			publicKey,
			userName,
			time: DateTime.now(),
		});

		// Emit the current number of participants to the socket
		console.log('Waiting room count:', waitingRoom.length);
		return true;
	}
	return false;
};

export const removeUserFromWaitingRoom = (publicKey: string) => {
	const index = waitingRoom.findIndex((item) => item.publicKey === publicKey);

	if (index !== -1) {
		// Socket found
		waitingRoom.splice(index, 1);
		console.log('Waiting room count:', waitingRoom.length);
		return true;
	}
	return false;
};
