var fs = require('fs');
var glob = require('glob');
var lwip = require('lwip');
var async = require('async');
var mkdirp = require('mkdirp');
var path = require('path');

var mediaDir = process.argv[2];
var copyMediaDir = process.argv[3];

if (!mediaDir || !copyMediaDir) {
  console.error("Must provide arguments for existing media directory and target location.");
}

var sampleSize = 10;
var images = {};
var extensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif'
];

if (!fs.existsSync(copyMediaDir)){
  fs.mkdirSync(copyMediaDir);
}

glob(mediaDir + '/**/*', {nodir: true}, function(err, files) {
  async.each(files, function(file, callback) {
    var copyFile = copyMediaDir + file.replace(mediaDir, '');
    var copyFileDir = copyMediaDir + path.dirname(file).replace(mediaDir, '');

    if (!fs.existsSync(copyFileDir)) {
      mkdirp.sync(copyFileDir);
    }

    if (!extensions.some(function(ext){return ext == path.extname(file);})) {
      fs.createWriteStream(copyFile);
      return callback(null);
    }

    lwip.open(file, function(err, image) {
      if (err) {
        console.error(err);
        fs.createWriteStream(copyFile);
        return;
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
        images[width][height].push(copyFile);
        // Create new image file in new folder
        fs.createWriteStream(copyFile);
      } else {
        // Create symlink in new folder
        var randomIndex = Math.floor(images[width][height].length * Math.random());
        var randomImage = images[width][height][randomIndex];
        fs.symlink(randomImage, copyFile);
      }
    });
    callback(null);
  });
});
