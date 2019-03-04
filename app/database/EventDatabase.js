'use strict';

const AbstractDatabase = require('./AbstractDatabase.js');

class EventDatabase extends AbstractDatabase {
  constructor () {
    super('event.json');
  }

  getData () {
    return new Promise((resolve, reject) => {
      resolve(this.database.cloneDeep().value());
    });
  }

  getInfo () {
    return new Promise((resolve, reject) => {
      resolve(this.database.get('info').value());
    });
  }

  setInfo (text) {
    this.database.set('info', text).write();
  }

  setData (data) {
    if (this.database.has('submissionState').value()) {
      data.submissionState = this.database.get('submissionState').value();
    } else {
      data.submissionState = 0;
    }

    if (this.database.has('info').value()) {
      data.info = this.database.get('info').value();
    } else {
      data.info = '';
    }

    data.submissionLimit = Number(data.submissionLimit);

    this.database.assign(data).write();
  }

  updateData (data) {
    for (let key in data) {
      let value = data[key];

      if (this.database.has(key).value()) {
        this.database.set(key, value).write();
      }
    }
  }

  getSubmissionLimit () {
    return new Promise((resolve, reject) => {
      resolve(this.database.get('submissionLimit').value());
    });
  }

  setSubmissionLimit (limit) {
    limit = Number(limit);
    this.database.set('submissionLimit', Math.max(1, limit)).write();
  }

  getSubmissionState () {
    return new Promise((resolve, reject) => {
      resolve(this.database.get('submissionState').value());
    });
  }

  setSubmissionState (state) {
    state = Number(state);
    this.database.set('submissionState', state).write();
  }
}

module.exports = new EventDatabase();
