'use strict';

const AbstractDatabase = require('./AbstractDatabase.js');

class NotificationDatabase extends AbstractDatabase {
  constructor () {
    super('notifications.json');
  }

  get (uuid) {
    return new Promise((resolve, reject) => {
      if (!this.database.has(uuid).value()) reject(new Error('No notification with UUID \'' + uuid + '\' found!'));
      resolve(this.database.get(uuid).cloneDeep().value());
    });
  }

  getForUser (id, username) {
    return new Promise((resolve, reject) => {
      let notifications = [];
      if (id) {
        notifications = notifications.concat(this.database.filter({ userID: id }).value());
      }
      if (username) {
        notifications = notifications.concat(this.database.filter({ username: username }).value());
      }
      notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(notifications);
    });
  }

  getUnreadCountForUser (id, username) {
    return new Promise((resolve, reject) => {
      let notificationCount = 0;
      if (id) {
        notificationCount += this.database.filter({ userID: id, read: false }).size().value();
      }
      if (username) {
        notificationCount += this.database.filter({ username: username, read: false }).size().value();
      }
      resolve(notificationCount);
    });
  }

  add (id, data) {
    let storeData = {};

    if (typeof id === 'number') {
      storeData.userID = id;
    } else if (typeof id === 'string') {
      storeData.username = id;
    } else {
      return;
    }

    let uuid = require('shortid').generate(); // Generate a uuid
    storeData.uuid = uuid;
    storeData.read = false;
    storeData.timestamp = new Date();
    storeData.data = data; // subject, content

    this.database.set(uuid, storeData).write();
  }

  remove (uuid) {
    if (!this.database.has(uuid).value()) return;

    this.database.unset(uuid).write();
  }

  setRead (uuid) {
    if (!this.database.has(uuid).value()) return;

    this.database.get(uuid).set('read', true).write();
  }

  setExecuted (uuid) {
    if (!this.database.has(uuid).value()) return;

    this.database.get(uuid).get('data').set('executed', true).write();
  }
}

module.exports = new NotificationDatabase();
