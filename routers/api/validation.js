'use strict';

const { check, body, param, query, validationResult } = require('express-validator/check');

let minMaxGame = { min: 0, max: 100 };
let minMaxPlatform = { min: 0, max: 32 };
let minMaxRegion = { min: 0, max: 32 };
let minMaxCategory = { min: 0, max: 32 };
let minMaxVideo = { min: 0, max: 200 };
let minMaxRunner = { min: 0, max: 24 };
let minMaxComment = { min: 0, max: 750 };

let permissionRange = { min: 0, max: 3 };

let submissionStateRange = { min: 0, max: 3 };
let submissionLimitRange = { min: 1 };

let setup = {
  init: {
    eventDates: body(['event_from', 'event_to'], 'Invalid event date!')
      .isISO8601(),
    type: param('type', 'Invalid type!')
      .isAlphanumeric().withMessage('Enter an alphanumeric type variable!')
  }
};

let submissions = {
  game: {
    name: body('game.name', 'Invalid game name!')
      .isLength(minMaxGame).withMessage('Game name is too long!'),
    platform: body('game.platform', 'Invalid platform name!')
      .isLength(minMaxPlatform).withMessage('Platform name is too long!'),
    region: body('game.region', 'Invalid region name!')
      .isLength(minMaxRegion).withMessage('Region name is too long!'),
    category: body('game.category', 'Invalid category name!')
      .isLength(minMaxCategory).withMessage('Category name is too long!'),
    video: body('game.video', 'Invalid video URL!')
      .isLength(minMaxVideo).withMessage('Video URL is too long!')
      .isURL().withMessage('This is not a URL!'),
    estimate: body('game.estimate', 'Invalid estimate!')
      .matches(/^(\d{1,2}):([0-5]\d):([0-5]\d)$/).withMessage('Estimate is not in the correct format!')
  },
  isRace: body('isRace').isBoolean().withMessage('isRace is not a true/false value!'),
  availability: body('availability', 'Invalid availability!')
    .isLength(minMaxComment).withMessage('Availability is too long!'),
  comments: body('comments', 'Invalid comment!')
    .isLength(minMaxComment).withMessage('Comment is too long!'),
  uuid: param('uuid', 'Invalid submission UUID!')
    .isLength({ min: 7, max: 14 }).withMessage('Enter a 7 to 14-digit integer as UUID!')
    .custom(uuid => {
      let database = require.main.require('./app/database');
      if (!database.submission.has(uuid)) throw new Error('Wrong UUID!');
      return true;
    }),
  runners: body('runners')
    .custom(runners => {
      let UserDatabase = require.main.require('./app/database').user;

      if (!runners || !runners.length) return true;
      for (let id in runners) {
        if (!UserDatabase.exists(id)) throw new Error('User doesn\'t exist!');
      }
      return true;
    })
};

let admin = {
  user: {
    permissions: body('permissions')
      .isInt(permissionRange).withMessage('Permission integer out of possible range!')
  },
  settings: {
    submissionState: body('submissionState')
      .isInt(submissionStateRange).withMessage('Submission state out of range!'),
    submissionLimit: body('submissionLimit')
      .isInt(submissionLimitRange).withMessage('Submission limit out of range! (Enter a positive number!)')
  },
  decide: {
    state: body('state')
      .isInt(submissionStateRange).withMessage('State is out of range!')
  }
};

module.exports = {
  setup: {
    init: [
      setup.init.eventDates,
      setup.init.type
    ]
  },
  user: {
    submissions: [
      submissions.game.name,
      submissions.game.platform,
      submissions.game.region,
      submissions.game.category,
      submissions.game.video,
      submissions.game.estimate,
      submissions.availability,
      submissions.comments,
      submissions.runners
    ]
  },
  admin: {
    decide: [
      admin.decide.state,
      submissions.uuid
    ],
    user: [admin.user.permissions],
    submissions: [
      submissions.game.name,
      submissions.game.platform,
      submissions.game.region,
      submissions.game.category,
      submissions.game.video,
      submissions.game.estimate,
      submissions.availability,
      submissions.comments,
      submissions.uuid
    ],
    settings: [
      admin.settings.submissionLimit,
      admin.settings.submissionState
    ]
  },
  submissionUUID: submissions.uuid,
  submissionIsRace: submissions.isRace
};
