'use strict';

const TwitterStrategy = require('passport-twitter').Strategy;
const AbstractAuth = require('./AbstractAuth.js');
const AuthUtils = require.main.require('./app/auth/AuthUtils.js');

class TwitterAuth extends AbstractAuth {
  constructor (clientID, clientSecret) {
    super(clientID, clientSecret);

    this.options = {
      consumerKey: clientID,
      consumerSecret: clientSecret,
      callbackURL: AuthUtils.getServerURL() + this.config.urls.base + this.config.urls.twitter + this.config.urls.callback
    };
  }

  setup () {
    let verify = (accessToken, refreshToken, profile, done) => done(null, profile);

    let passport = AuthUtils.getPassport();
    passport.use(new TwitterStrategy(this.options, verify));

    let app = AuthUtils.getExpressApp();
    app.get('/' + this.config.urls.base + this.config.urls.discord, passport.authorize('twitter'));

    app.get('/' + this.config.urls.base + this.config.urls.twitter + this.config.urls.callback,
      passport.authorize('twitter', { failureRedirect: '/' + this.config.urls.base + this.config.urls.twitter + 'failure' }),
      (req, res) => {
        let UserDatabase = require.main.require('./app/database').user;
        let exists = UserDatabase.checkForConnectionSync('twitter', req.account.id);
        if (exists) {
          res.status(409).end('Selected account is already connected to a user!');
          return;
        }

        let data = {
          id: req.account.id,
          username: req.account.username,
          displayName: req.account.displayName,
          avatar: req.account.photos[0].value.replace('_normal', '_400x400')
        };

        let database = require.main.require('./app/database');
        database.user.setOrUpdateConnection(req.user.id, 'twitter', data);

        data = {
          auth: JSON.stringify({
            state: 'success',
            type: 'twitter'
          }),
          user: JSON.stringify(data)
        };
        res.render('after-auth', data);
      });

    app.get('/' + this.config.urls.base + this.config.urls.twitter + 'failure',
      (req, res) => {
        let data = {
          auth: JSON.stringify({
            state: 'failure',
            type: 'twitter'
          })
        };
        res.render('after-auth', data);
      });

    app.get('/' + this.config.urls.base + this.config.urls.twitter + this.config.urls.unlink,
      (req, res) => {
        let database = require.main.require('./app/database');
        database.user.removeConnection(req.user.id, 'twitter');

        let data = {
          auth: JSON.stringify({
            state: 'unlink',
            type: 'twitter'
          })
        };
        res.render('after-auth', data);
      });
  }
}

module.exports = TwitterAuth;
