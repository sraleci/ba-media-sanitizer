var fsSync = require('fs-sync');
var fs = require('fs-extra');
var glob = require('glob');
var lwip = require('lwip');
var path = require('path');
var commandLineArguments = require('command-line-args');

var options = commandLineArguments([
  {name: 'verbose', alias: 'v', type: Boolean},
  {name: 'batchsize', alias: 'b', type: Number},
  {name: 'samplesize', alias: 's', type: Number},
  {name: 'files', type: String, multiple: true, defaultOption: true}
]).parse();

var mediaDir = options.files[0],
    copyMediaDir = options.files[1];

if (!mediaDir || !copyMediaDir) {
  throw new Error("Must provide arguments for existing media directory and target location.");
}

var sampleSize = options.samplesize || 10,
    batchSize = options.batchsize || 100,
    verbose = options.verbose;

var images = {};
var imgExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif'
];
var blacklistExtensions = [
  '.mp3',
  '.pdf',
  '.js',
  '.css',
  '.txt',
  '.info',
  '.csv',
  '.swp',
  '.xml',
  '.html',
  '.c'
];

if (!fsSync.exists(copyMediaDir)){
  fsSync.mkdir(copyMediaDir);
}

var calculateAspectRation = function(width, height) {
  return (height == 0) ? width : calculateAspectRation(height, width%height);
}

glob(mediaDir + '/**/*', {nodir: true}, function(err, files) {
  files.forEach(function(file) {
    var copyFile = copyMediaDir + file.replace(mediaDir, '');
    var copyFileDir = copyMediaDir + path.dirname(file).replace(mediaDir, '');

    // Skip blacklisted items
    if (blacklistExtensions.some(function(ext){return ext == path.extname(file);})) {
      if (verbose) console.log("Skipping file because its extension is blacklisted: " + file);
      return;
    }

    // While 'fs-sync' is awesome, this is still necessary for image.writeFile
    if (!fsSync.exists(copyFileDir)) {
      fsSync.mkdir(copyFileDir);
    }

    // If the file is not an image file, just copy it
    if (!imgExtensions.some(function(ext){return ext == path.extname(file);})) {
      fsSync.copy(file, copyFile);
      if (verbose) console.log("Copying non-image file: " + file + " to " + copyFile);
      return;
    }

    lwip.open(file, function(err, image) {
      if (err) {
        return console.error(err);
      }

      var width = image.width(),
          height = image.height();

      var aspectRation = calculateAspectRation(width, height);

      width = width/aspectRation;
      height = height/aspectRation;

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
        if (verbose) console.log("Copying image file: " + file + " to " + copyFile);
      } else {
        // Create link to random previously copied image
        var randomIndex = Math.floor(images[width][height].length * Math.random()),
            randomImage = images[width][height][randomIndex];

        fs.link(randomImage, copyFile);
        if (verbose) console.log("Linking image file: " + randomImage + " to " + copyFile)
      }
    });
  });
});
