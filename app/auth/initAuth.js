'use strict';

let passport = require('passport');
let cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');

const AuthManager = require('./AuthManager.js');

function setupAuth (app) {
  app.use(cookieParser());
  app.use(cookieSession({
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week / 7 days
    secret: 'memes'
  }));
  // Reset the session cookie when a user visits the page.
  // Only changes every hour so it's not sent with every request.
  app.use(function (req, res, next) {
    req.session.nowInMinutes = Math.floor(Date.now() / 3600e3);
    next();
  });
  app.use(passport.initialize());
  app.use(passport.session());

  let Utils = require('./AuthUtils.js');
  Utils.register(app, passport);

  passport.serializeUser((id, done) => done(null, id));

  passport.deserializeUser(async function (data, done) {
    let database = require.main.require('./app/database');
    let _data = await database.user.getByID(data.id);
    done(null, _data);
  });
}

function initAuth () {
  let connections;
  {
    let database = require.main.require('./app/database');
    connections = database.admin.getAvailableConnections();
  }

  for (let serviceName in connections) {
    let connection = connections[serviceName];

    if (connection.isSetup) {
      console.log(`${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} already finished first-time setup! Initializing...`);
      AuthManager.setupAuth(serviceName, connection.clientID, connection.clientSecret);
    }
  }
}

module.exports = function (app) {
  setupAuth(app);
  initAuth();
};
