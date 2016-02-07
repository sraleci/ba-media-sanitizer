var fs = require('fs-sync');
var node_fs = require('fs');
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

if (!fs.exists(copyMediaDir)){
  fs.mkdir(copyMediaDir);
}

glob(mediaDir + '/**/*', {nodir: true}, function(err, files) {
  async.each(files, function(file, callback) {
    var copyFile = copyMediaDir + file.replace(mediaDir, '');
    var copyFileDir = copyMediaDir + path.dirname(file).replace(mediaDir, '');

    // While 'fs-sync' is awesome, this is still necessary for image.writeFile
    if (!fs.exists(copyFileDir)) {
      fs.mkdir(copyFileDir);
    }

    if (!extensions.some(function(ext){return ext == path.extname(file);})) {
      fs.copy(file, copyFile);
      return callback(null);
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
        image.writeFile(copyFile, function(err) {
          if (!err) {
            images[width][height].push(copyFile);
          }
          callback(null);
        });
      } else {
        // Create symlink to random previously copied image
        var randomIndex = Math.floor(images[width][height].length * Math.random());
        var randomImage = images[width][height][randomIndex];
        // TODO: ensure relative symlinks
        node_fs.symlink(randomImage, copyFile, function(err) {
          callback(null);
        });
      }
    });
  });
});
