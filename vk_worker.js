'use strict';

function debug(msg) {
    console.log(msg);

    if ('send' in process) {
        process.send(msg);
    }
}

// ************************** uncaughtException **************************
process.on('uncaughtException', (err) => {
    debug('uncaughtException ' +  err.stack);

    process.nextTick(() => {
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
let openGroup = '-150899652';
let closeGroup = '-150899833';
let likeAdmin = '441461955';
let members = [];
// ************************** Vk request **************************

// ************************** Common Requests **************************
function getOpenPosts() {
    return new Promise(function(resolve) {
        vk.request('wall.get', { 
                owner_id: openGroup,
                extended: 0,
                // filter: 'others'
                count: 100
            }, (data) => {
                if (!data) {
                    return resolve([]);
                }

                if (data && data.response && data.response.items
                    && Array.isArray(data.response.items) ) {
                    let video = [];

                    data.response.items.forEach((item) => {
                        if (item && item.attachments && item.attachments[0]
                            && item.attachments[0].type && item.attachments[0].type == 'video') {
                            // debug('\r\n Open item.attachments[0]: ' + item.attachments[0]);
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

function getClosePosts(offset) {
    offset = offset || 0;
    return new Promise(function(resolve) {
        vk.request('wall.get', { 
                owner_id: closeGroup,
                extended: 0,
                filter: 'all',
                offset: offset,
                count: 100
            }, (data) => {
                if ( (!data) || (!data.response) || (!data.response.items) ) {
                    process.exit('getClosePosts not fount data.response.items');
                }

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

// ******************************** delay ********************************
function delay() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 2000);
    });
};

// ******************************** getMembers ********************************
function getMembers(post) {
    return new Promise((resolve, reject) => {
        vk.request('groups.getMembers', {
                group_id: 150899833
            }, (data) => {
                if (!data) {
                    return resolve([]);
                }

                if (data && data.response && data.response.items) {
                    return resolve(data.response.items);
                }

                return [];
            }
        );
    });
};

// ************************** Update posts **************************

// ************************** Find new posts **************************
function getNewPosts(openVideo, closeVideo) {
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

// ************************** Send Posts **************************
function sendAllNewVideo(video) {
    video.forEach((item) => {
        if (item && item.attachments && item.attachments[0] 
            && item.attachments[0].video.owner_id && item.attachments[0].video.id) {

            let video = 'video' + item.attachments[0].video.owner_id + '_' + item.attachments[0].video.id;
            createPoll(video, item.id);
        }
    });
};

function createPoll(video, idOpenPost) {
    vk.request('polls.create', { 
            owner_id: closeGroup,
            add_answers: '["5", "4", "3", "2", "1"]',
            question: 'Ваша оценка за видео',
            access_token: access_token
        }, (data) => {
            if (!data) {
                return;
            }
            // debug('\r\n polls.create: ' + data);

            if (data && data.response && data.response.id && data.response.owner_id) {
                let poll = 'poll' + data.response.owner_id + '_' + data.response.id;
                sendNewVideo(video, poll, idOpenPost);
            }
    });
}



function sendNewVideo(video, poll, idOpenPost) {
    // Отправляем видео
    vk.request('wall.post', { 
            owner_id: closeGroup,
            message: idOpenPost,
            attachments: video + ',' + poll,
            access_token: access_token,
            from_group: 1
        }, (data) => {
            if (!data) {
                return;
            }

            debug('\r\n wall.post: ' + data);

            if (data && data.response 
                && data.response.post_id) {
                alertPeoples(data.response.post_id);
            }
        }
    );
}

function alertPeoples(postId) {
    if (!postId) {
        return false;
    }

    debug('\r\n alertPeoples postId: ' + postId + ' members: ' + members);

    members.forEach((member) => {
        if (member) {
            vk.request('messages.send', {
                user_id: member,
                attachment: 'wall' + closeGroup + '_' + postId
            }, (data) => {
                if (!data) {
                    return false;
                }
                debug('alertPeoples data: ' + data);
                return true;
            });
        }
    });


}


// ************************** update Posts **************************
async function updatePosts(closePosts) {
    debug('updatePosts step 1');

    let openPosts = await getOpenPosts();
    // debug('\r\n openPosts: ', openPosts);

    await delay();

    debug('\r\n updatePosts step 2');
    // debug('updatePosts step 2');
    let lastClosePosts = await getClosePosts();
    if (lastClosePosts) {
        closePosts = closePosts.concat(lastClosePosts);
    }
    // debug('\r\n closePosts: ' + closePosts);

    await delay();

    debug('\r\n updatePosts step 3');
    // debug('updatePosts step 3');
    let newPosts = await getNewPosts(openPosts, closePosts);
    // debug('\r\n newPosts: ' + newPosts);

    await delay();

    debug('\r\n updatePosts step 4');
    // debug('updatePosts step 4');
    sendAllNewVideo(newPosts);
}

// ************************** Update votes **************************
function getPollById(post) {
    return new Promise((resolve, reject) => {
        vk.request('polls.getById', {
                owner_id: closeGroup,
                poll_id: post.attachments[1].poll.id,
                is_board: 0
            }, (data) => {
                if (!data) {
                    return resolve(false);
                }

                if (data && data.response 
                    && data.response.votes && data.response.votes >= 1) {
                    // debug(data.response);

                    if (data.response.answers) {
                        let countVotes = 0;
                        let sum = 0;

                        data.response.answers.forEach((answer) => {
                            if (answer && answer.votes && answer.text) {
                                sum += Number(answer.votes) * Number(answer.text);
                                countVotes += Number(answer.votes);
                            }
                        });

                        try {
                            let average = sum/countVotes;
                            data.response.average = average;
                            post.poll = data;
                            return resolve(post);
                        } catch (err) {
                            console.error('error: ', err);
                            return resolve(false);
                        }
                    }
                } else {
                    return resolve(false);
                }
            }
        );
    });
};

async function getAverageClosePosts(likedClosePosts) {
    let averageClosePosts = [];

    likedClosePosts.forEach((item) => {
        if (item && item.attachments && item.attachments[0]
            && item.attachments[0].type && item.attachments[0].type == 'video'
            && item.attachments[1] && item.attachments[1].type 
            && item.attachments[1].type == 'poll'
            && item.attachments[1].poll && item.attachments[1].poll.id
            && item.attachments[1].poll.answers[0].id
            && item.attachments[1].poll.answers[1].id
            && item.attachments[1].poll.answers[2].id
            && item.attachments[1].poll.answers[3].id
            && item.attachments[1].poll.answers[4].id) {

            averageClosePosts.push( getPollById(item) );
        }
    });

    async function removeBlankRecords() {
        let likeClosePosts = await Promise.all(averageClosePosts);

        return likeClosePosts.filter((closePost) => {
            return closePost;
        });
    }

    return await removeBlankRecords();
}

// ************************** isLiked **************************
function getLikedClosePost(post) {
    return new Promise((resolve, reject) => {
        vk.request('likes.isLiked', {
                user_id: likeAdmin,
                type: 'post',
                owner_id: closeGroup,
                item_id: post.id
            }, (data) => {
                if (!data) {
                    return resolve(false);
                }
                if (data && data.response && data.response.liked) {
                    return resolve(post);
                } else {
                    return resolve(false);
                }
            }
        );
    });
};

async function getLikedClosePosts(allClosePosts) {
    let likedClosePosts = [];

    allClosePosts.forEach((item) => {
        if (item && item.attachments && item.attachments[0]
            && item.attachments[0].type && item.attachments[0].type == 'video'
            && item.attachments[1] && item.attachments[1].type 
            && item.attachments[1].type == 'poll'
            && item.attachments[1].poll && item.attachments[1].poll.id
            && item.attachments[1].poll.answers[0].id
            && item.attachments[1].poll.answers[1].id
            && item.attachments[1].poll.answers[2].id
            && item.attachments[1].poll.answers[3].id
            && item.attachments[1].poll.answers[4].id) {

            likedClosePosts.push( getLikedClosePost(item) );
        }
    });

    async function removeBlankRecords() {
        let closePosts = await Promise.all(likedClosePosts);

        return closePosts.filter((closePost) => {
            return closePost;
        });
    }

    return await removeBlankRecords();
}

// ************************** getComments **************************
function getCommentsById(idPost) {
    return new Promise((resolve) => {
        vk.request('wall.getComments', { 
                owner_id: idPost.owner_id,
                post_id: idPost.post_id,
                count: 1000,
                sort: 'desc'
            }, (data) => {
                if (!data && !postData) {
                    return resolve(false);
                }

                data.owner_id = idPost.owner_id;
                data.post_id = idPost.post_id;
                data.average = idPost.average;

                return resolve(data);
            }
        );
    });
}

async function getCommentsPosts(idPosts) {
    // debug('\r\n getCommentsById: ' + idPosts);
    let comments = [];

    idPosts.forEach((item) => {
        comments.push( getCommentsById(item) );
    });

    async function removeBlankRecords() {
        let allComments = await Promise.all(comments);

        return allComments;

        // allComments.push(false);

        // return allComments.filter((comment) => {
        //     return comment;
        // });
    }

    return await removeBlankRecords();
}

// ************************** getOpenIdPosts **************************
function getIdOpenPosts(posts) {
    let idPosts = [];

    if (posts) {
        posts.forEach((item) => {
            let id = { 
                owner_id: openGroup, 
                post_id: item.text, 
                average: item.poll.response.average
            };
            idPosts.push(id);
        });
    }
    return idPosts;
}

// ************************** setVotes **************************
function setVotes(openIdPosts) {
    debug('setVotes openIdPosts: ' + openIdPosts);
    
    if (openIdPosts) {
        openIdPosts.forEach((item, i) => {
            vk.request('wall.createComment', {
                owner_id: openGroup,
                post_id: item.post_id,
                from_group: 150899652,
                message: 'Ваша оценка: ' + openIdPosts[i].average,
                guid: item.post_id + '_' + openIdPosts[i].average
            }, (data) => {
                if (!data) {
                    return false;
                }
                debug('wall.createComment data: ' + data);
                return true;
            });
        });
    }
}

// ************************** getRelevantComments **************************
function getRelevantComments(allCommentsPosts) {
    if (!allCommentsPosts) {
        return [];
    }
    return allCommentsPosts.filter((item) => {
        if (!item) {
            return false;
        }

        if (item && item.response && item.response.items) {

            // Сохраняем только те комментарии в которых есть выставление оценки
            item.response.items = item.response.items.filter((comment, i) => {

                if (item && item.post_id && comment && item.owner_id
                    && item.offset && item.response && item.response.items && item.response.items.length) {
                    debug('\r\n ' + item.post_id + ' \r\n comment: ' + comment +
                        '\r\n owner_id: ' + item.owner_id + 
                        '\r\n post_id: ' + item.post_id + 
                        '\r\n offset: ' + item.offset + 
                        '\r\n length: ' + item.response.items.length);
                }

                if ( comment.from_id == openGroup 
                    && comment.text.indexOf('Ваша оценка:') + 1 ) {
                    // debug(item.post_id + ' Есть комментарий [Ваша оценка:]. Оставляем для флага.');
                    return true;
                }

                // debug(item.post_id + ' Нет комментария [Ваша оценка:]. Удалим элемент в фильтре.');
                return false;
            });
        }

        if (item && item.response && item.response.items && item.response.items.length) {
            // debug(item.post_id + ' Есть комментарии [Ваша оценка:] Удаляем запись ', item.response.items.length);
            return false;
        } else {
            // debug(item.post_id + ' Нет комментария [Ваша оценка:]. Сохраняем запись.');
            return true;
        }
    });
}

// ************************** startTimerProcessExit **************************
function startTimerProcessExit() {
    debug('Start Timer kill process 5 min.');

    setTimeout(() => {
        debug('Kill Process');

        process.nextTick(() => {
            process.exit();
        });
    }, 60000 * 5);
}

// ************************** updateVites **************************
async function updateVites(offset, closePosts) {
    offset = offset || 0;

    // debug('\r\n updateVites step 0 offset: ' + offset);
    // debug('updateVites step 0 offset:');
    // debug('updateVites step 0 offset:');

    // debug('\r\n updateVites step 1');
    // debug('updateVites step 1');
    debug('updateVites step 1');
    // let closePosts = await getClosePosts(offset);
    // debug('\r\n closePosts: ' + closePosts);

    // debug('****** offset ************ ' + offset);
    // closePosts.forEach(function(item) {
    //     debug(item['text']);
    // });

    await delay();
    
    debug('\r\n updateVites step 2');
    // debug('updateVites step 2');
    let likedClosePosts = await getLikedClosePosts(closePosts);
    // debug('likedClosePosts: ' + likedClosePosts);

    await delay();

    debug('\r\n updateVites step 3');
    // debug('updateVites step 3');
    let averageClosePosts = await getAverageClosePosts(likedClosePosts);
    debug('\r\n averageClosePosts: ');//, averageClosePosts);

    await delay();

    let openIdPosts = getIdOpenPosts(averageClosePosts);
    debug('\r\n openIdPosts: ');//, openIdPosts);
    // debug('openIdPosts: ' + openIdPosts);

    let allCommentsPosts = await getCommentsPosts(openIdPosts);
    // debug('\r\n all allCommentsPosts: ' + allCommentsPosts);

    await delay();

    allCommentsPosts = getRelevantComments(allCommentsPosts);

    debug('\r\n Not voted allCommentsPosts: ' + allCommentsPosts);
 
    await setVotes(allCommentsPosts);
}

async function updateAllData() {
    members = await getMembers();

    debug('members: ' + members);

    let closePosts = [];

    for (let i = 0; i < 2000; i += 100) {
        debug('updateVites step: ' + i);

        let newClosePosts = await getClosePosts(i);

        if (newClosePosts) {
            closePosts = closePosts.concat(newClosePosts);

            debug('closePosts.len = ' + closePosts.length);

            await updateVites(i, newClosePosts);

            await delay();
        }
    }

    await updatePosts(closePosts);

    startTimerProcessExit();
}

updateAllData();

// ******************************** Other ********************************

/*

// let allCommentsPosts = await getCommentsPosts(openIdPosts);

allCommentsPosts.some((item) => {
    item.response.items.forEach((comment, i) => {
        // debug('\r\n comment: ', comment, '\r\n owner_id: ', item.owner_id, '\r\n post_id: ', item.post_id, '\r\n length: ', item.response.items.length);

        if ( comment.from_id == closeGroup 
            && comment.text.indexOf('Ваша оценка:') ) {
            return false;
        }

        if (item.response.items.length < 100) {
            return false;
        }

        return true;
    });
});


allCommentsPosts.forEach((item, i) => {
    // item.response.items.forEach((comment) => {
        vk.request('wall.createComment', {
            owner_id: openGroup,
            post_id: item.post_id,
            from_group: 150899833,
            message: 'Ваша оценка: ' + allCommentsPosts[i].average,
            guid: 'Ваша оценка: '
        }, (data) => {
            if (!data) {
                return resolve(false);
            }
            debug(data);
        });

        // сделать комментарий от имени группы
        // closeGroup

    // });
});


function getOpenPostsById(idPosts) {
    debug('getOpenPostsById: ', idPosts);

    return new Promise(function(resolve) {
        vk.request('wall.getById', { 
                posts: idPosts
            }, (data) => {
                if (!data) {
                    return resolve(false);
                }
                debug('! wall.getById: ', data);
            }
        );
    });
}


function getIdOpenPosts(posts) {
    let idPosts = '';

    posts.forEach((item) => {
        let id = openGroup + '_' + item.text;

        if (idPosts) {
            id = ',' + id;
        }
        idPosts += id;
    });
    return idPosts;
}
*/



/*
// Скачивание видео
// newVideo[0].attachments

let request = require('request');
request('https://vk.com/video441461955_456239195', function (err, response, body) {
    if (err) {
        debug('error:', error);
    }

    if (response) {
        // debug('statusCode:', response && response.statusCode);
    }

    if (body) {
        debug('body:', body);

        let fs = require('fs');
        let urlVideo = 'https://cs534505.vkuservideo.net//u186904430//videos//2c87caeced.480.mp4?extra=QSSkPOJsUv3sz9THnk9rLS62UBr-1Ff5LOmKtxMKz-HVNlOCC8NKKCUv9m-gy_yRSaR4GIEqVO82y4stuySyOBQ3rBxlGEORyJNDjJy1mqxkNhMrAk6nlQyYM-R_hDuA';

        request(urlVideo)
            .on('response', function(response) {
                debug(response.statusCode);
                debug(response.headers['content-type']);
            })
            .on('end', function() {
                debug('end!!!');
            })
            .on('error', function(err) {
                debug(err)
            })
            .pipe(fs.createWriteStream('testVideo'));
    }
});
*/




/*
async function test() {
        let video = [];

        vk.request('wall.get', { 
                owner_id: openGroup,
                extended: 0,
                // filter: 'others',
            }, (data) => {
                if (!data) {
                    return resolve([]);
                }
                debug('wall.get: ', data);
                debug('wall.get: ', data.response.items[0]);

                if (data && data.response && data.response.items
                    && Array.isArray(data.response.items) ) {
                    

                    data.response.items.forEach((item) => {
                        if (item && item.attachments && item.attachments[0]
                            && item.attachments[0].type && item.attachments[0].type == 'video') {
                            // debug('\r\n Open item: ', item);
                            // debug('\r\n Open item.attachments[0]: ', item.attachments[0]);
                            video.push(item);
                        }
                    });


                }

                vk.request('wall.get', { 
                        owner_id: closeGroup,
                        extended: 0,
                        filter: 'all',
                        offset: 0
                    }, async function (data) {
                        if (!data) {
                            return resolve([]);
                        }
                        debug('wall.get close : ', data);
                        debug('wall.get close [0] : ', data.response.items[0]);

                        let video2 = [];
                        

                        if (data && data.response && data.response.items
                            && Array.isArray(data.response.items) ) {

                            data.response.items.forEach((item) => {
                                if (item && item.attachments && item.attachments[0]
                                    && item.attachments[0].type && item.attachments[0].type == 'video') {
                                    video2.push(item)
                                }
                            });
                        }

                        let newVideo = await getNewPosts(video, video2);

                        // debug('************** newVideo: ', newVideo);
                        debug('************** newVideo attach[0]: ', newVideo[0].attachments);
                    }
                );


            }
        );
}

test();
*/
