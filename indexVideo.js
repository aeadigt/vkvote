let worker = require('child_process').fork(process.cwd() + '/vk_get_video.js', { silent: true, execPath: 'node' });

worker.on('error', function(err) {
    console.error('worker err: ', err);
});

worker.on('close', function(code) {
    console.log('Close worker code: ', code);
});

worker.on('message', function(msg) {
    // console.log('Worker msg: ', msg);

    try {
        let video = JSON.parse(msg);

        if ('links' in video) {
            
            video['links'].forEach((item) => {
                if (item) {
                    let video = '<iframe src="' + item + '" width="800" height="600" frameborder="0" allowfullscreen></iframe>';
                    // let video = "iframe(width='800', height='600', src=" + item + ", frameborder='0', allowfullscreen);"
                    console.log(video);
                }
            });
            
            // console.log(video['links']);
        }
    } catch (err) {
        console.log(err);
    }


});
  
//   <iframe src="https://vk.com/video_ext.php?oid=-154629793&id=456239017&hash=758d3fb558593a66&__ref=vk.api&api_hash=15106590375d2099331ec93be043_GQ2DCNBWGE4TKNI" width="800" height="600" frameborder="0" allowfullscreen></iframe>
//<iframe src="https://vk.com/video_ext.php?oid=-154629793&id=456239017&hash=758d3fb558593a66&__ref=vk.api&api_hash=1510658267f97fcccf8980560286_GQ2DCNBWGE4TKNI" width="800" height="600" frameborder="0" allowfullscreen></iframe>