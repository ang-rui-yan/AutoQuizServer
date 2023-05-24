import { PrismaClient } from '@prisma/client';

const express = require('express');
const http = require('http');
const app = express();
const cors = require('cors');
const server = http.createServer(app);

import { Server } from 'socket.io';

const prisma = new PrismaClient();
// change origin for production
const io = new Server(server, {
	cors: {
		origin: '*',
	},
});
app.use(cors());
app.use(express.json());

let currentDateTime = Date.now();

async function getQuiz() {
	try {
		const quizzes = await prisma.quiz.findMany();
		return quizzes;
	} catch (error) {
		return null;
	}
}

async function getUpcomingQuiz() {
	try {
		const quizzes = await prisma.quiz.findFirst({
			where: {
				ended: false,
			},
			orderBy: {
				startdatetime: 'desc',
			},
		});
		return quizzes;
	} catch (error) {
		return null;
	}
}

const updateTime = () => {
	currentDateTime = Date.now();
};

io.on('connection', async (socket) => {
	console.log('a user connected');

	try {
		const quiz = await getUpcomingQuiz();
		if (quiz) {
			socket.data = quiz;
			socket.emit('quizFound', quiz);
		} else {
			socket.emit('quizNotFound', 'Quiz not found');
		}
	} catch (error) {
		socket.emit('fetchError', 'Error retrieving data');
	}

	socket.on('input-change', (msg) => {
		socket.broadcast.emit('update-input', msg);
	});

	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
});

setInterval(updateTime, 1000);

server.listen(3001, () => {
	console.log('server listening on port 3001');
});
