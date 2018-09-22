'use strict';

const AbstractRouter = require.main.require('./routers/AbstractRouter.js');

class APIRouter extends AbstractRouter {
  constructor (app, router) {
    super(app, router, '/api');
  }
}

module.exports = APIRouter;
