import { Server, Socket } from 'socket.io';
import http from 'http';

export default (
	httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
	console.log('Booting up socket server.');
	const io = new Server(httpServer, {
		cors: {
			origin: '*',
		},
	});

	// Store waiting room participants
	const waitingRoom: Socket[] = [];
	console.log('Created waiting room.');

	io.on('connection', (socket: Socket) => {
		// TODO: Add error handler for null values on handshake
		const publicKey = socket.handshake.query.publicKey;
		const userName = socket.handshake.query.userName;

		// Add the socket to the waiting room
		waitingRoom.push(socket);

		// Emit the current number of participants to the socket
		socket.emit('waiting-room-count', waitingRoom.length);

		// TODO: Add authentication for only registered users to participate in the quiz
		console.log(
			`User ${userName}(${publicKey}) has connected!`,
			'Waiting room count:',
			waitingRoom.length
		);

		// TODO: When user disconnects, I need to add somewhere to delete their data?
		socket.on('disconnect', () => {
			const index = waitingRoom.indexOf(socket);
			if (index !== -1) {
				waitingRoom.splice(index, 1);
			}
			console.log(
				`User ${userName}(${publicKey}) disconnected.`,
				'Waiting room count:',
				waitingRoom.length
			);
		});
	});

	return io;
};
