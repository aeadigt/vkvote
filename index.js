'use strict';

console.log('module index started!');

let Vk = require('vksdk');

let vk = new Vk({
    'appId'     : 6141200,
    'appSecret' : '1WhI5iD5nksYNqQi7MQ5',
    'mode'      : 'oauth',
    'language'  : 'ru'
});

// Setup server access token for server API methods
vk.on('serverTokenReady', (data) => {
    // Here will be server access token
    vk.setToken(data.access_token);
});

// Turn on requests with access tokens
vk.setSecureRequests(true);

// https://oauth.vk.com/authorize?client_id=6141200&redirect_uri=https://oauth.vk.com/blank.html&response_type=token&scope=notify,friends,photos,audio,video,docs,notes,pages,status,wall,groups,messages,email,notifications,stats,ads,market,offline

// ************************** Запросы **************************
var access_token = '750188ab8387a4cf2737462be932866c072e1335c2d52b41dee26f0d5ebd1763e9e981962c18a99be4bb9';
// First you have to pass access_token from client side JS code
vk.setToken(access_token);

// Получаем список постов с видео
vk.request('wall.get', { 
        owner_id: '-150899652',
        extended: 0,
        filter: 'others',
        'count': 100
    }, (data) => {
        console.log('wall.get: ', data);

        let videoPosts = [];

        if (data && data.response && data.response.items
             && Array.isArray(data.response.items) ) {

            data.response.items.forEach((item) => {
                if (item && item.attachments && item.attachments[0]
                    && item.attachments[0].type && item.attachments[0].type == 'video') {
                    videoPosts.push(item)
                }
            });
        }

        sendAllNewVideo(videoPosts);
    }
);

function sendAllNewVideo(videoPosts) {
    videoPosts.forEach((item) => {
        if (item && item.attachments && item.attachments[0] 
            && item.attachments[0].video.owner_id && item.attachments[0].video.id) {

            let video = 'video' + item.attachments[0].video.owner_id + '_' + item.attachments[0].video.id;
            createPoll(video);
        }
    });
};

function createPoll(video) {
    vk.request('polls.create', { 
            owner_id: '-150899833',
            add_answers: '["5", "4", "3", "2", "1"]',
            question: 'Ваша оценка за видео',
            access_token: access_token
        }, (data) => {
            console.log('\r\n polls.create: ', data);
            console.log('\r\n polls.create data.response.id: ', data.response.id);

            if (data && data.response && data.response.id && data.response.owner_id) {
                let poll = 'poll' + data.response.owner_id + '_' + data.response.id;
                sendNewVideo(video, poll);
            }
    });
    
}

function sendNewVideo(video, poll) {
    // Отправляем видео
    vk.request('wall.post', { 
            // owner_id: '-150899833',
            owner_id: '-150899833',
            message: 'Новое видео',
            attachments: video + ',' + poll,
            access_token: access_token
        }, (data) => {
            console.log('\r\n wall.post: ', data);
        }
    );
}

console.log('module index ended!');