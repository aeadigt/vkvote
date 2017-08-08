'use strict';

let Vk = require('vksdk');

let vk = new Vk({
    'appId'     : 6141200,
    'appSecret' : '6e4e86856e4e86856e4e86856e6e13339566e4e6e4e868537c7e09391da28f8edcca67f',
    'mode'      : 'oauth',
    'language'  : 'ru'
});

// Setup server access token for server API methods
vk.on('serverTokenReady', function(_o) {
    // Here will be server access token
    vk.setToken(_o.access_token);
});

// Turn on requests with access tokens
vk.setSecureRequests(true);

// Request server API method
vk.request('secure.getSMSHistory', {}, function(_dd) {
    console.log(_dd);
});

/**
 * Request client methods
 */
// First you have to pass access_token from client side JS code
vk.setToken(access_token);

// Request 'users.get' method
vk.request('users.get', {'user_id' : 1}, function(_o) {
    console.log(_o);
});