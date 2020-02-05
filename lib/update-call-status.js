const {makeCallKey, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:redis-helpers');
const assert = require('assert');
const MAX_CALL_LIFETIME = 12 * 60 * 60;                 // calls live 12 hours max in redis
const MAX_CALL_LIFETIME_AFTER_COMPLETED = 1 * 60 * 60;  // or 1 hour after completion

// duck-type checking
function validateCallInfo(callInfo, serviceUrl) {
  assert(callInfo.callSid);
  assert(callInfo.callId);
  assert(callInfo.sipStatus);
  assert([
    'trying',
    'ringing',
    'early-media',
    'in-progress',
    'completed',
    'failed',
    'busy',
    'no-answer',
    'queued'
  ].includes(callInfo.callStatus));
  assert(serviceUrl || callInfo.sipStatus !== 100);
}
async function updateCallStatus(client, logger, callInfo, serviceUrl) {
  logger = logger || noopLogger;
  debug({callInfo, serviceUrl}, 'updateCallStatus');
  try {
    validateCallInfo(callInfo, serviceUrl);
    const key = makeCallKey(callInfo.callSid);
    const expires = callInfo.sipStatus >= 200 ? MAX_CALL_LIFETIME : MAX_CALL_LIFETIME_AFTER_COMPLETED;
    const obj = callInfo.sipStatus === 100 ? Object.assign({serviceUrl}, callInfo) : callInfo;
    debug({obj}, `updateCallStatus setting with key: ${key}`);
    const result = await client
      .multi()
      .hmset(key, obj)
      .expire(key, expires)
      .execAsync();
    debug({obj}, `updateCallStatus result: ${result}`);
    logger.debug({obj}, `updateCallStatus result: ${result}`);
    return result[0] === 'OK';
  } catch (err) {
    debug(err, `Error adding call ${callInfo.callSid}`);
    logger.error(err, `Error adding call ${callInfo.callSid}`);
    return false;
  }
}

module.exports = updateCallStatus;
