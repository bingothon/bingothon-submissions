'use strict';

const Utils = require('../Utils.js');
const { validationResult } = require('express-validator/check');

module.exports = {
  update: function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
      return;
    }
    if (Utils.isAdmin(req.user)) {
      delete req.body['_csrf'];

      req.body['editor'] = req.user.id;
      let database = require.main.require('./app/database');
      database.submission.update(req.params.uuid, req.body);
    }
    res.end();
  },

  decide: async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
      return;
    }
    let database = require.main.require('./app/database');

    if (req.body.state === 1 && !(await database.submission.haveAllRunnersAccepted(req.params.uuid))) res.status(428).json({ err: 'Not all runners have accepted the race!' }).end();

    if (Utils.isAdmin(req.user)) database.submission.decide(req.params.uuid, req.body.state, req.body.reason, req.user.id);
    res.end();
  },

  updateReason: function (req, res) {
    let database = require.main.require('./app/database');
    if (Utils.isAdmin(req.user)) database.submission.updateReason(req.params.uuid, req.body.reason).then(() => res.end());
  },

  remove: function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
      return;
    }
    let database = require.main.require('./app/database');
    if (Utils.isOwner(req.user)) database.submission.remove(req.params.uuid, req.user.id);
    res.end();
  },

  visibility: function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
      return;
    }
    let database = require.main.require('./app/database');
    if (Utils.isAdmin(req.user)) database.submission.setVisibility(req.params.uuid, req.body.state);
    res.end();
  }
};
