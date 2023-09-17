const fs = require('fs');
const path = require('path');

const loadFile = (request, response, filePath, type) => {
    /** The path module's resolve func creates a File obj.
     *  The resolve func takes a dir and the rel path to a file from that dir.
     *  This does NOT load the file, but just creates a File obj based on that file.
    */
    const file = path.resolve(__dirname, filePath);

    /** The fs module’s stat func provides stats abt the file. This is an async func.
     *  The stat func takes a file obj and a callback func of what to do next.
     *  When the stat func loads the file, it will then call the callback func that's been passed in. 
    */
    fs.stat(file, (err, stats) => {
        /** The callback of this func receives an err field and a stats object. 
         *  If the err field is not null, then there was an error. In that event we will respond with an error. 
         *  If the error code is ‘ENOENT’ (Error No Entry), then the file could not be found.
         *  We will set the status code to 404.
        */
        if (err) {
            if (err.code === 'ENOENT') {
                response.writeHead(404);
            }
            return response.end(err);
        }

        let { range } = request.headers;
        if (!range) {
            range = 'bytes=0-';
        }

        const positions = range.replace(/bytes=/, '').split('-');
        let start = parseInt(positions[0], 10);
        const total = stats.size;
        const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        if (start > end) {
            start = end - 1;
        }

        const chunksize = (end - start) + 1;

        response.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': type,
        });

        const stream = fs.createReadStream(file, { start, end });
        stream.on('open', () => {
            stream.pipe(response);
        });

        stream.on('error', (streamErr) => {
            response.end(streamErr);
        });

        return stream;
    });
};

const getParty = (request, response) => {
    loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
    loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
    loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports = {
    getParty,
    getBling,
    getBird,
};
