'use strict';

function hasPermission (user, permission) {
  return user && user.permissions >= permission;
}

class Utils {
  static isOwner (user) { return hasPermission(user, 3); }

  static isAdmin (user) { return hasPermission(user, 2); }

  static isScheduler(user) { return hasPermission(user, 1); }
}

module.exports = Utils;
