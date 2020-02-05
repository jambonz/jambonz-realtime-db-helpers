const {makeCallKey, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:redis-helpers');

async function retrieveCallInfo(client, logger, callSid) {
  logger = logger || noopLogger;
  try {
    const key = makeCallKey(callSid);
    const result = await client.hgetallAsync(key);
    logger.info({result}, `retrieveCallInfo: ${callSid}`);
    debug({result}, `retrieveCallInfo: ${callSid}`);
    return result;
  } catch (err) {
    debug(err, `Error retrieving call ${callSid}`);
    logger.error(err, `Error retrieving call ${callSid}`);
  }
}

module.exports = retrieveCallInfo;
