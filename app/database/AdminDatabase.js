'use strict';

const AbstractDatabase = require('./AbstractDatabase.js');

class AdminDatabase extends AbstractDatabase {
  constructor () {
    super('admin.json', {
      serverURL: '',
      isSetupDone: false,
      setupPassword: '',
      connections: {
        twitch: {
          clientID: '',
          clientSecret: '',
          isSetup: false
        },
        discord: {
          clientID: '',
          clientSecret: '',
          isSetup: false
        },
        twitter: {
          clientID: '',
          clientSecret: '',
          isSetup: false
        },
        youtube: {
          clientID: '',
          clientSecret: '',
          isSetup: false
        }
      },
      webhooks: {
        public: '',
        audit: ''
      },
      settings: {
        editable: {
          0: {
            // Placeholder, you shouldn't be able to havy any submissions when submissions are not open yet
            game: true,
            platform: true,
            region: true,
            category: true,
            estimate: true,
            video: true,
            availability: true,
            incentives: true,
            comments: true
          },
          1: {
            game: true,
            platform: true,
            region: true,
            category: true,
            estimate: true,
            video: true,
            availability: true,
            incentives: true,
            comments: true
          },
          2: {
            game: true,
            platform: true,
            region: true,
            category: true,
            estimate: true,
            video: true,
            availability: true,
            incentives: true,
            comments: true
          },
          3: {
            game: false,
            platform: false,
            region: false,
            category: false,
            estimate: false,
            video: true,
            availability: false,
            incentives: false,
            comments: true
          }
        }
      }
    });
  }

  getEditable (submissionStage = null) {
    if (submissionStage && submissionStage >= 0 && submissionStage <= 3) return this.database.get('settings.editable.' + submissionStage).value();
    else return this.database.get('settings.editable').value();
  }

  async getEditableCurrent () {
    let EventDatabase = require('./index.js').event;
    return this.getEditable(await EventDatabase.getSubmissionState());
  }

  setEditable (data, submissionStage) {
    return new Promise((resolve, reject) => {
      if (!submissionStage) this.database.get('settings.editable').assign(data).write();
      else if (submissionStage < 0 || submissionStage > 3) reject(new Error('Submission stage outside of range!'));
      else this.database.get('settings.editable.' + submissionStage).assign(data).write();
      resolve();
    });
  }

  getData () {
    return new Promise((resolve, reject) => {
      resolve(this.database.cloneDeep().value());
    });
  }

  getAdmins () {
    return new Promise((resolve, reject) => {
      let UserDatabase = require('./index.js').user;
      resolve(UserDatabase.database.filter(function (e) { return e.permissions > 0; }).value());
    });
  }

  isSetupDone () {
    return this.database.get('isSetupDone').value();
  }

  setSetupDone () {
    this.database.set('isSetupDone', true)
      .write();
  }

  isTypeSetupDone (type) {
    return this.database.get('connections').has(type).value() && this.database.get('connections').get(type).get('isSetup').value();
  }

  getSetupPassword () {
    return this.database.get('setupPassword').value();
  }

  setSetupPassword (password) {
    this.database.set('setupPassword', password)
      .write();
  }

  getAvailableConnections () {
    return this.database.get('connections').value();
  }

  getConnection (type) {
    let supportedConnections = require.main.require('./app/auth/AuthUtils.js').getSupportedConnections();
    if (supportedConnections.indexOf(type) !== -1) return this.database.get('connections.' + type).cloneDeep().value();
    return null;
  }

  getServerURL () {
    return this.database.get('serverURL').value();
  }

  setServerURL (url) {
    this.database.set('serverURL', url)
      .write();
  }

  setTypeData (type, data) {
    this.database.get('connections.' + type)
      .assign({
        clientID: data.clientID,
        clientSecret: data.clientSecret,
        isSetup: true
      })
      .write();
  }

  addUserPermissions (id, permissions) {
    let UserDatabase = require('./index.js').user;

    if (UserDatabase.database.has(id).value() && UserDatabase.database.get(id).get('permissions').value() === 0) {
      let permission = Math.max(0, Math.min(3, permissions));

      UserDatabase.database.get(id)
        .set('permissions', permission)
        .write();
    }
  }

  updateUserPermissions (id, permissions) {
    let UserDatabase = require('./index.js').user;

    if (UserDatabase.database.has(id).value()) {
      let permission = Math.max(0, Math.min(3, permissions));

      UserDatabase.database.get(id)
        .set('permissions', permission)
        .write();
    }
  }

  resetSettings () {
    let supportedConnections = require.main.require('./app/auth/AuthUtils.js').getSupportedConnections();
    for (var i = 0; i < supportedConnections.length; i++) {
      var type = supportedConnections[i];
      this.database.get('connections.' + type)
        .set('isSetup', false)
        .write();
    }

    this.database.set('isSetupDone', false)
      .write();

    let password = Math.random().toString(36).substring(2);
    // this SHOULD work
    this.setSetupPassword(password);
    console.log('The setup password is: \'' + password + '\'');
  }

