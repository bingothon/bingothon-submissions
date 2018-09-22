'use strict';

const admin = require('./admin');
const setup = require('./setup');
const submissions = require('./submissions');
const user = require('./user');

module.exports = {
  admin: admin,
  setup: setup,
  submissions: submissions,
  user: user
};
