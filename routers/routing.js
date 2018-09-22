'use strict';

const BaseRouter = require('./BaseRouter.js');
const Utils = require.main.require('./app/utils');

let setupGet = function (router) {
  let database = require.main.require('./app/database');

  router.registerGet('/', async function (req, res) {
    if (!database.admin.isSetupDone()) {
      if (req.user && req.user.permissions < 3) {
        return res.redirect('/maintenance');
      }
      res.redirect('/admin/setup');
    } else {
      req.data.eventData = Utils.safeJSON(await database.event.getData());
      res.render('index', req.data);
    }
  });

  router.registerGet('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  router.registerGet('/maintenance', function (req, res) {
    if (req.user && req.user.permissions >= 3) { // Forward the Owner back to the main page
      return res.redirect('/');
    }

    if (database.admin.isSetupDone()) res.redirect('/');

    res.render('maintenance', req.data);
  });

  router.registerGet('/about', function (req, res) {
    res.render('about', req.data);
  });
};

let setupError = function (app) {
  app.use(function (err, req, res, next) {
    if (!err) return;
    if (err.status !== 404) throw err;
    res.status(404);

    if (req.accepts('html')) {
      res.render('404', { url: req.url });
      return;
    }

    if (req.accepts('json')) {
      res.send({ error: 'Not found' });
      return;
    }

    res.type('txt').send('Not found');
  });
};

module.exports = {
  setupRouting: function (app, router) {
    let baseRouter = new BaseRouter(app, router);
    setupGet(baseRouter);
    setupError(app);
  }
};
