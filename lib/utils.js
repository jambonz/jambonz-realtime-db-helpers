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

module.exports = {
  makeCallKey,
  makePatternForCallScan,
  noopLogger,
  CALL_SET: 'active-call-sids'
};
