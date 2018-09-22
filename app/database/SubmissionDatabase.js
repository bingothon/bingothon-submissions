'use strict';

const updatedDiff = require('deep-object-diff').updatedDiff;

const AbstractDatabase = require('./AbstractDatabase.js');

class SubmissionDatabase extends AbstractDatabase {
  constructor () {
    super('submissions.json');
  }

  count (userID) {
    return new Promise((resolve, reject) => {
      resolve(this.database.filter({ userID: userID }).size().value());
    });
  }

  countAll () {
    return this.database.size()
      .value();
  }

  has (uuid) {
    return this.database.has(uuid).value();
  }

  fixString (string) {
    if (string.includes('http:') || string.includes('https:')) return string;

	string = string.replace(/_/g, '\\_');
	string = string.replace(/\*/g, '\\*');
	string = string.replace(/~/g, '\\~');
	string = string.replace(/`/g, '\\`');
	return string;
  }

  async add (userID, data) {
    data.state = 0;

    let uuid = require('shortid').generate();
    data.uuid = uuid;
    data.userID = userID;
    data.timestamp = new Date();
	data.visible = true;

    let admin = require('./index.js').admin;
    let user = require('./index.js').user;
    let userInfo = await user.getByID(userID);
    let utils = require.main.require('./app/utils');
    let publicDiscordData = {
      'embeds': [
        {
          'title': `A new ${data.isRace ? 'race' : 'run'} has been submitted!`,
          'color': utils.getSeedColorInt(data.uuid),
          'url': `${admin.getServerURL()}submissions/view`,
          'description': `${this.fixString(userInfo.displayName)} (${this.fixString(userInfo.username)}) has just submitted a new run!\n\n` +
            `**Game:** ${this.fixString(data.game.name)}\n**Category:** ${this.fixString(data.game.category)}\n**Platform:** ${this.fixString(data.game.platform)}`
        }
      ]
    };

    let auditDiscordData = {
      'username': `Audit Log (Run: ${uuid})`,
      'embeds': [
        {
          'title': `A new ${data.isRace ? 'race' : 'run'} has been submitted!`,
          'color': utils.getSeedColorInt(data.uuid),
          'url': `${admin.getServerURL()}submissions/view`,
          'description': `${this.fixString(userInfo.displayName)} (${this.fixString(userInfo.username)}) has just submitted a new run!\n\n` +
          `**Game:** ${this.fixString(data.game.name)}\n**Category:** ${this.fixString(data.game.category)}\n**Platform:** ${this.fixString(data.game.platform)}\n` +
          `**Region:** ${this.fixString(data.game.region)}\n**Estimate:** ${this.fixString(data.game.estimate)}\n**Video:** ${this.fixString(data.game.video)}\n` +
          `**Leaderboards:** ${this.fixString(data.game.leaderboards)}\n**Twitch Game Name:** ${this.fixString(data.game.twitch_name)}\n\n` +
          `**Availability:** ${this.fixString(data.availability)}\n**Comments:** ${this.fixString(data.comments)}\n**Incentives:** ${this.fixString(data.incentives)}`
        }
      ]
    };

    let DiscordWebhook = require.main.require('./app/discord');
    DiscordWebhook.publicWebhook.postMessage(publicDiscordData);
    DiscordWebhook.auditWebhook.postMessage(auditDiscordData);

    if (data.isRace) {
      // Let's first splice runners so only a max of 3 people will be in.
      let splice = Object.keys(data.runners).splice(3);
      if (splice.length) {
        for (let i in splice) {
          delete data.runners[splice[i]];
        }
      }

      let saveRunners = {};

      let runners = {};
      let runnerCombinedNames = [`${userInfo.displayName} (${userInfo.username})`];
      // First loop to get their user info
      for (let i = 0; i < data.runners.length; i++) {
        let id = data.runners[i];
        runners[i] = {};
        if (!isNaN(Number(id))) {
          let info = await user.getByID(Number(id));
          runners[i] = info;
          runnerCombinedNames.push(info.displayName + ' (' + info.username + ')');
        }

        saveRunners[id] = 0;
      }

      let notificationData = {
        type: 'race-nomination',
        executed: false,
        submission_uuid: uuid,
        subject: `${this.fixString(userInfo.displayName)} (${this.fixString(userInfo.username)}) has nominated you for a race`,
        content: `Hey there, you've got nominated for a race!\n\n` +
        `**Game:** ${this.fixString(data.game.name)}\n**Category:** ${this.fixString(data.game.category)}\n**Platform:** ${this.fixString(data.game.platform)}\n` +
        `**Region:** ${this.fixString(data.game.region)}\n**Estimate:** ${this.fixString(data.game.estimate)}\n\n` +
        `**Availability:** ${this.fixString(data.availability)}\n**Comments:** ${this.fixString(data.comments)}\n**Incentives:** ${this.fixString(data.incentives)}\n\n` +
        `**Runners:** ${this.fixString(runnerCombinedNames.join(', '))}`
      };

      let NotificationDatabase = require('./index').notification;

      for (let i in runners) {
        let runner = runners[i];

        NotificationDatabase.add(runner.id, Object.assign({}, notificationData));
      }

      data.runners = saveRunners;
    }

    this.database.set(uuid, data)
      .write();
  }

  async update (uuid, data) {
    if (this.database.has(uuid).value()) {
      // isRace can't be changed after initial submission
      data.isRace = this.database.get(uuid).get('isRace').value();
      data.runners = this.database.get(uuid).get('runners').value();
      data.timestamp = this.database.get(uuid).get('timestamp').value();
	  data.visible = this.database.get(uuid).get('visible').value();

      let oldData = this.database.get(uuid).cloneDeep().value();

      let user = require('./index.js').user;
      let userInfo = await user.getByID(oldData.userID);

      let editText = `A ${data.isRace ? 'race' : 'run'} from ${this.fixString(userInfo.displayName)} (${this.fixString(userInfo.username)}) has been edited`;
      let footer;
      if (data.editor) {
        let editorInfo = await user.getByID(data.editor);
        footer = {
          'text': `Editor: ${this.fixString(editorInfo.displayName)} (${this.fixString(editorInfo.username)} / ${editorInfo.connections.discord.username}#${editorInfo.connections.discord.discriminator})`
        };
      }

      let AdminDatabase = require('./').admin;
      let editable = await AdminDatabase.getEditableCurrent();

      // Set non-editable values back to oldData's values
      for (let value in editable) {
        if (editable[value]) continue;

        if (value === 'game') {
          data.game.name = oldData.game.name;
          data.game.leaderboards = oldData.game.leaderboards;
          data.game.twitch_name = oldData.game.twitch_name;
        } else if (value === 'availability' || value === 'comments') {
          data[value] = oldData[value];
        } else {
          data.game[value] = oldData.game[value];
        }
	  }
	  
	  const updated = updatedDiff(oldData, data);

	  const submToText = {
		availability: 'Availability',
		comments: 'Comments',
		incentives: 'Incentives',

		game: {
			name: 'Game',
			category: 'Category',
			platform: 'Platform',
			region: 'Region',
			estimate: 'Estimate',
			video: 'Video',
			leaderboards: 'Leaderboards',
			twitch_name: 'Twitch Game Name'
		}
	  };

	  let updatedText = '';
	  for (let _d in updated) {
		if (_d == 'game') {
			for (let _d2 in updated['game']) {
				updatedText = `${updatedText}\n**${submToText.game[_d2]}**: ${this.fixString(oldData['game'][_d2])} **=>** ${this.fixString(updated['game'][_d2])}`;
			}
		} else {
			updatedText = `${updatedText}\n**${submToText[_d]}**: ${this.fixString(oldData[_d])} **=>** ${this.fixString(updated[_d])}`;
		}
	  }

      let utils = require.main.require('./app/utils');
      let discordData = {
        'username': `Audit Log (${data.isRace ? 'race' : 'run'}: ${uuid})`,
        'embeds': [
          {
            'title': editText,
            'color': utils.getSeedColorInt(uuid),
            'footer': footer
		  },
          {
            'title': `Updated information`,
            'color': utils.getSeedColorInt(uuid),
            'description': updatedText
          }
        ]
      };

      let DiscordWebhook = require.main.require('./app/discord');
      DiscordWebhook.auditWebhook.postMessage(discordData);

      delete data.editor;
      this.database.get(uuid)
        .assign(data)
        .write();
    }
  }

  get (uuid) {
    return new Promise((resolve, reject) => {
      if (this.database.has(uuid).value()) {
        resolve(this.database.get(uuid).cloneDeep().value());
      }

      resolve(null);
    });
  }

  async getAll () {
    let data = {
      submissions: [],
      userInfo: {}
    };

    let UserDatabase = require('./index.js').user;

    data.submissions = this.database.value();
    for (let i in data.submissions) {
      let s = data.submissions[i];
      if (!data.userInfo[s.userID]) {
        let userData = await UserDatabase.getByID(s.userID);
        data.userInfo[s.userID] = {
          username: userData.username,
          displayName: userData.displayName,
          avatar: userData.avatar,
          speedrunComUser: userData.speedrunComUser,
          connections: userData.connections
        };
      }

      // If it's a race, add runners to the userInfo
      if (s.isRace) {
        for (let i in s.runners) {
          if (!isNaN(Number(i))) {
            if (!data.userInfo[i]) {
              let userData = await UserDatabase.getByID(i);
              data.userInfo[i] = {
                username: userData.username,
                displayName: userData.displayName,
                avatar: userData.avatar,
                speedrunComUser: userData.speedrunComUser,
                connections: userData.connections
              };
            }
          }
        }
      }
    }

    return data;
  }

  getByUser (id) {
    return new Promise(async (resolve, reject) => {
      let data = {
        submissions: [],
        userInfo: {}
      };

      let UserDatabase = require('./index.js').user;

      data.submissions = this.database.filter({ userID: id }).cloneDeep().value();
      for (let i in data.submissions) {
        let s = data.submissions[i];
        // If it's a race, add runners to the userInfo
        if (s.isRace) {
          for (let i in s.runners) {
            if (!isNaN(Number(i))) {
              if (!data.userInfo[i]) {
                let userData = await UserDatabase.getByID(i);
                data.userInfo[i] = {
                  username: userData.username,
                  displayName: userData.displayName,
                  avatar: userData.avatar,
                  connections: userData.connections
                };
              }
            }
          }
        }
      }

      resolve(data);
    });
  }

  decide (uuid, state, reason, editor) {
    return new Promise(async (resolve, reject) => {
      reason = reason || '';

      if (this.database.has(uuid).value()) {
        let user = require('./index.js').user;

        let data = this.database.get(uuid).value();

        let userInfo = await user.getByID(data.userID);
        let editorInfo = await user.getByID(editor);
        state = Number(state);
        let states = ['pending', 'accepted', 'rejected'];
        let editText = `A ${data.isRace ? 'race' : 'run'} from ${this.fixString(userInfo.displayName)} (${this.fixString(userInfo.username)}) has been set to ${states[state]}`;
        if (reason) {
          editText = editText + ` with the following reason`;
        }

        let runners = [];
        runners.push(`${userInfo.displayName} (${userInfo.username})`);
        for (let r in data.runners) {
          if (Number(r) === Number(data.userID)) continue;

          let runnerInfo = await user.getByID(r);
          runners.push(`${runnerInfo.displayName} (${runnerInfo.username})`);
        }

        let utils = require.main.require('./app/utils');
         // -- Public
        let publicDiscordData = {
          'embeds': [
            {
              'title': editText,
              'color': utils.getSeedColorInt(uuid),
              'description': reason
            },
            {
              'title': 'Game information',
              'color': utils.getSeedColorInt(uuid),
              'description': `**Game:** ${this.fixString(data.game.name)}\n**Category:** ${this.fixString(data.game.category)}\n**Platform:** ${this.fixString(data.game.platform)}\n` +
              `**Estimate:** ${this.fixString(data.game.estimate)}\n**Runners:** ${this.fixString(runners.join(', '))}`
            }
          ]
        };

        // -- Audit
        let auditDiscordData = {
          'username': `Audit Log (Run: ${uuid})`,
          'embeds': [
            {
              'title': editText,
              'color': utils.getSeedColorInt(uuid),
              'description': reason,
              'footer': {
                'text': `Editor: ${this.fixString(editorInfo.displayName)} (${this.fixString(editorInfo.username)} / ${editorInfo.connections.discord.username}#${editorInfo.connections.discord.discriminator})`
              }
            },
            {
              'title': 'Game information',
              'color': utils.getSeedColorInt(uuid),
              'description': `**Game:** ${this.fixString(data.game.name)}\n**Category:** ${this.fixString(data.game.category)}\n**Platform:** ${this.fixString(data.game.platform)}\n` +
              `**Region:** ${this.fixString(data.game.region)}\n**Estimate:** ${this.fixString(data.game.estimate)}\n**Video:** ${this.fixString(data.game.video)}\n` +
              `**Availability:** ${this.fixString(data.availability)}\n**Comments:** ${this.fixString(data.comments)}\n**Incentives:** ${this.fixString(data.incentives)}\n\n**Runners:** ${this.fixString(runners.join(', '))}`
            }
          ]
        };

        let DiscordWebhook = require.main.require('./app/discord');
        DiscordWebhook.publicWebhook.postMessage(publicDiscordData);
        DiscordWebhook.auditWebhook.postMessage(auditDiscordData);

        let firstSentence;
        if (states[state] === 'accepted') firstSentence = `We're happy to tell you that your following run has been **accepted** by one of the admins!\n\n`;
        else if (states[state] === 'rejected') firstSentence = `We're sorry to inform you that your following run has been **rejected** by one of the admins:\n\n`;
        else firstSentence = `Your following run has been set back to **pending** by one of the admins:\n\n`;

        let notificationData = {
          type: 'information',
          subject: `One of your ${data.isRace ? 'races' : 'runs'} just got set to the status ${states[state]}`,
          content: firstSentence +
          `**Game:** ${this.fixString(data.game.name)}\n**Category:** ${this.fixString(data.game.category)}\n**Platform:** ${this.fixString(data.game.platform)}\n` +
          `**Region:** ${this.fixString(data.game.region)}\n**Estimate:** ${this.fixString(data.game.estimate)}\n\n` +
          `**Availability:** ${this.fixString(data.availability)}\n**Comments:** ${this.fixString(data.comments)}\n**Incentives:** ${this.fixString(data.incentives)}\n\n**Runners:**${this.fixString(runners.join(', '))}\n\n` +
          (reason !== '' ? `**Reason:** ${this.fixString(reason)}` : '')
        };

        let NotificationDatabase = require('./index').notification;
        NotificationDatabase.add(data.userID, notificationData);

        this.database.get(uuid)
          .set('state', state)
          .set('reason', reason)
          .write();
      }

      resolve();
    });
  }

  updateReason (uuid, newReason) {
    // TODO: Discord Audit Log
    return new Promise((resolve, reject) => {
      if (this.database.has(uuid).value()) this.database.set(uuid + '.reason', newReason).write();
      resolve();
    });
  }

  remove (uuid, editor) {
    return new Promise(async (resolve, reject) => {
      if (this.database.has(uuid).value()) {
        let oldData = this.database.get(uuid).cloneDeep().value();

        let user = require('./index.js').user;
        let userInfo = await user.getByID(oldData.userID);
        let editText = `A ${oldData.isRace ? 'race' : 'run'} from ${this.fixString(userInfo.displayName)} (${this.fixString(userInfo.username)}) has been removed`;
        let footer;
        if (editor) {
          let editorInfo = await user.getByID(editor);
          footer = {
            'text': `Editor: ${this.fixString(editorInfo.displayName)} (${this.fixString(editorInfo.username)} / ${editorInfo.connections.discord.username}#${editorInfo.connections.discord.discriminator})`
          };
        }

        let runners = [];
        runners.push(`${userInfo.displayName} (${userInfo.username})`);
        for (let r in oldData.runners) {
          if (Number(r) === Number(oldData.userID)) continue;

          let runnerInfo = await user.getByID(r);
          runners.push(`${runnerInfo.displayName} (${runnerInfo.username})`);
        }

        let utils = require.main.require('./app/utils');
        let discordData = {
          'username': `Audit Log (Run: ${uuid})`,
          'embeds': [
            {
              'title': editText,
              'color': utils.getSeedColorInt(uuid),
              'footer': footer
            },
            {
              'title': 'Game information',
              'color': utils.getSeedColorInt(uuid),
              'description': `**Game:** ${this.fixString(oldData.game.name)}\n**Category:** ${this.fixString(oldData.game.category)}\n**Platform:** ${this.fixString(oldData.game.platform)}\n` +
              `**Region:** ${this.fixString(oldData.game.region)}\n**Estimate:** ${this.fixString(oldData.game.estimate)}\n**Video:** ${this.fixString(oldData.game.video)}\n` +
              `**Leaderboards:** ${this.fixString(oldData.game.leaderboards)}\n**Twitch Game Name:** ${this.fixString(oldData.game.twitch_name)}\n\n` +
              `**Availability:** ${this.fixString(oldData.availability)}\n**Comments:** ${this.fixString(oldData.comments)}\n**Incentives:** ${this.fixString(oldData.incentives)}\n\n**Runners**:${this.fixString(runners.join(', '))}`
            }
          ]
        };

        let DiscordWebhook = require.main.require('./app/discord');
        DiscordWebhook.auditWebhook.postMessage(discordData);

        this.database.unset(uuid)
          .write();

        resolve();
      } else reject(new Error('No submission found!'));
    });
  }

  haveAllRunnersAccepted (uuid) {
    return new Promise((resolve, reject) => {
      if (this.database.has(uuid).value() && this.database.get(uuid).has('runners').value()) {
        let runners = this.database.get(uuid + '.runners').value()
        for (let userId in runners) {
          if (runners[userId] !== 1) resolve(false);
        }

        resolve(true);
      }
      resolve(false);
    });
  }

  decideRace (uuid, runner, accepted) {
    return new Promise(async (resolve, reject) => {
      if (this.database.has(uuid).value()) {
        let data = this.database.get(uuid).cloneDeep().value();

        let user = require('./index.js').user;
        let runnerInfo = await user.getByID(runner);

        let runners = [];
        let submitRunnerInfo = await user.getByID(data.userID);
        runners.push(`${submitRunnerInfo.displayName} (${submitRunnerInfo.username})`);
        runners.push(`${runnerInfo.displayName} (${runnerInfo.username})`);

        for (let r in data.runners) {
          if (Number(r) === Number(runner)) continue;

          let userInfo = await user.getByID(r);
          runners.push(`${userInfo.displayName} (${userInfo.username})`);
        }

        // TODO: Auto-reject by "admin" if declined
        let utils = require.main.require('./app/utils');
        let DiscordWebhook = require.main.require('./app/discord');

        if (accepted) {
          let editText = `${this.fixString(runnerInfo.displayName)} (${this.fixString(runnerInfo.username)}) has just accepted a race!`;

          let discordData = {
            'username': `Audit Log (Run: ${uuid})`,
            'embeds': [
              {
                'title': editText,
                'color': utils.getSeedColorInt(uuid)
              },
              {
                'title': 'Game information',
                'color': utils.getSeedColorInt(uuid),
                'description': `**Game:** ${this.fixString(data.game.name)}\n**Category:** ${this.fixString(data.game.category)}\n**Platform:** ${this.fixString(data.game.platform)}\n` +
                `**Region:** ${this.fixString(data.game.region)}\n**Estimate:** ${this.fixString(data.game.estimate)}\n**Video:** ${this.fixString(data.game.video)}\n` +
                `**Leaderboards:** ${this.fixString(data.game.leaderboards)}\n**Twitch Game Name:** ${this.fixString(data.game.twitch_name)}\n\n` +
                `**Availability:** ${this.fixString(data.availability)}\n**Comments:** ${this.fixString(data.comments)}\n**Incentives:** ${this.fixString(data.incentives)}\n\n**Runners:** ${this.fixString(runners.join(', '))}`
              }
            ]
          };

          DiscordWebhook.auditWebhook.postMessage(discordData);

          this.database.get(uuid).get('runners').set(runner, 1)
            .write();
        } else {
          if (data.state === 0) {
            let editText = `${this.fixString(runnerInfo.displayName)} (${this.fixString(runnerInfo.username)}) has just declined a race and it was auto-rejected!`;

            let discordData = {
              'username': `Audit Log (Run: ${uuid})`,
              'embeds': [
                {
                  'title': editText,
                  'color': utils.getSeedColorInt(uuid)
                },
                {
                  'title': 'Game information',
                  'color': utils.getSeedColorInt(uuid),
                  'description': `**Game:** ${this.fixString(data.game.name)}\n**Category:** ${this.fixString(data.game.category)}\n**Platform:** ${this.fixString(data.game.platform)}\n` +
                  `**Region:** ${this.fixString(data.game.region)}\n**Estimate:** ${this.fixString(data.game.estimate)}\n**Video:** ${this.fixString(data.game.video)}\n` +
                  `**Leaderboards:** ${this.fixString(data.game.leaderboards)}\n**Twitch Game Name:** ${this.fixString(data.game.twitch_name)}\n\n` +
                  `**Availability:** ${this.fixString(data.availability)}\n**Comments:** ${this.fixString(data.comments)}\n**Incentives:** ${this.fixString(data.incentives)}\n\n**Runners:** ${this.fixString(runners.join(', '))}`
                }
              ]
            };

            DiscordWebhook.auditWebhook.postMessage(discordData);

            let newRunners = {};
            for (let r in data.runners) {
              newRunners[r] = 2;
            }

            this.database.get(uuid).set('runners', newRunners)
              .write();

            this.database.get(uuid)
              .set('state', 2)
              .set('reason', 'Automatic rejection due to one or more runners declining.')
              .write();
          }
        }

        resolve();
      } else reject(new Error('No submission found!'));
    });
  }

  setVisibility (uuid, state) {
    return new Promise(async (resolve, reject) => {
      if (this.database.has(uuid).value()) {
        this.database.get(uuid).set('visible', state).write();
      }

      resolve();
    });
  }
}

module.exports = new SubmissionDatabase();
