'use strict';

const UserRouter = require('./UserRouter.js');
const Utils = require.main.require('./app/utils.js');

let setupGet = function (router) {
  let database = require.main.require('./app/database');

  router.registerGet('/submissions', async function (req, res) {
    if (req.user) {
      req.data.submission_data = Utils.safeJSON(await database.submission.getByUser(req.user.id));
      req.data.eventData = Utils.safeJSON(await database.event.getData());
      req.data.editable = await database.admin.getEditableCurrent();
      res.render('user/submissions', req.data);
    } else {
      res.redirect('/');
    }
  });

  router.registerGet('/connections', async function (req, res) {
    if (req.user) {
      res.render('user/connections', req.data);
    } else {
      res.redirect('/');
    }
  });

  router.registerGet('/notifications', async function (req, res) {
    if (req.user) {
      req.data.notifications = Utils.safeJSON(await database.notification.getForUser(req.user.id, req.user.username));
      res.render('user/notifications', req.data);
    } else {
      res.redirect('/');
    }
  });
};

let setupPost = function (router) {

};

module.exports = {
  setupRouting: function (app, router) {
    let userRouter = new UserRouter(app, router);
    setupGet(userRouter);
    setupPost(userRouter);
  }
};
