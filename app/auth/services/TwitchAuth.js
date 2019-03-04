'use strict';

const TwitchStrategy = require('passport-twitch').Strategy;
const AbstractAuth = require('./AbstractAuth.js');
const AuthUtils = require.main.require('./app/auth/AuthUtils.js');

class TwitchAuth extends AbstractAuth {
  constructor (clientID, clientSecret) {
    super(clientID, clientSecret);

    this.options.scope = 'user_read';
    this.options.callbackURL = AuthUtils.getServerURL() + this.config.urls.base + this.config.urls.twitch + this.config.urls.callback;
  }

  setup () {
    let verify = function (accessToken, refreshToken, profile, done) {
      let database = require.main.require('./app/database');
      database.user.getOrCreate(profile).then(
        data => done(null, data),
        error => done(error));
    };

    let passport = AuthUtils.getPassport();
    passport.use(new TwitchStrategy(this.options, verify));

	let app = AuthUtils.getExpressApp();
    app.get('/' + this.config.urls.base + this.config.urls.twitch, passport.authenticate('twitch'));

    app.get('/' + this.config.urls.base + this.config.urls.twitch + this.config.urls.callback,
      passport.authenticate('twitch', { successRedirect: '/' + this.config.urls.base + this.config.urls.twitch + 'success', failureRedirect: '/' + this.config.urls.base + this.config.urls.twitch + 'failure' }));
    app.get('/' + this.config.urls.base + this.config.urls.twitch + 'success',
      (req, res) => {
        let data = {
          auth: JSON.stringify({
            state: 'success',
            type: 'twitch'
          }),
          user: JSON.stringify(req.user)
        };
        res.render('after-auth', data);
      });
    app.get('/' + this.config.urls.base + this.config.urls.twitch + 'failure',
      (req, res) => {
        let data = {
          auth: JSON.stringify({
            state: 'success',
            type: 'twitch'
          })
        };
        res.render('after-auth', data);
      });
  }
}

module.exports = TwitchAuth;
