'use strict';

const TwitchAuth = require('./services/TwitchAuth.js');
const DiscordAuth = require('./services/DiscordAuth.js');
const TwitterAuth = require('./services/TwitterAuth.js');
const YoutubeAuth = require('./services/YoutubeAuth.js');

const Utils = require('./AuthUtils.js');
const supportedConnections = Utils.getSupportedConnections();

class AuthManager {
  static setupAuth (serviceName, clientID, clientSecret) {
    if (supportedConnections.indexOf(serviceName) === -1) throw new Error('Service not supported! (Internal Error)');

    switch (serviceName) {
      case 'twitch':
        let twitchAuth = new TwitchAuth(clientID, clientSecret);
        twitchAuth.setup();
        break;
      case 'discord':
        let discordAuth = new DiscordAuth(clientID, clientSecret);
        discordAuth.setup();
        break;
      case 'twitter':
        let twitterAuth = new TwitterAuth(clientID, clientSecret);
        twitterAuth.setup();
        break;
      case 'youtube':
        let youtubeAuth = new YoutubeAuth(clientID, clientSecret);
        youtubeAuth.setup();
        break;
    }
  }
}

module.exports = AuthManager;
