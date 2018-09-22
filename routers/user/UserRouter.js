'use strict';

const AbstractRouter = require.main.require('./routers/AbstractRouter.js');

class UserRouter extends AbstractRouter {
  constructor (app, router) {
    super(app, router, '/user');
  }
}

module.exports = UserRouter;
