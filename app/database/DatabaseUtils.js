'use strict';

class DatabaseUtils {
  static getAvatarOrPlaceholder (url) {
    return url || 'http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png';
  }
}

module.exports = DatabaseUtils;
