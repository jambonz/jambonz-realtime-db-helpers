const {makeCallKey, CALL_SET, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

/**
 *  Scan CALL_SET and remove any members that don't exist as a key
 */
async function purgeCalls(client, logger) {
  logger = logger || noopLogger;
  try {
    const dead = [];
    const count = await client.zcardAsync(CALL_SET);
    debug(`purgeCalls: scanning ${count} members of active call set`);
    logger.debug(`purgeCalls: scanning ${count} members of active call set`);

    async function scan(cursor) {
      try {
        const res = await client.zscanAsync(CALL_SET, cursor);
        for (let i = 0; i < res[1].length; i += 2) {
          const key = res[1][i];
          const exists = client.existsAsync(key);
          debug(`key ${key} exists: ${exists}`);
          if (!exists) dead.push(key);
        }

        if (dead.length) {
          this.logger.info(`purgeCalls: removing ${dead.length} keys`);
          const result = await this.client.zrem(CALL_SET, dead);
          this.logger.dead(`purgeCalls: removed ${result} keys`);
        }
        return res[0];  // return updated cursor
      } catch (err) {
        logger.error(err, 'Error scanning sorted call set');
        return '0';
      }
    }

    let cursor = '0';
    do {
      cursor = await scan(cursor);
    } while ('0' !== cursor);

  } catch (err) {
    debug(err, 'purgeCalls: Error');
    logger.error(err, 'purgeCalls: Error');
  }
}

module.exports = purgeCalls;
