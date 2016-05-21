var pub = require('../helpers/ps').pub;
var sio = require('../web/routes').sio;
var conf = require('../config.json');
var events = require('./events');

function current() {
  var count = pub.get(conf.site + '::users');
  return { users: count };
}

function incUsers() {
  pub.incr(conf.site + '::users');
}

function resetUsersCount() {
  pub.set(conf.site + '::users', 0);
}

function disconnect() {
  pub.decr(conf.site + '::users');
}

function listen(cb) {

  resetUsersCount();

  function connection(socket) {

    incUsers();

    function identify(token) {
      socket.token = token;
    }

    function getUsers() {
      events.users(socket, ((err, users) => socket.emit('users', users)));
    }

    function getRoles() {
      events.roles(socket, ((err, roles) => socket.emit('roles', roles)));
    }

    socket.on('getRoles', getRoles);
    socket.on('getUsers', getUsers);
    socket.on('identify', identify);
    socket.on('disconnect', disconnect);
    socket.emit('current', current);

  }

  sio.on('connection', connection);

  cb();
}

module.exports.listen = listen;
