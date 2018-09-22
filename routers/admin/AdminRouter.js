'use strict';

const AbstractRouter = require.main.require('./routers/AbstractRouter.js');

class AdminRouter extends AbstractRouter {
  constructor (app, router) {
    super(app, router, '/admin');
  }
}

module.exports = AdminRouter;