  getWebhookURL (type) {
    if (!this.database.get('webhooks').has(type).value()) return false;

    return this.database.get('webhooks').get(type).value();
  }

  setWebhookURL (type, url) {
    if (!this.database.get('webhooks').has(type).value()) return;

    this.database.get('webhooks').set(type, url).write();
  }

  allRunsAsCSV () {
    return new Promise(async (resolve, reject) => {
      let stringify = require('csv-stringify');

      let columns = [
        'UUID', 'Date', 'Runner', 'Game', 'Category', 'Is Race', 'Estimate', 'Platform', 'Video', 'Availability', 'Comment', 'Status'
      ];

      let SubmissionDatabase = require.main.require('./app/database').submission;

      let runsData = [];
      let addRunnerData = function (gameData, runnerID) {
        let runner = submissionData.userInfo[runnerID];

        let runnerName = `=HYPERLINK("https://www.speedrun.com/user/${runner.speedrunComUser}", "${runner.displayName} (${runner.username})")`;
        let gameName = `=HYPERLINK("${gameData.game.leaderboards}", "${gameData.game.name}")`;
        let video = `=HYPERLINK("${gameData.game.video}")`;
        let status = 'Pending';
        if (gameData.state === 1) status = 'Accepted';
        if (gameData.state === 2) status = 'Rejected';

        runsData.push([
          gameData.uuid,
          `=DATEVALUE(MID("${new Date(gameData.timestamp).toISOString()}", 1, 10)) + TIMEVALUE(MID("${new Date(gameData.timestamp).toISOString()}", 12, 8))`,
          runnerName,
          gameName,
          gameData.game.category,
          gameData.isRace ? 'X' : '',
          gameData.game.estimate,
          gameData.game.platform,
          video,
          gameData.availability,
          gameData.comments,
          status
        ]);
      };

      let submissionData = await SubmissionDatabase.getAll();
      for (let i in submissionData.submissions) {
        let submission = submissionData.submissions[i];
        addRunnerData(submission, submission.userID);

        if (submission.isRace) {
          for (let iRace in submission.runners) {
            addRunnerData(submission, iRace);
          }
        }
      }

      stringify(runsData, {
        columns: columns,
        header: true
      }, (err, output) => {
        if (err) resolve(false);

        let fs = require('fs');

        fs.stat('./output/runs.csv', (_err, stat) => {
          if (_err && _err.code === 'ENOENT') {
            fs.mkdir('./output/', (__err) => {
              fs.writeFile('./output/runs.csv', output, _ => {
                resolve(true);
              });
            });
          } else {
            fs.writeFile('./output/runs.csv', output, _ => {
              resolve(true);
            });
          }
        });
      });
    });
  }

  allRunsToHoraro () {
    return new Promise(async (resolve, reject) => {
      let stringify = require('csv-stringify');

      let columns = [
        'Game', 'Estimate', 'Player(s)', 'Platform', 'Category', 'Note', '[[options]]'
      ];

      let SubmissionDatabase = require.main.require('./app/database').submission;

      let runsData = [];

      let submissionData = await SubmissionDatabase.getAll();
      for (let i in submissionData.submissions) {
        let submission = submissionData.submissions[i];

        if (submission.state !== 1) continue;

        let runners = [];
        // Add ourselves
        let runner = submissionData.userInfo[submission.userID];
        runners.push(`[${runner.displayName}](https://twitch.tv/${runner.username})`);
        if (submission.isRace) {
          for (let iRace in submission.runners) {
            let runner = submissionData.userInfo[iRace];
            runners.push(`[${runner.displayName}](https://twitch.tv/${runner.username})`);
          }
        }

        let game = `[${submission.game.name}](${submission.game.leaderboards})`;

        if (submission.isRace) {
          let lastSubmission = runsData.pop();
          if (lastSubmission) {
            lastSubmission.push('', '{"setup":"15m"}');
            runsData.push(lastSubmission);
          }
        }

        runsData.push([
          game,
          submission.game.estimate,
          runners.join(', '),
          submission.game.platform,
          submission.game.category
        ]);
      }

      stringify(runsData, {
        columns: columns,
        delimiter: ';',
        header: true
      }, (err, output) => {
        if (err) resolve(false);

        let fs = require('fs');

        fs.stat('./output/horaro.csv', (_err, stat) => {
          if (_err && _err.code === 'ENOENT') {
            fs.mkdir('./output/', (__err) => {
              fs.writeFile('./output/horaro.csv', output, _ => {
                resolve(true);
              });
            });
          } else {
            fs.writeFile('./output/horaro.csv', output, _ => {
              resolve(true);
            });
          }
        });
      });
    });
  }
}

module.exports = new AdminDatabase();
