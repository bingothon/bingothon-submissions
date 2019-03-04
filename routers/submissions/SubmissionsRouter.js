'use strict';

const AbstractRouter = require.main.require('./routers/AbstractRouter.js');

class SubmissionsRouter extends AbstractRouter {
  constructor (app, router) {
    super(app, router, '/submissions');
  }
}

module.exports = SubmissionsRouter;
