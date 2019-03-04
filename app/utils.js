'use strict';

const randomcolor = require('randomcolor');

class Utils {
  static safeJSON (data) {
    return encodeURI(JSON.stringify(data));
  }

  static getSeedColor (seed) {
    return randomcolor({ seed: seed });
  }

  static getSeedColorInt (seed) {
    return parseInt(this.getSeedColor(seed).replace('#', ''), 16);
  }
}

module.exports = Utils;
