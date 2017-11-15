'use strict';

function debug(msg) {
    console.log(msg);

    if ('send' in process) {
        process.send(msg);
    }
}

// ************************** uncaughtException **************************
process.on('uncaughtException', (err) => {
    debug('\r\n uncaughtException ' +  err.stack);

    process.nextTick(() => {
        debug('uncaughtException nextTick process.exit');
        process.exit('uncaughtException err: ' + err.stack);
    });
    
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
    if (!data) {
        return;
    }
    // Here will be server access token
    vk.setToken(data.access_token);
});

// Turn on requests with access tokens
vk.setSecureRequests(true);

// First you have to pass access_token from client side JS code
var access_token = 'e045135299cd71cd89412faa7a10d305b117c03544b7d8ff48a308e8b315035dfd6fcf9e9c8107bc11941';
vk.setToken(access_token);

// ************************** Vk init **************************
let openGroup = '-154629793';

// ************************** Common Requests **************************
function getVideoInfo() {
    return new Promise(function(resolve) {
        vk.request('video.get', { 
                owner_id: openGroup,
                extended: 0,
                count: 100
            }, (data) => {
                if (!data) {
                    return resolve([]);
                }

                if (data && data.response && data.response.items
                    && Array.isArray(data.response.items) ) {
                    let video = [];

                    data.response.items.forEach((item) => {
                        if ( item && ('id' in item) ) {
                            video.push(item);
                        }
                    });
                    resolve(video);
                } else {
                    return resolve([]);
                }
            }
        );
    });
}

// ******************************** delay ********************************
function delay() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 2000);
    });
};

// ************************** update Posts **************************
async function getVideo(closePosts) {
    // debug('getVideo step 1');

    let videoInfo = await getVideoInfo();
    // debug('\r\n videoInfo count = ' + videoInfo.length);
    // debug(videoInfo);

    let result = { 
        links: []
    };

    videoInfo.forEach((item) => {
        if ( item && ('player' in item) ) {
            // debug(item);
            result.links.push(item['player']);
        }
    });

    debug(JSON.stringify(result));

    await delay();
}

// ************************** execute **************************
getVideo();