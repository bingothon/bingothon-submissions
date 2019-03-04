'use strict';

module.exports = {
  get: async function (req, res) {
    let database = require.main.require('./app/database');
    let submission = await database.submission.get(req.params.uuid);
    if (!submission) submission = {
      error: 404,
      message: 'Couldn\'t find run with specified UUID!'
    }
    res.json(submission);
  },

  getAll: async function (req, res) {
    let database = require.main.require('./app/database');
    let submissions = await database.submission.getAll();
    res.json(submissions);
  }
};
