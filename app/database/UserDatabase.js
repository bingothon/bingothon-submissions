'use strict';

const AbstractDatabase = require('./AbstractDatabase.js');

const Utils = require('./DatabaseUtils.js');
const { promisify } = require('util');

class UserDatabase extends AbstractDatabase {
  constructor () {
    super('users.json');
  }

  getOrCreate (data) {
    return new Promise((resolve, reject) => {
      if (this.database.has(data.id).value()) { // User exists
        let user = this.database.get(data.id);
        user.assign({
          id: data.id,
          username: data.username,
          displayName: data.displayName,
          email: data.email,
          avatar: Utils.getAvatarOrPlaceholder(data._json.logo),
          speedrunComUser: user.get('speedrunComUser').value(),
          permissions: user.get('permissions').value(),
          connections: user.get('connections').value()
        }).write();

        resolve(this.database.get(data.id).cloneDeep().value());
      } else {  // User doesn't exist
        let AdminDatabase = require('./index.js').admin;
        let isSetupDone = AdminDatabase.isSetupDone();
        this.database.set(data.id, {
          id: data.id,
          username: data.username,
          displayName: data.displayName,
          email: data.email,
          avatar: Utils.getAvatarOrPlaceholder(data._json.logo),
          speedrunComUser: '',
          permissions: isSetupDone ? 0 : 3,
          connections: {
            discord: {},
            twitter: {},
            youtube: {}
          }
        }).write();

        resolve(this.database.get(data.id).cloneDeep().value());
      }
    });
  }

  exists (id) {
    return new Promise((resolve, reject) => {
      resolve(this.database.has(id).value());
    });
  }

  setOrUpdateConnection (id, type, data) {
    return new Promise((resolve, reject) => {
      if (this.database.has(id).value()) { // User exists
        this.database.get(id)
          .get('connections')
          .set(type, data)
          .write();

        resolve(this.database.get(id).get('connections').get(type).cloneDeep().value());
      } else {  // User doesn't exist
        reject(new Error('User doesn\'t exist'));
      }
    });
  }

  removeConnection (id, type, data) {
    if (this.database.has(id).value()) { // User exists
      this.database.get(id)
        .get('connections')
        .set(type, {})
        .write();
    }
  }

  getConnection (id, type) {
    return new Promise((resolve, reject) => {
      if (!this.database.has(id).value()) {
        reject(new Error('User doesn\'t exist'));
      } else if (!this.database.get(id).get('connections').has(type).value()) {
        // Connection does not exist
        resolve(null);
      } else {
        resolve(this.database.get(id)
          .get('connections')
          .get(type)
          .cloneDeep()
          .value());
      }
    });
  }

  checkForConnectionSync (type, id) {
    this.database
      .forEach(user => {
        if (user.connections[type].id === id) return true;
      })
      .value();
    return false;
  }

  async checkForConnection (type, id) {
    return promisify(this.checkForConnectionSync)(type, id);
  }

  getByID (id) {
    return new Promise((resolve, reject) => {
      if (this.database.has(id).value()) {
        resolve(this.database.get(id).cloneDeep().value());
      } else {
        let AdminDatabase = require('./index.js').admin;
        if (AdminDatabase.isSetupDone()) {
          reject(new Error('No user found! This should never happen!'));
        } else {
          resolve(null);
        }
      }
    });
  }

  getAllWithID () {
    return new Promise((resolve, reject) => {
      let returnUsers = [];
      let users = this.database.value();
      for (let i in users) {
        let u = users[i];
        returnUsers.push({
          id: u.id,
          displayName: u.displayName
        });
      }

      resolve(returnUsers);
    });
  }

  search (name) {
    return new Promise((resolve, reject) => {
      name = name.toLowerCase();

      let returnUsers = [];
      let users = this.database.cloneDeep().value();
      for (let i in users) {
        let u = users[i];

        if (u.username.toLowerCase().indexOf(name) !== -1 || u.displayName.toLowerCase().indexOf(name) !== -1 || u.speedrunComUser.toLowerCase().indexOf(name) !== -1) {
          returnUsers.push({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            speedrunComUser: u.speedrunComUser
          });
        }
      }

      resolve(returnUsers);
    });
  }

  setSpeedrunComUser (id, username) {
    return new Promise(async (resolve, reject) => {
      username = username.toLowerCase();

      if (await this.exists(id)) {
        this.database.get(id).set('speedrunComUser', username).write();
        resolve();
      } else {
        reject(new Error('No user with that ID was found!'));
      }
    });
  }

  hasSpeedrunComUser (id) {
    return new Promise((resolve, reject) => {
      if (!this.exists(id)) reject(new Error('No user with that ID was found!'));
      else if (this.database.get(id).get('speedrunComUser').value()) resolve(true);
      else resolve(false);
    });
  }
}

module.exports = new UserDatabase();
