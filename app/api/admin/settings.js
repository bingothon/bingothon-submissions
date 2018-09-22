'use strict';

const Utils = require('../Utils.js');
const { validationResult } = require('express-validator/check');

module.exports = {
  reset: function (req, res) {
    let database = require.main.require('./app/database');
    if (Utils.isOwner(req.user)) database.admin.resetSettings();
    res.end();
  },

  update: function (req, res) {
    switch (req.params.type) {
      case 'submissions': {
        if (!validationResult(req).isEmpty()) {
          res.status(422).json(validationResult(req).mapped());
          return;
        }
        let EventDatabase = require.main.require('./app/database').event;
        if (Utils.isOwner(req.user)) {
          EventDatabase.setSubmissionLimit(req.body.submissionLimit);
          EventDatabase.setSubmissionState(req.body.submissionState);
        }
        break;
      }
      case 'event-info': {
        let EventDatabase = require.main.require('./app/database').event;
        if (Utils.isOwner(req.user)) {
          EventDatabase.setInfo(req.body.info);
        }
        break;
      }
      case 'event-data': {
        let DiscordWebhooks = require.main.require('./app/discord');
        let EventDatabase = require.main.require('./app/database').event;
        if (Utils.isOwner(req.user)) {
          EventDatabase.updateData(req.body.data);
          DiscordWebhooks.publicWebhook.setURL(req.body.data.publicWebhook);
          DiscordWebhooks.auditWebhook.setURL(req.body.data.auditWebhook);
        }
        break;
      }
      case 'editable': {
        let AdminDatabase = require.main.require('./app/database').admin;

        let data = req.body;
        for (let stage = 0; stage <= 3; stage++) {
          let stageSettings = data[stage];
          for (let key in stageSettings) {
            if (stageSettings[key] !== false && stageSettings[key] !== true) {
              res.end();
              return;
            }
          }
        }

        if (Utils.isOwner(req.user)) {
          AdminDatabase.setEditable(data);
        }
        break;
      }
    }
    res.end();
  },

  getEditableStatus: function (req, res) {
    let database = require.main.require('./app/database');
    let stage = req.query['submission-stage'];

    if (Utils.isAdmin(req.user)) {
      res.json(database.admin.getEditable(stage));
    }
  },

  getConnectionStatus: function (req, res) {
    let database = require.main.require('./app/database');
    let type = req.query.type;
    let connection = database.admin.getConnection(type);

    if (!type) res.json({ err: 'Please specify a type!' });
    else if (!connection) {
      res.json({
        connectionType: type,
        isSetup: false,
        err: 'Connection does not exist!'
      });
    } else {
      res.json({
        connectionType: type,
        isSetup: connection.isSetup
      });
    }
  },

  downloadAllRunsAsCSV: function (req, res) {
    if (Utils.isOwner(req.user)) {
      let AdminDatabase = require.main.require('./app/database').admin;
      AdminDatabase.allRunsAsCSV().then(didItWork => {
        if (didItWork) {
          res.download('./output/runs.csv');
        }
      });
    } else {
      res.end();
    }
  },

  downloadAllRunsForHoraro: function (req, res) {
    if (Utils.isOwner(req.user)) {
      let AdminDatabase = require.main.require('./app/database').admin;
      AdminDatabase.allRunsToHoraro().then(didItWork => {
        if (didItWork) {
          res.download('./output/horaro.csv');
        }
      });
    } else {
      res.end();
    }
  }
};
