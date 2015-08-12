// references
var review  = require('./manager').review;
var manager = require('./manager').response;

// middleware between response and controller
var Zappy = function(props){
  this.cx = props.controller;
  this.sc = props.schema;
  this.mg = props.admin;
  this.cl = props.clean;
};

Zappy.prototype.Get = function(req, res){
  var ge = { req: req, res: res, zap: this, admin: this.mg };
  var cl = this.cl;
  review( ge, function(err, opt){
    console.log('here');
    opt.zap.cx.List({}, function(err, rsp){
      manager({req: req, res: res, err: err, rsp: rsp, clean: cl});
    });
  });
};

Zappy.prototype.GetOne = function(req, res){
  var go = { req: req, res: res, zap: this, admin: false };
  review( go, function(err, opt){
    opt.zap.cx.FindById(req.params.id, function(err, rsp){
      manager({req: req, res: res, err: err, rsp: rsp});
    });
  });
};

Zappy.prototype.Del = function(req, res){
  var de = { req: req, res: res, zap: this, admin: false };
  review( de, function(err, opt){
    opt.zap.cx.DeleteById(req.params.id, function(err, rsp){
      manager({req: req, res: res, err: err, rsp: rsp});
    });
  });
};

Zappy.prototype.Post = function(req, res){
  var po = { req: req, res: res, zap: this, admin: false };
  review( po, function(err, opt){
    delete req.params.token;
    req.params.userId = opt.user._id;
    req.params.createdAt = new Date().getTime();
    opt.zap.cx.Create(req.params, function(err, rsp){
      manager({req: req, res: res, err: err, rsp: rsp});
    });
  });
};

Zappy.prototype.Put = function(req, res){
  delete req.body._id;
  delete req.body.token;
  delete req.body.admin;
  delete req.body.userId;
  delete req.body.createdAt;
  delete req.body.updatedAt;
  delete req.body.updatedBy;

  var pu = { req: req, res: res, zap: this, admin: false, schema: true };
  review( pu, function(err, opt){
    req.params.updatedAt = new Date().getTime();
    req.params.updatedBy = opt.user._id;
    opt.zap.cx.UpdateById(req.params.id, {$set: req.body}, function(err, rsp){
      manager({req: req, res: res, err: err, rsp: rsp});
    });
  });
};

module.exports.Zappy = Zappy;
