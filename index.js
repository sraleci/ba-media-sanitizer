var fs = require('fs');
var glob = require('glob');
var lwip = require('lwip');

var pathToMedia = process.argv[2];
var pathToCopyMedia = process.argv[3];
var sampleSize = 10;
var images = {};
var extensions = [/.*\.png/i,/.*\jpg/i];

console.log(pathToCopyMedia);
if (!fs.existsSync(pathToCopyMedia)){
  fs.mkdirSync(pathToCopyMedia); 
}

var globOptions = {
  'nodir': true
};

glob(pathToMedia + '/**/*', globOptions, function(err, files) {
  var processed = 0;
  files.forEach(function(file) {
    //todo create white list of image files
    if(extensions.every(function(regex){return !file.match(regex);})) {
      fs.createWriteStream(pathToCopyMedia + '/' + file);
      return;
    }
    lwip.open(file, function(err, image) {
      if (err) {
        console.error(err)
        fs.createWriteStream(pathToCopyMedia + '/' + file);
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
        images[width][height].push(file);
        // Create new image file in new folder
        fs.createWriteStream(pathToCopyMedia + '/' + file);
      } else {
        // Create symlink in new folder
        var randomImage = images[width][height][Math.floor(images[width][height].length * Math.random)];
        fs.symlink(pathToCopyMedia + '/' + randomImage, pathToCopyMedia + '/' + file);

      }
    });
  });
});
