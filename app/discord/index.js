'use strict';

const publicWebhook = require('./PublicWebhook');
const auditWebhook = require('./AuditWebhook');

module.exports = {
  publicWebhook: publicWebhook,
  auditWebhook: auditWebhook
};
