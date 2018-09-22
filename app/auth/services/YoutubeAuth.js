'use strict';

const YoutubeStrategy = require('passport-youtube-v3').Strategy;
const AbstractAuth = require('./AbstractAuth.js');
const AuthUtils = require.main.require('./app/auth/AuthUtils.js');

class YoutubeAuth extends AbstractAuth {
  constructor (clientID, clientSecret) {
    super(clientID, clientSecret);

    this.options.scope = 'https://www.googleapis.com/auth/youtube.readonly';
    this.options.callbackURL = AuthUtils.getServerURL() + this.config.urls.base + this.config.urls.youtube + this.config.urls.callback;
  }

  setup () {
    let verify = (accessToken, refreshToken, profile, done) => done(null, profile);

    let passport = AuthUtils.getPassport();
    passport.use(new YoutubeStrategy(this.options, verify));

    let app = AuthUtils.getExpressApp();
    app.get('/' + this.config.urls.base + this.config.urls.youtube, passport.authorize('youtube'));

    app.get('/' + this.config.urls.base + this.config.urls.youtube + this.config.urls.callback,
      passport.authorize('youtube', { failureRedirect: '/' + this.config.urls.base + this.config.urls.youtube + 'failure' }),
      (req, res) => {
        let UserDatabase = require.main.require('./app/database').user;
        let exists = UserDatabase.checkForConnectionSync('youtube', req.account.id);
        if (exists) {
          res.status(409).end('Selected account is already connected to a user!');
          return;
        }

        let data = {
          id: req.account.id,
          displayName: req.account.displayName,
          avatar: req.account._json.items[0].snippet.thumbnails.high.url
        };

        let database = require.main.require('./app/database');
        database.user.setOrUpdateConnection(req.user.id, 'youtube', data);

        data = {
          auth: JSON.stringify({
            state: 'success',
            type: 'youtube'
          }),
          user: JSON.stringify(data)
        };
        res.render('after-auth', data);
      });

    app.get('/' + this.config.urls.base + this.config.urls.youtube + 'failure',
      (req, res) => {
        let data = {
          auth: JSON.stringify({
            state: 'failure',
            type: 'youtube'
          })
        };
        res.render('after-auth', data);
      });

    app.get('/' + this.config.urls.base + this.config.urls.youtube + this.config.urls.unlink,
      (req, res) => {
        let database = require.main.require('./app/database');
        database.user.removeConnection(req.user.id, 'youtube');

        let data = {
          auth: JSON.stringify({
            state: 'unlink',
            type: 'youtube'
          })
        };
        res.render('after-auth', data);
      });
  }
}

module.exports = YoutubeAuth;
