const express = require('express');
const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const path = require('path');
const app = express();
const port = 3000;

let cookies = [];
try {
  const cookieData = fs.readFileSync('cookies.json', 'utf-8');
  cookies = JSON.parse(cookieData);
} catch (err) {
  console.error('Error reading cookies.json:', err);
}

const agent = ytdl.createAgent(cookies);

const requestCount = {
  count: 0,
  requests: {},
};

app.use(express.static('public'));

app.get('/ytaudio', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`Request from IP: ${clientIp} for URL: ${videoUrl}`);

  requestCount.count += 1;
  const requestId = requestCount.count;

  requestCount.requests[requestId] = {
    ip: clientIp,
    url: videoUrl,
    status: 'in-progress',
  };

  try {
    const videoId = ytdl.getVideoID(videoUrl);
    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title;
    const outputPath = path.join(__dirname, 'downloads', `${videoId}.mp3`);

    if (!fs.existsSync('downloads')) {
      fs.mkdirSync('downloads', { recursive: true });
    }

    const stream = ytdl(videoUrl, {
      filter: format => format.audioBitrate,
      quality: 'highestaudio',
      agent,
    });

    const fileStream = fs.createWriteStream(outputPath);

    let downloadedBytes = 0;

    stream.on('response', (response) => {
      const totalBytes = parseInt(response.headers['content-length'], 10);
      stream.pipe(fileStream);

      stream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const percentage = ((downloadedBytes / totalBytes) * 100).toFixed(2);

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Downloading... ${percentage}%`);
      });

      fileStream.on('finish', () => {
        console.log('\nDownload completed.');

        requestCount.requests[requestId].status = 'completed';

        setTimeout(() => {
          fs.unlink(outputPath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log(`File ${outputPath} deleted after 30 seconds.`);
            }
          });
        }, 30000);

        res.json({
          download: `http://${req.headers.host}/file?src=${videoId}.mp3`,
          title: title,
          requestCount: requestCount.count,
          requests: requestCount.requests,
        });
      });
    });

    stream.on('error', (err) => {
      console.error('Error downloading MP3:', err);
      res.status(500).json({ error: 'Error downloading MP3' });
    });

  } catch (err) {
    console.error('Error fetching video info:', err);
    res.status(500).json({ error: 'Error fetching video info' });
  }
});

app.get('/ytvideo', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`Request from IP: ${clientIp} for URL: ${videoUrl}`);

  requestCount.count += 1;
  const requestId = requestCount.count;

  requestCount.requests[requestId] = {
    ip: clientIp,
    url: videoUrl,
    status: 'in-progress',
  };

  try {
    const videoId = ytdl.getVideoID(videoUrl);
    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title;
    const outputPath = path.join(__dirname, 'downloads', `${videoId}.mp4`);

    if (!fs.existsSync('downloads')) {
      fs.mkdirSync('downloads', { recursive: true });
    }

    const stream = ytdl(videoUrl, {
      filter: format => format.container === 'mp4',
      quality: 'highestvideo',
      agent,
    });

    const fileStream = fs.createWriteStream(outputPath);

    let downloadedBytes = 0;

    stream.on('response', (response) => {
      const totalBytes = parseInt(response.headers['content-length'], 10);
      stream.pipe(fileStream);

      stream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const percentage = ((downloadedBytes / totalBytes) * 100).toFixed(2);

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Downloading... ${percentage}%`);
      });

      fileStream.on('finish', () => {
        console.log('\nDownload completed.');

        requestCount.requests[requestId].status = 'completed';

        setTimeout(() => {
          fs.unlink(outputPath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log(`File ${outputPath} deleted after 30 seconds.`);
            }
          });
        }, 30000);

        res.json({
          download: `http://${req.headers.host}/file?src=${videoId}.mp4`,
          title: title,
          requestCount: requestCount.count,
          requests: requestCount.requests,
        });
      });
    });

    stream.on('error', (err) => {
      console.error('Error downloading MP4:', err);
      res.status(500).json({ error: 'Error downloading MP4' });
    });

  } catch (err) {
    console.error('Error fetching video info:', err);
    res.status(500).json({ error: 'Error fetching video info' });
  }
});

app.get('/file', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', req.query.src);
  res.sendFile(filePath);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
//cc project jonell Magallanes 
