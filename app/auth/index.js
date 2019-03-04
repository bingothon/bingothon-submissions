'use strict';

let isInitialized = false;
let initAuth = require('./initAuth.js');
const AuthManager = require('./AuthManager.js');

module.exports = {
  initialize: function (app) {
    isInitialized = true;
    initAuth(app);
  },

  setup: function (serviceName, clientID, clientSecret) {
    if (!isInitialized) {
      throw new Error('Initialize the auth first! (Internal Error)');
    }

    AuthManager.setupAuth(serviceName, clientID, clientSecret);
  }
};
