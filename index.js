var fs = require('fs');
var glob = require('glob');
var lwip = require('lwip');
var async = require('async');
var mkdirp = require('mkdirp');
var path = require('path');

var pathToMedia = process.argv[2];
var pathToCopyMedia = process.argv[3];

if (!pathToMedia || !pathToCopyMedia) {
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

if (!fs.existsSync(pathToCopyMedia)){
  fs.mkdirSync(pathToCopyMedia);
}

glob(pathToMedia + '/**/*', {nodir: true}, function(err, files) {
  async.each(files, function(file, callback) {
    var pathToCopyFile = pathToCopyMedia + file.replace(pathToMedia, '');
    var pathToCopyDir = pathToCopyMedia + path.dirname(file).replace(pathToMedia, '');

    if (!fs.existsSync(pathToCopyDir)) {
      mkdirp.sync(pathToCopyDir);
    }

    if (!extensions.some(function(ext){return ext == path.extname(file);})) {
      fs.createWriteStream(pathToCopyFile);
      return callback(null);
    }

    lwip.open(file, function(err, image) {
      if (err) {
        console.error(err);
        fs.createWriteStream(pathToCopyFile);
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
        images[width][height].push(pathToCopyFile);
        // Create new image file in new folder
        fs.createWriteStream(pathToCopyFile);
      } else {
        // Create symlink in new folder
        var randomIndex = Math.floor(images[width][height].length * Math.random());
        var randomImage = images[width][height][randomIndex];
        fs.symlink(randomImage, pathToCopyFile);
      }
    });
    callback(null);
  });
});
