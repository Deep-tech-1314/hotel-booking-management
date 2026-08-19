const https = require('https');
const fs = require('fs');
const path = require('path');

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

const main = async () => {
  try {
    console.log('Downloading video...');
    await downloadFile('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', path.join(__dirname, '../client/public/hero-video.mp4'));
    console.log('Downloading image...');
    await downloadFile('https://upload.wikimedia.org/wikipedia/commons/3/36/Hopetoun_falls.jpg', path.join(__dirname, '../client/public/about-image.jpg'));
    console.log('Downloads completed successfully!');
  } catch (error) {
    console.error('Download failed:', error);
  }
};

main();
