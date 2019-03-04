'use strict';

const AbstractWebhook = require('./AbstractWebhook');

class PublicWebhook extends AbstractWebhook {}

module.exports = new PublicWebhook('public');
