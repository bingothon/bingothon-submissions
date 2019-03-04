'use strict';

const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

class AbstractDatabase {
  constructor (fileName, defaults) {
    if (new.target === AbstractDatabase) throw new TypeError('Cannot instantiate abstract class!');

    if (!fs.existsSync('./db')) fs.mkdirSync('./db');

    let adapter = new FileSync('./db/' + fileName);
    this.database = lowdb(adapter);
    if (defaults) {
      this.database.defaults(defaults).write();
    }
  }
}

module.exports = AbstractDatabase;
