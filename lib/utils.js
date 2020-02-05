function makeCallKey(sid) {
  return `calls:${sid}`;
}

const noopLogger = {
  info: () => {},
  debug: () => {},
  error: () => {}  
};

module.exports = {
  makeCallKey,
  noopLogger
};
