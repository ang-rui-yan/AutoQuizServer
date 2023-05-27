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
		const publicKey = socket.handshake.query.publicKey;
		const userName = socket.handshake.query.userName;
		console.log('A user connected', publicKey, userName);

		socket.on('disconnect', () => {
			console.log('A user disconnected');
		});
		quizController(socket);
	});

	return io;
};
