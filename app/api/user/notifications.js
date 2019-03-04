'use strict';

module.exports = {
  read: async function (req, res) {
    if (req.user) {
      let database = require.main.require('./app/database');
      let notification = await database.notification.get(req.params.uuid);
      if (req.user.id === notification.userID) {
        database.notification.setRead(req.params.uuid);
        res.status(200).end();
      }
    }
    res.end();
  },

  execute: async function (req, res) {
    if (req.user) {
      let database = require.main.require('./app/database');
      let notification = await database.notification.get(req.params.uuid);
      if (req.user.id === notification.userID) {
        database.notification.setExecuted(req.params.uuid);
        res.status(200).end();
      }
    }
    res.end();
  },

  remove: async function (req, res) {
    if (req.user) {
      let database = require.main.require('./app/database');
      let notification = await database.notification.get(req.params.uuid);
      if (req.user.id === notification.userID) {
        database.notification.remove(req.params.uuid);
        res.status(200).end();
      }
    }
    res.end();
  }
};
