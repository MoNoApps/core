var config = require('../config.json');

function sendMail(data, cb) {

  var sendgrid = require("sendgrid")(process.env.SENDGRID_TOKEN);
  var email = new sendgrid.Email();
  email.addTo(data.email);
  email.setFrom(config.mail.from);
  email.setSubject(data.subject);
  email.setHtml(data.html);
  sendgrid.send(email, function (error, json) {
    if (error && cb) { cb(error); }
    console.log(error, json);
  });

}

module.exports.sendMail = sendMail;
