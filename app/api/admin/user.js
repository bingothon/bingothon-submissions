'use strict';

const Utils = require('../Utils.js');
const { validationResult } = require('express-validator/check');

module.exports = {
  add: function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
      return;
    }
    let database = require.main.require('./app/database');
    if (Utils.isOwner(req.user)) database.admin.addUserPermissions(req.body.id, req.body.permissions);
    res.end();
  },

  edit: function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
      return;
    }
    let database = require.main.require('./app/database');
    if (Utils.isOwner(req.body)) {
      res.status(403).end();
      return;
    }
    if (Utils.isOwner(req.user) && req.user.id !== req.body.id) database.admin.updateUserPermissions(req.body.id, req.body.permissions);
    res.end();
  },

  remove: function (req, res) {
    let database = require.main.require('./app/database');
    if (Utils.isOwner(req.body)) {
      res.status(403).end();
      return;
    }
    if (Utils.isOwner(req.user) && req.user.id !== req.body.id) database.admin.updateUserPermissions(req.body.id, 0);
    res.end();
  }
};
