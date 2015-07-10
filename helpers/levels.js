var shuffle = require('../helpers/utils').shuffle;

var level = function(first, last) {
  var range = [];
  var boards = [];

  for(var i=first; i<last+1; i++) {
    range.push({c: String.fromCharCode(i), o: i});
  }

  var ll = range.length-7;
  for(var j=0; j<ll; j++) {
    var board = range.slice(0,8);
    boards.push({board: shuffle(board.concat(board))});
    range.shift();
  }

  return boards;
};

// A: 8592,8682 ; B: 9728,9840, C: 10033,10057; D: 13312,13711

module.exports = level;
