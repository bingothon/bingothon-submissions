'use strict';

const AbstractWebhook = require('./AbstractWebhook');

class AuditWebhook extends AbstractWebhook {
  postMessage (data) {
    delete data.content; // Don't ping anyone
    super.postMessage(data);
  }
}

module.exports = new AuditWebhook('audit');
