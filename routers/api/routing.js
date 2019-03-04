'use strict';

const APIRouter = require('./APIRouter.js');
const RateLimit = require('express-rate-limit');
const api = require.main.require('./app/api');

const validation = require('./validation');

const { body } = require('express-validator/check');

let setupGet = function (router) {
  router.registerGet('/submissions/:uuid', [validation.submissionUUID], api.submissions.get);

  router.registerGet('/submissions', api.submissions.getAll);

  router.registerGet('/user/search/:name', api.user.search);

  router.registerGet('/admin/settings/get-connection-status', api.admin.settings.getConnectionStatus);

  router.registerGet('/admin/settings/get-editable-status', api.admin.settings.getEditableStatus);

  router.registerGet('/admin/settings/download-runs-csv', api.admin.settings.downloadAllRunsAsCSV);

  router.registerGet('/admin/settings/download-runs-horaro', api.admin.settings.downloadAllRunsForHoraro);
};

let setupPost = function (router) {
  // General Setup stuff
  router.registerPost('/setup/init/:type', validation.setup.init, api.setup.init);

  // Runs stuff
  router.registerPost('/user/submissions/submit', validation.user.submissions.concat(validation.submissionIsRace), api.user.submissions.submit);

  router.registerPost('/user/submissions/:uuid/update', validation.user.submissions.concat(validation.submissionUUID), api.user.submissions.update);

  router.registerPost('/user/submissions/:uuid/remove', validation.submissionUUID, api.user.submissions.remove);

  router.registerPost('/user/submissions/:uuid/decide-race', api.user.submissions.decideRace);

  router.registerPost('/user/notifications/:uuid/read', api.user.notifications.read);

  router.registerPost('/user/notifications/:uuid/execute', api.user.notifications.execute);

  router.registerPost('/user/notifications/:uuid/remove', api.user.notifications.remove);

  router.registerPost('/user/setSpeedrunComUser', api.user.setSpeedrunComUser);

  // Admin handling
  router.registerPost('/admin/submissions/:uuid/update', validation.admin.submissions, api.admin.submissions.update);

  router.registerPost('/admin/submissions/:uuid/decide', validation.admin.decide, api.admin.submissions.decide);

  router.registerPost('/admin/submissions/:uuid/remove', validation.submissionUUID, api.admin.submissions.remove);

  router.registerPost('/admin/submissions/:uuid/visibility', validation.submissionUUID, api.admin.submissions.visibility);

  router.registerPost('/admin/submissions/:uuid/update-reason', api.admin.submissions.updateReason);

  router.registerPost('/admin/settings/reset', api.admin.settings.reset);

  router.registerPost('/admin/settings/update/:type', validation.admin.settings, api.admin.settings.update);

  router.registerPost('/admin/user/add', validation.admin.user, api.admin.user.add);

  router.registerPost('/admin/user/edit', validation.admin.user, api.admin.user.edit);

  router.registerPost('/admin/user/remove', api.admin.user.remove);
};

module.exports = {
  setupRouting: function (app, router) {
    let apiRouter = new APIRouter(app, router);
    setupGet(apiRouter);
    setupPost(apiRouter);

    app.set('json spaces', 2);

    let apiLimiter = new RateLimit({
      windowMs: 10 * 60 * 1000,
      max: 100,
      delayMs: 0
    });

    router.use('/api/', apiLimiter);
  }
};
