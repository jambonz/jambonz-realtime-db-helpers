const assert = require('assert');
const debug = require('debug')('jambonz:realtimedb-helpers');

function makeCallKey(accountSid, callSid) {
  return `call:${accountSid}:${callSid}`;
}

function makePatternForCallScan(accountSid) {
  return `call:${accountSid}:*`;
}

const noopLogger = {
  info: () => {},
  debug: () => {},
  error: () => {}
};

function filterNulls(obj) {
  debug(obj, 'filtering start');
  assert(typeof obj === 'object' && obj !== null);
  const filtered = Object.keys(obj)
    .filter((key) => obj[key] !== null)
    .reduce((o, key) => {
      o[key] = obj[key];
      return o;
    }, {});
  debug(filtered, 'filtering done');
  return filtered;
}

module.exports = {
  makeCallKey,
  makePatternForCallScan,
  noopLogger,
  filterNulls,
  CALL_SET: 'active-call-sids'
};
