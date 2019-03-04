'use strict';

const baseRouting = require('./routing.js');
const apiRouting = require('./api');
const adminRouting = require('./admin');
const userRouting = require('./user');
const submissionsRouting = require('./submissions');

module.exports = {
  setupRouting: function (app, router) {
    baseRouting.setupRouting(app, router);
    apiRouting.setupRouting(app, router);
    adminRouting.setupRouting(app, router);
    userRouting.setupRouting(app, router);
    submissionsRouting.setupRouting(app, router);

    // At the end here to be the last app.use for sure
    // app.use(function (req, res, next) {
    //   res.status(404);
    //   res.render('404');
    // });
  }
};
