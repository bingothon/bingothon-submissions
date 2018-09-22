'use strict';

const admin = require('./AdminDatabase');
const event = require('./EventDatabase');
const user = require('./UserDatabase');
const submission = require('./SubmissionDatabase');
const notification = require('./NotificationDatabase');

module.exports = {
  admin: admin,
  event: event,
  user: user,
  submission: submission,
  notification: notification
};
