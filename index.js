'use strict';

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


// ************************** Запросы **************************

// First you have to pass access_token from client side JS code
vk.setToken('6e4e86856e4e86856e4e86856e6e13339566e4e6e4e868537c7e09391da28f8edcca67f');

// Получаем список постов с видео
vk.request('wall.get', { 
        owner_id: '-150899652',
        extended: 0,
        filter: 'others',
        'count': 100
    }, (data) => {
        console.log('wall.get: ', data);

        let videoPosts = [];

        if (data && data.response && data.response.items &&
            Array.isArray(data.response.items) ) {

            data.response.items.forEach((item) => {
                if (item && item.attachments && item.attachments[0] && 
                    item.attachments[0].type && item.attachments[0].type == 'video') {
                    videoPosts.push(item)
                }
            });
        }

        console.log('\r\n count video Posts: ', videoPosts.length);

        videoPosts.forEach((item) => {
            console.log('\r\n videoPost: ', item);
        });
    }
);

console.log('module index started!');