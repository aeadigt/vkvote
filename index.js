'use strict';

// https://oauth.vk.com/authorize?client_id=6141200&redirect_uri=https://oauth.vk.com/blank.html&response_type=token&scope=notify,friends,photos,audio,video,docs,notes,pages,status,wall,groups,messages,email,notifications,stats,ads,market,offline

// ************************** uncaughtException **************************
process.on('uncaughtException', (e) => {
    console.error('uncaughtException', e);
});

// let time = 86400000;
let time = 10000;

let timer = setInterval(() => {
    console.log('Starting timer');
    startWorker();
}, time);

let isRunWorker = false;

// ************************** Express **************************
let express        = require('express');
let app            = express();

/* *************** Routes *************** */
app.post('/addvideo', (req, res) => {
    console.log('Post request addvideo');
    startWorker();
    res.end('be78723e');
});

app.listen(8000,function(){
    console.log('Started on PORT 80');
});

// ************************** Timer **************************
function startWorker() {
    if (isRunWorker) {
        console.log('Worker already running');
        return false;
    }

    console.log('Start new worker');

    isRunWorker = true;
    console.log(process.cwd() + '/vk_worker.js');
    let worker = require('child_process').fork(process.cwd() + '/vk_worker.js', { silent: true, execPath: 'node' });

    worker.on('error', function(err) {
        console.error('worker err: ', err);
    });

    worker.on('close', function(code) {
        console.log('Close worker code: ', code);
        isRunWorker = false;
    });

    worker.on('message', function(msg) {
        console.log('Worker msg: ', msg);
    });
}