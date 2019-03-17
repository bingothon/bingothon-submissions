var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var auth = require('./app/auth');
var routers = require('./routers');
var csurf = require('csurf')({ cookie: true });
var helmet = require('helmet');
var expressLocale = require('express-locale');

var app = express();

app.use(bodyParser.json());

var hbs = exphbs.create({
  helpers: require('handlebars-helpers')()
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Setup databases first
let database = require('./app/database');

function initRest () {
  auth.initialize(app);

  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self' blob:"],
      imgSrc: ['* data:'],
      mediaSrc: ['*'],
      scriptSrc: ["'self' 'unsafe-inline' www.speedrun.com blob:"],
      styleSrc: ["'self' 'unsafe-inline' https://fonts.googleapis.com/ https://fonts.gstatic.com/"],
      fontSrc: ["'self' data: https://fonts.gstatic.com"]
    }
  }));
  app.use(csurf);
  app.use(expressLocale());

  app.use(express.static('public'));

  routers.setupRouting(app, express.Router());

  if (!database.admin.isSetupDone() && !database.admin.getConnection('twitch').isSetup) {
    var password = Math.random().toString(36).substring(2);
    database.admin.setSetupPassword(password);
    console.log('The setup password is: \'' + password + '\'');
  }
}

const port = 8092;
const host = 'localhost';
app.listen(port, host, function () {
  console.log(`Started listening on port ${host}:${port}`);

  console.log('Starting rest initialization after 1 second...');

  setTimeout(initRest, 1000);
});

process.on('unhandledRejection', (reason, full) => {
  console.log(full);
});
