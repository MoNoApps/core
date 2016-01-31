[![Code Climate](https://codeclimate.com/github/MoNoApps/core/badges/gpa.svg)](https://codeclimate.com/github/MoNoApps/core)
[![Test Coverage](https://codeclimate.com/github/MoNoApps/core/badges/coverage.svg)](https://codeclimate.com/github/MoNoApps/core/coverage)
[![Circle CI](https://circleci.com/gh/MoNoApps/core.svg?style=svg)](https://circleci.com/gh/monoapps/core)

# core tools
Dynamic CRUD in seconds with good code quality and NoSQL flexibility.
## ready to use
- Email registry
- Account edit form
- User Management
- Bootswatch themes
- Password change form
- Access by token
- Web responsive
- Flexible/Extensible with plugins
- Android app ready
- Continuous integration (mocha, protractor)
- JS and CSS minify
- AngularJS FrontEnd
- Socket.IO ready
- Templates support with jade lang
- Sanbox mode
- Form generation automatic

## CoC
Configuration over Convention.<br>
Know and edit the configuration of the project and control the foundations.
````sh
vi config.json
````
### database
Main database of the project. Every plugin has their own db url.
````js
"dburl": "mongodb://127.0.0.1/core"
````
### application name
````js
"site": "Core App"
````
### ports
````js
"port": {
  "web": 1344,
  "api": 1345,
  "rds": 6379
}
````
### index
Change the index file editing the INDEX property.<br>
By default app search files in 'view' folder but you can write relative or absolute paths.
````js
"INDEX": "plugins/plugin-name/folder/file.jade"
````
### email
Create an account on mandril and add your token.
````js
"mandril":{
  "from": "noreply@core.monoapps.co",
  "name": "Core App",
  "token": "YOUR TOKEN HERE"
}
````
Testing your email configuration.
`````sh
node examples/ping.mandril.js
`````
### website info
````js
"URL": {
  "BASE": "http://core.monoapps.co",
  "ACK": "/api/email/confirm/"
}
````
### variables
````js
"APIVARS": {
  "PRE": "/",
  "ID": "/:id",
  "PLUGINS": { // plugins definition for core
    "DIR":"/plugins", // base folder for plugins
    "MAIN": "/plugin.js", // main file per plugins
    "VIEWS": "/views", // views folder of the plugins
    "CONFIG": "/config.json" // configuration file of the plugins
  }
}
````
### pugins

````js
#config.json
32"plugins": [
  "wizard" // github submodule on plugins folder
33]
````

### pages
Public pages. Unrestricted access and main file located at {name}/index.jade
````js
"pages":[
  "account",
  "recover",
  "registered",
  "docs",
  "dev"]
````
### resources
One json definition for models/api/views/cruds.
````js
"resources": {
  "rname": {
    "admin": true, // filter, indicates that only (user.admin = true) is able to access this info
    "param": "token", // name of the param in single
    "clean": {"password": 1}, // filter to hide keys on the view
    "exclude": false, // Indicates to include or not in the view, if false the model can be access but without api or web routes
    "schema": { // filter for specific params from view form hat will be accepted
      "name":  1,
      ... // more keys
    }
  }
  ...
}
````
### helpers
We have written a lot of filters like:
````sh
helpers/filters.js # admin, schema, author, cleaner
helpers/base.js # controller base who knows his own model
helpers/email.js # send emails
helpers/generator.js # add api and web (pages[no auth] and views[auth crud view])
helpers/inspector.js # helper for dynamic plugin creation
helper/manager.js # filter auth request and prepare response
helpers/models.js # helper for models defined on plugins and core
helpers/ps.js # helper for redis pub/sub
helpers/utils.js # helper for password and auth
helpers/zappy.js # middleware between response and controller
````

## migrations
`````sh
Updates are welcome. DropDB or DropCollection need a review.
node migrations/seed.js
# drop current database and insert all defaults
`````
Add your own data
````js
#Roles must be defined in config.json
#Replace 'collection' with your new model
var #{collection} = require('migrations/data/#{collection}.json');
persist(#{collection}, db.#{collection});
````

## update github modules
````sh
./refresh.sh
````

## form code generator
Add your missing forms.
````sh
# Run wizard to create forms
gulp autoform
````

Enable autoform by default
````json
//config.json
autofom: true
````

## menu
````js
// vi migrations/data/settings.json
"user": ["tasks"] // menu for normal user
"admin": ["users"] // menu for admin user
````

## themes
````js
// vi migrations/data/settings.json
"themes": [{"name": "the name", "css": "{URL}.min.css" }]
````

## user management
Add the guest user.

````json
//config.json
#This will show the button to enter as guest.
#Be carrefoul with this because user and passw will be visible.
#Do not enable unless you really want all allow access to the whole world.
guest.enabled = true;
````
````js
node migrations/guest.js
````
Create normal users: register your own email.</br>
Be admin just setting something like:
````sh
mongo
>use coreapp
>db.users.update({email: 'admin@monoapps.co', admin: true});
````

## writing plugins
See [wizard sample](https://github.com/MoNoApps/wizard)<br>
Add plugins on config.plugins.

## sanbox
Prevent visibility enabling the trusted mode

````js
# web/routes.js
18 web.use(middleware.trusted);
````
Write your allowed ips.
````js
#config.js
15   "ALLOW": ["127.0.0.1"],
````

## coverage
````sh
npm install istanbul mocha-istanbul -g
make cov
````

## deploy
Use [nginx config](core.conf) to deploy. If needed add the hostname domains on /etc/hosts file.
