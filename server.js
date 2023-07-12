const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3000;
let current_encoding = 'utf-8'; 
let thread_count = 16; 

// Подключаем socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('./public'));

io.on('connection', function(socket) {
    console.log('a user connected');

    socket.on('set_encoding', (encodingObj) => {
        current_encoding = encodingObj.encoding; // сохраняем выбранное значение для последующего использования
        console.log('Encoding set to', current_encoding);
    });


    socket.on('start_script1', () => {
        const script1 = spawn('python', ['./parsing.py']);

        script1.stdout.on('data', data => {
            console.log(`stdout: ${data}`);
            io.emit("progress1", data.toString()); 
        });

        script1.stderr.on('data', data => {
            console.error(`stderr: ${data}`);
        });

        script1.on('close', code => {
            console.log(`child process exited with code ${code}`);
            io.emit("completed1");  // Сообщаем клиенту о завершении
        });
    });

    socket.on('start_script2', (data) => {
        thread_count = data.threads;
        console.log('Thread count set to', thread_count);
        const script2 = spawn('python', ['./parsing_uiks.py', current_encoding, thread_count]); // передаем кодировку в качестве аргумента при запуске скрипта

        script2.stdout.on('data', data => {
            console.log(`stdout: ${data}`);
            socket.emit('progress2', data.toString());
        });

        script2.stderr.on('data', data => {
            console.error(`stderr: ${data}`);
        });

        script2.on('close', code => {
            console.log(`child process exited with code ${code}`);
            socket.emit('completed2');
        });
    });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

