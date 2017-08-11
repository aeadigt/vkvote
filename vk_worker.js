'use strict';

// ************************** uncaughtException **************************
process.on('uncaughtException', (err) => {
    console.error('uncaughtException', err);
    process.send('uncaughtException err: ' + err);
    process.exit('uncaughtException err: ' + err);
});

// ************************** Vk keys **************************
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

// First you have to pass access_token from client side JS code
var access_token = 'b0cf28ffec9528880f3c03aebe93c54655d0cf6acb61dda4873073306df5d16d845e60396588f999d4363';
vk.setToken(access_token);


// ************************** Vk запросы **************************
function sendAllNewVideo(video) {
    video.forEach((item) => {
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
            // console.log('\r\n polls.create: ', data);
            // console.log('\r\n polls.create data.response.id: ', data.response.id);

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


async function getVideoOnOpenGroup() {
    return new Promise(function(resolve) {
        vk.request('wall.get', { 
                owner_id: '-150899652', // open
                extended: 0,
                filter: 'others',
                'count': 100
            }, (data) => {
                // console.log('wall.get: ', data);

                if (data && data.response && data.response.items
                    && Array.isArray(data.response.items) ) {
                    let video = [];

                    data.response.items.forEach((item) => {
                        if (item && item.attachments && item.attachments[0]
                            && item.attachments[0].type && item.attachments[0].type == 'video') {
                            // console.log('\r\n Open item: ', item);
                            // console.log('\r\n Open item.attachments[0]: ', item.attachments[0]);
                            video.push(item);
                        }
                    });
                    resolve(video);
                }
            }
        );
    });
}

async function getVideoOnCloseGroup(openVideo) {
    return new Promise(function(resolve) {
        vk.request('wall.get', { 
                owner_id: '-150899833', // close
                extended: 0,
                filter: 'others',
                'count': 100
            }, (data) => {
                // console.log('wall.get: ', data);

                let video = [];
                

                if (data && data.response && data.response.items
                    && Array.isArray(data.response.items) ) {

                    data.response.items.forEach((item) => {
                        if (item && item.attachments && item.attachments[0]
                            && item.attachments[0].type && item.attachments[0].type == 'video') {
                            video.push(item)
                        }
                    });
                }
                resolve(video);
            }
        );
    });
}

async function getNewVideo(openVideo, closeVideo) {
    return new Promise(function(resolve) {
        let video = [];

        openVideo.forEach((openVideoItem) => {
            if (openVideoItem && openVideoItem.attachments && openVideoItem.attachments[0]
                && openVideoItem.attachments[0].type && openVideoItem.attachments[0].type == 'video') {

                if (!isOldVideo(openVideoItem, closeVideo)) {
                    video.push(openVideoItem);
                }
            }
        });
        resolve(video);
    });
}

function isOldVideo(openVideoItem, closeVideo) {
    return closeVideo.some((closeVideoItem) => {
        if (closeVideoItem && closeVideoItem.attachments && closeVideoItem.attachments[0]
            && closeVideoItem.attachments[0].type && closeVideoItem.attachments[0].type == 'video') {
                return isSomeVideo(openVideoItem.attachments[0], closeVideoItem.attachments[0]);

        }
        return true;
    });
}

function isSomeVideo(openVideo, closeVideo) {
    if (openVideo.video.id == closeVideo.video.id
        && openVideo.video.owner_id == closeVideo.video.owner_id) {
        return true;
    }
    return false;
}

async function updateVideo () {
    console.log('updateVideo step 1');
    let videoOpenGroup = await getVideoOnOpenGroup();
    console.log('\r\n videoOpenGroup: ', videoOpenGroup);

    console.log('\r\n updateVideo step 2');
    let videoCloseGroup = await getVideoOnCloseGroup();
    console.log('\r\n videoCloseGroup: ', videoCloseGroup);

    console.log('\r\n updateVideo step 3');
    let newVideo = await getNewVideo(videoOpenGroup, videoCloseGroup);
    console.log('\r\n newVideo: ', newVideo);

    console.log('\r\n updateVideo step 4');
    sendAllNewVideo(newVideo);
}

updateVideo();