'use strict';

const discordURLRegex = /^https:\/\/(.*\.)?discordapp.com\/api\/webhooks\/\d*\/[A-Za-z0-9_\-)]*$/;
const AdminDatabase = require.main.require('./app/database').admin;
const request = require('request');

class AbstractWebhook {
  constructor (type) {
    this.type = type;
    this.url = AdminDatabase.getWebhookURL(this.type);
  }

  setURL (url) {
    this.url = discordURLRegex.test(url) ? url : '';
    AdminDatabase.setWebhookURL(this.type, this.url);
  }

  postMessage (data) {
    if (!discordURLRegex.test(this.url)) return;

    request.post({
      url: this.url,
      method: 'POST',
      json: true,
      body: data
    });
  }
}

// // Working demo content
// let dataNewRun = {
//   'avatar_url': 'https://placekitten.com/g/500/500',
//   'content': '<@66214870705516544>',
//   'embeds': [
//     {
//       'title': 'A new run has been submitted!',
//       'url': 'http://localhost:3000/submissions/view',
//       'description': 'バナナ (Lordmau5) has just submitted a new run!\n\n' +
//         '**Game:** Borderlands 2\n**Category:** Any%\n**Platform:** PC'
//     }
//   ]
// };

module.exports = AbstractWebhook;
