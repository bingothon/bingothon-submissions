'use strict';
const { validationResult } = require('express-validator/check');

module.exports = {
  submit: async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
      return;
    }
    let database = require.main.require('./app/database');

    let eventSubmissionState = await database.event.getSubmissionState();
    if (req.user && req.user.connections.discord.username && eventSubmissionState === 1) {
      // if (!(await database.user.hasSpeedrunComUser(req.user.id))) {
      //   res.status(422).json({ msg: 'No SR.com username connected to this user!' });
      //   return;
      // }

      delete req.body['_csrf'];

      let submCount = await database.submission.count(req.user.id);
      let submLimit = await database.event.getSubmissionLimit();
      if (submCount < submLimit) database.submission.add(req.user.id, req.body);
      res.status(200).end();
    }
    else res.status(401).end();
  },

  update: async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
    } else if (req.user && req.body) {
      let database = require.main.require('./app/database');
      let eventSubmissionState = await database.event.getSubmissionState();
      let submission = await database.submission.get(req.params.uuid);
      if (submission && req.user.id === submission.userID && submission.state === 0 && (eventSubmissionState === 1 || eventSubmissionState === 2)) {
        delete req.body['_csrf'];
        database.submission.update(req.params.uuid, req.body);
        res.status(200).end();
        return;
      }
    }
    res.end();
  },

  remove: async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.status(422).json(validationResult(req).mapped());
      return;
    }
    if (req.user) {
      let database = require.main.require('./app/database');
      let submission = await database.submission.get(req.params.uuid);
      if (submission && req.user.id === submission.userID && submission.state === 0) {
        database.submission.remove(req.params.uuid);
        res.status(200).end();
        return;
      }
    }
    res.end();
  },

  decideRace: async function (req, res) {
    if (req.user) {
      let database = require.main.require('./app/database');
      let submission = await database.submission.get(req.params.uuid);
      if (req.user.id in submission.runners) {
        database.submission.decideRace(req.params.uuid, req.user.id, req.body.accepted);
        res.status(200).end();
        return;
      }
    }
    res.end();
  }
};
