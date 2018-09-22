'use strict';

class AbstractAuth {
  constructor (clientID, clientSecret) {
    if (new.target === AbstractAuth) throw new TypeError('Cannot instantiate abstract class!');

    // Contains URLs for the callback
    this.config = require('./config.json');

    // Basic options that almost (twitter >:[ )every passport strategy uses
    this.options = {
      clientID: clientID,
      clientSecret: clientSecret
    };
  }

  setup () { }
}

module.exports = AbstractAuth;
