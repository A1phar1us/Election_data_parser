let socket = io.connect();

const startButton1 = document.getElementById('startScript1');
const startButton2 = document.getElementById('startScript2');
const progress1 = document.querySelector('#progress1 .progress');
const progress2 = document.querySelector('#progress2 .progress');
const message1 = document.getElementById('message1');
const message2 = document.getElementById('message2');
const timerValue1 = document.getElementById('timerValue1');
const timerValue2 = document.getElementById('timerValue2');
const startTimeValue1 = document.getElementById('startTimeValue1');
const startTimeValue2 = document.getElementById('startTimeValue2');
const endTimeValue1 = document.getElementById('endTimeValue1');
const endTimeValue2 = document.getElementById('endTimeValue2');
var encodingContainer2 = document.getElementById("encodingContainer2");
var encoding2 = encodingContainer2.querySelector("select");

let startTimes = {1: null, 2: null};
let totalTime = {1: 0, 2: 0};
let operationCounts = {1: 0, 2: 0};
let movingAverageTime = {1: 0, 2: 0};
let alpha = 0.1; // parameter for moving average, can be adjusted

encoding2.addEventListener('change', function() {
    socket.emit('set_encoding', { encoding: this.value });
});

startButton1.addEventListener('click', function() {
    socket.emit('start_script1');
    this.disabled = true;
    startButton2.disabled = true;
    startTimes[1] = Date.now();
    startTimeValue1.textContent = new Date(startTimes[1]).toLocaleTimeString();
});

startButton2.addEventListener('click', function() {
    const threadCount = document.getElementById("threadCountSlider").value;
    socket.emit('start_script2', { encoding: encoding2.value, threads: threadCount });
    this.disabled = true;
    startButton1.disabled = true;
    startTimes[2] = Date.now();
    startTimeValue2.textContent = new Date(startTimes[2]).toLocaleTimeString();
});

socket.on('progress1', function(data) {
    const progressData = JSON.parse(data);
    console.log('Script 1 progress:', progressData.content);
    progress1.style.width = progressData.content + "%";
    const [_, __, completed, ___, total] = progressData.message.split(' ');
    const scriptNumber = 1;
    operationCounts[scriptNumber]++;
    updateTimer(scriptNumber, Number(total), Number(completed));
    message1.textContent = progressData.message;
});

socket.on('completed1', function() {
    console.log('Script 1 completed');
    startButton1.disabled = false;
    startButton2.disabled = false;
    progress1.style.width = "0%";
    message1.textContent = 'Script 1 completed';
    const scriptNumber = 1;
    resetTimer(scriptNumber);
});

socket.on('progress2', function(data) {
    const progressData = JSON.parse(data);
    console.log('Script 2 progress:', progressData.content);
    progress2.style.width = progressData.content + "%";
    const [_, __, completed, ___, total] = progressData.message.split(' ');
    const scriptNumber = 2;
    operationCounts[scriptNumber]++;
    updateTimer(scriptNumber, Number(total), Number(completed));
    message2.textContent = progressData.message;
});

socket.on('completed2', function() {
    console.log('Script 2 completed');
    startButton2.disabled = false;
    startButton1.disabled = false;
    progress2.style.width = "0%";
    message2.textContent = 'Script 2 completed';
    const scriptNumber = 2;
    resetTimer(scriptNumber);
});

function updateTimer(scriptNumber, totalTasks, completedTasks) {
    const now = Date.now();
    const elapsed = now - startTimes[scriptNumber];
    totalTime[scriptNumber] += elapsed;
    const averageTime = totalTime[scriptNumber] / operationCounts[scriptNumber];

    movingAverageTime[scriptNumber] = alpha * averageTime + (1 - alpha) * movingAverageTime[scriptNumber];

    const tasksLeft = totalTasks - completedTasks;
    const estimatedTimeLeft = tasksLeft * movingAverageTime[scriptNumber];
    const estimatedEndTime = now + estimatedTimeLeft;
    
    const hh = Math.floor(estimatedTimeLeft / 1000 / 60 / 60).toString().padStart(2, '0');
    const mm = Math.floor((estimatedTimeLeft / 1000 / 60) % 60).toString().padStart(2, '0');
    const ss = Math.floor((estimatedTimeLeft / 1000) % 60).toString().padStart(2, '0');

    if(scriptNumber === 1) {
        timerValue1.textContent = `${hh}:${mm}:${ss}`;
        endTimeValue1.textContent = new Date(estimatedEndTime).toLocaleTimeString();
    } else {
        timerValue2.textContent = `${hh}:${mm}:${ss}`;
        endTimeValue2.textContent = new Date(estimatedEndTime).toLocaleTimeString();
    }
    
    startTimes[scriptNumber] = now;
}

function resetTimer(scriptNumber) {
    startTimes[scriptNumber] = null;
    totalTime[scriptNumber] = 0;
    operationCounts[scriptNumber] = 0;
    movingAverageTime[scriptNumber] = 0;

    if(scriptNumber === 1) {
        timerValue1.textContent = '';
        endTimeValue1.textContent = '';
    } else {
        timerValue2.textContent = '';
        endTimeValue2.textContent = '';
    }
}

