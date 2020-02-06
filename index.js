const {noopLogger} = require('./lib/utils');
const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = function(opts, logger) {
  logger = logger || noopLogger;
  const client = redis.createClient(opts);
  ['ready', 'connect', 'reconnecting', 'error', 'end', 'warning']
    .forEach((event) => {
      client.on(event, (...args) => {
        logger.debug({args}, `redis event ${event}`);
      });
    });

  return {
    client,
    updateCallStatus: require('./lib/update-call-status').bind(null, client, logger),
    retrieveCallInfo: require('./lib/retrieve-call-info').bind(null, client, logger),
    listCallInfo: require('./lib/list-call-info').bind(null, client, logger)
  };
};
