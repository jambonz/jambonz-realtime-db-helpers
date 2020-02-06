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

function snake_case_results(results) {

}

module.exports = {
  makeCallKey,
  makePatternForCallScan,
  noopLogger,
  snake_case_results,
  CALL_SET: 'active-call-sids'
};
