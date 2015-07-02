var db = require('../helpers/models');
var roles = require('./data/roles.json');
var users = require('./data/users.json');
var settings = require('./data/settings.json');
var challenges = require('./data/challenges.json');
var levels = require('../helpers/levels')(8592,8682);

var persist = function(list, model) {
  for (var r in list){
    if(list.hasOwnProperty(r)){
      model.Insert(list[r]);
    }
  }
};

db.users.DropDB(function(){
  persist(users, db.users);
  persist(settings, db.settings);
  persist(challenges, db.challenges);
  persist(levels, db.levels);
});
