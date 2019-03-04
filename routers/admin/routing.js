'use strict';

const AdminRouter = require('./AdminRouter.js');
const Utils = require.main.require('./app/utils.js');

let setupGet = function (router) {
  let database = require.main.require('./app/database');

  router.registerGet('/setup', function (req, res) {
    if (database.admin.isSetupDone()) res.redirect('/');
    else {
      if ((req.user && req.user.permissions < 3) || (!req.user && database.admin.getConnection('twitch').isSetup)) {
        return res.redirect('/maintenance');
      }
      req.data.isSetup = database.admin.isSetupDone();
      req.data.connectionSetup = {
        twitch: database.admin.isTypeSetupDone('twitch'),
        discord: database.admin.isTypeSetupDone('discord'),
        twitter: database.admin.isTypeSetupDone('twitter'),
        youtube: database.admin.isTypeSetupDone('youtube')
      };

      res.render('admin/setup', req.data);
    }
  });

  router.registerGet('/schedule', async function (req, res) {
    if (req.user && req.user.permissions >= 1) {
      req.data.submission_data = Utils.safeJSON(await database.submission.getAll());
      req.data.eventData = Utils.safeJSON(await database.event.getData());
      res.render('admin/schedule', req.data);
    } else {
      res.redirect('/');
    }
  });

  router.registerGet('/runs', async function (req, res) {
    if (req.user && req.user.permissions >= 2) {
      req.data.submission_data = Utils.safeJSON(await database.submission.getAll());
      req.data.eventData = Utils.safeJSON(await database.event.getData());
      res.render('admin/runs', req.data);
    } else {
      res.redirect('/');
    }
  });

  router.registerGet('/settings', async function (req, res) {
    if (req.user && req.user.permissions >= 3) {
      req.data.eventData = Utils.safeJSON(await database.event.getData());
      req.data.adminData = Utils.safeJSON(await database.admin.getData());
      req.data.admins = Utils.safeJSON(await database.admin.getAdmins());
      req.data.users = Utils.safeJSON(await database.user.getAllWithID());
      req.data.editable = await database.admin.getEditable();
      res.render('admin/settings', req.data);
    } else {
      res.redirect('/');
    }
  });
};

module.exports = {
  setupRouting: function (app, router) {
    let adminRouter = new AdminRouter(app, router);
    setupGet(adminRouter);
  }
};
