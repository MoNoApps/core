var db = require('../helpers/models');
var settings = require('./data/settings.json');

var persist = function(list, model) {
  for (var r in list){
    if(list.hasOwnProperty(r)){
      model.Insert(list[r]);
    }
  }
};

db.roles.DropDB(function(){
  persist(settings, db.settings);
});
