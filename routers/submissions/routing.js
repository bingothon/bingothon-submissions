'use strict';

const SubmissionsRouter = require('./SubmissionsRouter.js');
const Utils = require.main.require('./app/utils.js');

let setupGet = function (router) {
  let database = require.main.require('./app/database');

  router.registerGet('/submit', async function (req, res) {
    if (!database.admin.isSetupDone()) {
      if (!req.user || (req.user && req.user.permissions < 3)) {
        return res.redirect('/maintenance');
      }
    }

    if (!req.user) {
      return res.redirect('/');
    }

    req.data.canSubmit = (await database.submission.count(req.user.id)) < (await database.event.getSubmissionLimit());
    req.data.submissionState = (await database.event.getSubmissionState());
    req.data.eventData = Utils.safeJSON(await database.event.getData());
    res.render('submissions/submit', req.data);
  });

  router.registerGet('/view', async function (req, res) {
    if (!database.admin.isSetupDone()) {
      if (!req.user || (req.user && req.user.permissions < 3)) {
        return res.redirect('/maintenance');
      }
    }
    req.data.submission_data = Utils.safeJSON(await database.submission.getAll());
    req.data.eventData = Utils.safeJSON(await database.event.getData());
    res.render('submissions/view', req.data);
  });
};

let setupPost = function (router) {

};

module.exports = {
  setupRouting: function (app, router) {
    let submissionsRouter = new SubmissionsRouter(app, router);
    setupGet(submissionsRouter);
    setupPost(submissionsRouter);
  }
};
