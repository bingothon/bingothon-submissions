'use strict';

class AbstractRouter {
  constructor (app, router, relativePath = '') {
    if (new.target === AbstractRouter) throw new TypeError('Abstract class cannot be instantiated!');
    this.app = app;
    this.router = router;
    this.relativePath = relativePath;

    this.router.use(async function (req, res, next) {
      req.data = {
        profile: req.user,
        csrfToken: req.csrfToken()
      };

      if (req.user) {
        let NotificationDatabase = require.main.require('./app/database').notification;
        req.data.notificationCount = await NotificationDatabase.getUnreadCountForUser(req.user.id, req.user.username);
      }

      next();
    });
  }

  registerGet (relativeUrl, ...callbacks) {
    this.app.get(this.relativePath + relativeUrl, this.router, callbacks);
  }

  registerPost (relativeUrl, ...callbacks) {
    this.app.post(this.relativePath + relativeUrl, this.router, callbacks);
  }
}

module.exports = AbstractRouter;
