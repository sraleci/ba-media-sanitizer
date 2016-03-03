var fsSync = require('fs-sync');
var fs = require('fs');
var glob = require('glob');
var lwip = require('lwip');
var path = require('path');

var mediaDir = process.argv[2];
var copyMediaDir = process.argv[3];

if (!mediaDir || !copyMediaDir) {
  throw new Error("Must provide arguments for existing media directory and target location.");
}

var sampleSize = 10;
var images = {};
var imgExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif'
];
var blacklistExtensions = [
//  '.css'
];

if (!fsSync.exists(copyMediaDir)){
  fsSync.mkdir(copyMediaDir);
}

glob(mediaDir + '/**/*', {nodir: true}, function(err, files) {
  files.forEach(function(file) {
    var copyFile = copyMediaDir + file.replace(mediaDir, '');
    var copyFileDir = copyMediaDir + path.dirname(file).replace(mediaDir, '');

    // Skip blacklisted items
    if (blacklistExtensions.some(function(ext){return ext == path.extname(file);})) {
      return;
    }

    // While 'fs-sync' is awesome, this is still necessary for image.writeFile
    if (!fsSync.exists(copyFileDir)) {
      fsSync.mkdir(copyFileDir);
    }

    // If the file is not an image file, just copy it
    if (!imgExtensions.some(function(ext){return ext == path.extname(file);})) {
      fsSync.copy(file, copyFile);
      return;
    }

    lwip.open(file, function(err, image) {
      if (err) {
        return console.error(err);
      }

      var width = image.width(),
          height = image.height();
      if (!images.hasOwnProperty(width)) {
        images[width] = {};
      }
      if (!images[width].hasOwnProperty(height)) {
        images[width][height] = [];
      }

      if (images[width][height].length < sampleSize) {
        // Copy image
        images[width][height].push(copyFile);
        fsSync.copy(file, copyFile);
      } else {
        // Create link to random previously copied image
        var randomIndex = Math.floor(images[width][height].length * Math.random()),
            randomImage = images[width][height][randomIndex];

        fs.link(randomImage, copyFile);
      }
    });
  });
});
