'use strict';

const DiscordStrategy = require('passport-discord').Strategy;
const AbstractAuth = require('./AbstractAuth.js');
const AuthUtils = require.main.require('./app/auth/AuthUtils.js');

class DiscordAuth extends AbstractAuth {
  constructor (clientID, clientSecret) {
    super(clientID, clientSecret);

    this.options.scope = 'identify';
    this.options.callbackURL = AuthUtils.getServerURL() + this.config.urls.base + this.config.urls.discord + this.config.urls.callback;
  }

  setup () {
    let verify = (accessToken, refreshToken, profile, done) => done(null, profile);

    let passport = AuthUtils.getPassport();
    passport.use(new DiscordStrategy(this.options, verify));

    let app = AuthUtils.getExpressApp();
    app.get('/' + this.config.urls.base + this.config.urls.discord, passport.authorize('discord'));

    app.get('/' + this.config.urls.base + this.config.urls.discord + this.config.urls.callback,
      passport.authorize('discord', { failureRedirect: '/' + this.config.urls.base + this.config.urls.discord + 'failure' }),
      (req, res) => {
        let UserDatabase = require.main.require('./app/database').user;
        let exists = UserDatabase.checkForConnectionSync('discord', req.account.id);
        if (exists) {
          res.status(409).end('Selected account is already connected to a user!');
          return;
        }

        let data = {
          id: req.account.id,
          username: req.account.username,
          discriminator: req.account.discriminator,
          avatar: `https://cdn.discordapp.com/avatars/${req.account.id}/${req.account.avatar}.png?size=256`
        };

        let database = require.main.require('./app/database');
        database.user.setOrUpdateConnection(req.user.id, 'discord', data);

        data = {
          auth: JSON.stringify({
            state: 'success',
            type: 'discord'
          }),
          user: JSON.stringify(data)
        };
        res.render('after-auth', data);
      });

    app.get('/' + this.config.urls.base + this.config.urls.discord + 'failure',
      (req, res) => {
        let data = {
          auth: JSON.stringify({
            state: 'failure',
            type: 'discord'
          })
        };
        res.render('after-auth', data);
      });

    app.get('/' + this.config.urls.base + this.config.urls.discord + this.config.urls.unlink,
      (req, res) => {
        let database = require.main.require('./app/database');
        database.user.removeConnection(req.user.id, 'discord');

        let data = {
          auth: JSON.stringify({
            state: 'unlink',
            type: 'discord'
          })
        };
        res.render('after-auth', data);
      });
  }
}

module.exports = DiscordAuth;
