var _hasRegistered = false;
var _app, _passport;

class AuthUtils {
  static getServerURL () {
    let database = require.main.require('./app/database');
    return database.admin.getServerURL();
  }

  static getSupportedConnections () {
    return ['twitch', 'discord', 'youtube', 'twitter'];
  }

  static getPassport () {
    if (!_hasRegistered) throw new Error('Not registered!');
    return _passport;
  }

  static getExpressApp () {
    if (!_hasRegistered) throw new Error('Not registered!');
    return _app;
  }

  static register (app, passport) {
    _app = app;
    _passport = passport;
    _hasRegistered = true;
  }
}

module.exports = AuthUtils;
