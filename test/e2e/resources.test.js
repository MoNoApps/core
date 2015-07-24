var views = require('../../config.json').views;
var initialize = require('../helpers/initialize.helper.test');

describe('resources', function(){

  it('should CRUDS resources', function() {
    initialize(browser);

    var resourceList = element.all(by.binding('r'));
    expect(resourceList.count()).toEqual(4);

    views.forEach(function(r,i) {
      resourceList.get(i).click();
      itemList = element.all(by.repeater('f in $parent.feed'));
      itemList.count().then(function(size){
        var resName = r + new Date().getTime();
        var inputName = element(by.model('$parent.edit.name'));
        inputName.sendKeys(resName);

        element(by.css('[ng-click="$parent.create($parent.edit)"]')).click();
        var searchInput = element(by.model('$parent.search'));
        searchInput.sendKeys(resName);
        expect(searchInput.getAttribute('value')).toBe(resName);

        var itemTwiceList = element.all(by.repeater('f in $parent.feed'));
        expect(itemTwiceList.count()).toEqual(1);

        var itemBind = element.all(by.binding('f'));
        itemBind.get(0).click();
        element(by.css('[ng-click="$parent.delete()"]')).click();

        var itemAgainList = element.all(by.repeater('f in $parent.feed'));
        expect(itemAgainList.count()).toEqual(size);
      });
    });
  });

});
