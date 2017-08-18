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
    if (!data) {
        return;
    }
    // Here will be server access token
    vk.setToken(data.access_token);
});

// Turn on requests with access tokens
vk.setSecureRequests(true);

// First you have to pass access_token from client side JS code
var access_token = 'b0cf28ffec9528880f3c03aebe93c54655d0cf6acb61dda4873073306df5d16d845e60396588f999d4363';
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
                filter: 'others',
                'count': 100
            }, (data) => {
                if (!data) {
                    return resolve([]);
                }
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
                'count': 100,
                offset: offset
            }, (data) => {
                if (!data) {
                    return resolve([]);
                }
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

// ******************************** delay ********************************
function delay() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 5000);
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
            // console.log('\r\n polls.create: ', data);
            // console.log('\r\n polls.create data.response.id: ', data.response.id);

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

            console.log('\r\n wall.post: ', data);

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

    console.log('\r\n alertPeoples postId: ', postId, ' members: ', members);

    members.forEach((member) => {
        if (member) {
            vk.request('messages.send', {
                user_id: member,
                attachment: 'wall' + closeGroup + '_' + postId
            }, (data) => {
                if (!data) {
                    return false;
                }
                console.log('alertPeoples data: ', data);
                return true;
            });
        }
    });


}


// ************************** update Posts **************************

async function updatePosts() {
    console.log('updatePosts step 1');
    process.send('updatePosts step 1');

    let openPosts = await getOpenPosts();
    // console.log('\r\n openPosts: ', openPosts);

    await delay();

    console.log('\r\n updatePosts step 2');
    process.send('updatePosts step 2');
    let closePosts = await getClosePosts();
    // console.log('\r\n closePosts: ', closePosts);

    await delay();

    console.log('\r\n updatePosts step 3');
    process.send('updatePosts step 3');
    let newPosts = await getNewPosts(openPosts, closePosts);
    // console.log('\r\n newPosts: ', newPosts);

    await delay();

    console.log('\r\n updatePosts step 4');
    process.send('updatePosts step 4');
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
                    // console.log(data.response);

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
    // console.log('\r\n getCommentsById: ', idPosts);
    let comments = [];

    idPosts.forEach((item) => {
        comments.push( getCommentsById(item) );
    });

    async function removeBlankRecords() {
        let allComments = await Promise.all(comments);

        allComments.push(false);

        return allComments.filter((comment) => {
            return comment;
        });
    }

    return await removeBlankRecords();
}

// ************************** getOpenIdPosts **************************
function getIdOpenPosts(posts) {
    let idPosts = [];

    posts.forEach((item) => {
        let id = { 
            owner_id: openGroup, 
            post_id: item.text, 
            average: item.poll.response.average
        };
        idPosts.push(id);
    });
    return idPosts;
}

// ************************** setVotes **************************
function setVotes(openIdPosts) {
    openIdPosts.forEach((item, i) => {
        // console.log('!!! item: ', item);

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
            console.log('wall.createComment data: ', data);
            return true;
        });
    });
}

// ************************** getRelevantComments **************************
function getRelevantComments(allCommentsPosts) {
    return allCommentsPosts.filter((item) => {
        item.response.items = item.response.items.filter((comment, i) => {
            console.log('\r\n ', item.post_id, ' \r\n comment: ', comment,
                '\r\n owner_id: ', item.owner_id, 
                '\r\n post_id: ', item.post_id, 
                '\r\n offset: ', item.offset, 
                '\r\n length: ', item.response.items.length);

            if ( comment.from_id == openGroup 
                && comment.text.indexOf('Ваша оценка:') + 1 ) {
                console.log(item.post_id, ' Есть комментарий [Ваша оценка:]. Оставляем для флага.');
                return true;
            }

            console.log(item.post_id, ' Нет комментария [Ваша оценка:]. Удалим элемент в фильтре.');
            return false;
        });

        if (item.response.items.length) {
            console.log(item.post_id, ' Есть комментарии [Ваша оценка:] Удаляем запись ', item.response.items.length);
            return false;
        } else {
            console.log(item.post_id, ' Нет комментария [Ваша оценка:]. Сохраняем запись.');
            return true;
        }
    });
}

// ************************** startTimerProcessExit **************************
function startTimerProcessExit() {
    process.send('!!!! Start Timer kill process 5 мин.');

    setTimeout(() => {
        process.send('!!!! Kill Process !!!!!');

        process.nextTick(() => {
            process.exit();
        });
    }, 60000 * 5);
}

// ************************** updateVites **************************
async function updateVites(offset) {
    offset = offset || 0;

    console.log('\r\n updateVites step 0 offset: ', offset);
    process.send('updateVites step 0 offset:');

    console.log('\r\n updateVites step 1');
    process.send('updateVites step 1');
    let closePosts = await getClosePosts(offset);
    // console.log('\r\n closePosts: ', closePosts);

    await delay();
    
    console.log('\r\n updateVites step 2');
    process.send('updateVites step 2');
    let likedClosePosts = await getLikedClosePosts(closePosts);
    // console.log('likedClosePosts: ', likedClosePosts);

    await delay();

    console.log('\r\n updateVites step 3');
    process.send('updateVites step 3');
    let averageClosePosts = await getAverageClosePosts(likedClosePosts);
    // console.log('\r\n averageClosePosts: ', averageClosePosts);

    await delay();

    let openIdPosts = getIdOpenPosts(averageClosePosts);
    console.log('\r\n openIdPosts: ', openIdPosts);
    process.send('openIdPosts: ' + openIdPosts);

    let allCommentsPosts = await getCommentsPosts(openIdPosts);
    console.log('\r\n all allCommentsPosts: ', allCommentsPosts);
    process.send('\r\n all allCommentsPosts: ' + allCommentsPosts);

    await delay();

    console.log('\r\n getRelevantComments: ');
    process.send('\r\n all getRelevantComments: ');

    allCommentsPosts = getRelevantComments();

    console.log('\r\n Not voted allCommentsPosts: ', allCommentsPosts);
    process.send('\r\n Not voted allCommentsPosts: ' + allCommentsPosts);

    setVotes(allCommentsPosts);
}

async function updateAllData() {
    members = await getMembers();

    console.log('members: ', members);

    for (let i = 0; i < 2000; i += 100) {
        console.log('i = ', i);
        process.send('start updateVites ' + i);
        await updateVites(i);
        await delay();
    }
    process.send('!!!! END SUCCESS updateVites');

    await updatePosts();
    process.send('!!!! END SUCCESS updatePosts');

    startTimerProcessExit();
}

updateAllData();

// ******************************** Other ********************************

/*

// let allCommentsPosts = await getCommentsPosts(openIdPosts);

allCommentsPosts.some((item) => {
    item.response.items.forEach((comment, i) => {
        // console.log('\r\n comment: ', comment, '\r\n owner_id: ', item.owner_id, '\r\n post_id: ', item.post_id, '\r\n length: ', item.response.items.length);

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
            console.log(data);
        });

        // сделать комментарий от имени группы
        // closeGroup

    // });
});


function getOpenPostsById(idPosts) {
    console.log('getOpenPostsById: ', idPosts);

    return new Promise(function(resolve) {
        vk.request('wall.getById', { 
                posts: idPosts
            }, (data) => {
                if (!data) {
                    return resolve(false);
                }
                console.log('! wall.getById: ', data);
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