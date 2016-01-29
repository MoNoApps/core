var db = require('../helpers/models');
var settings = require('./data/settings.json');

function persist (list, model) {
  for (var r in list){
    if(list.hasOwnProperty(r)){
      model.Insert(list[r]);
    }
  }
};

function updateSettings () {
  persist(settings, db.settings);
}

db.settings.DropCollection(updateSettings);

