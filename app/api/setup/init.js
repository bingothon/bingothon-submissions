'use strict';

const Utils = require('../Utils.js');
const { validationResult } = require('express-validator/check');

module.exports = function (req, res) {
  let database = require.main.require('./app/database');
  let data = req.body;
  let type = req.params.type;

  delete data['_csrf'];

  if (type === 'marathon' && Utils.isOwner(req.user)) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
      return;
    }

    database.admin.setWebhookURL('public', data.webhooks.public);
    database.admin.setWebhookURL('audit', data.webhooks.audit);

    delete data.webhooks;
    database.event.setData(data);
    database.admin.setSetupDone();

    res.end();
  } else if (type === 'twitch') {
    if (data.setupPassword === database.admin.getSetupPassword()) {
      database.admin.setServerURL(data.serverURL);
      require.main.require('./app/auth').setup(type, data.clientID, data.clientSecret);
      database.admin.setTypeData(type, data);

      res.end();
    } else res.status(400).end();
  } else if (Utils.isOwner(req.user)) {
    let auth = require.main.require('./app/auth');
    auth.setup(type, data.clientID, data.clientSecret);
    database.admin.setTypeData(type, data);

    res.end();
  }
};
