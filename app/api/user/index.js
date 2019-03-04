'use strict';

const submissions = require('./submissions.js');
const notifications = require('./notifications.js');

module.exports = {
  search: async function (req, res) {
    let UserDatabase = require.main.require('./app/database').user;
    let user = await UserDatabase.search(req.params.name);
    res.json(user);
  },
  setSpeedrunComUser: async function (req, res) {
    let UserDatabase = require.main.require('./app/database').user;
    UserDatabase.setSpeedrunComUser(req.user.id, req.body.username);
    res.end();
  },
  submissions: submissions,
  notifications: notifications
};
