import { Server, Socket } from 'socket.io';
import http from 'http';
import { quizController } from './controllers/quizController';

export default (
	httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
	const io = new Server(httpServer, {
		cors: {
			origin: '*',
		},
	});

	io.on('connection', (socket: Socket) => {
		// TODO: Add error handler for null values on handshake
		const publicKey = socket.handshake.query.publicKey;
		const userName = socket.handshake.query.userName;
		console.log('A user connected', publicKey, userName);

		// TODO: Add authentication for only registered users to participate in the quiz
		
		// TODO: When user disconnects, I need to add somewhere to delete their data?
		socket.on('disconnect', () => {
			console.log('A user disconnected');
		});
		quizController(socket);
	});

	return io;
};
