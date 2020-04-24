const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('key tests', async(t) => {
  const fn = require('..');
  const {addKey, deleteKey, client} = fn(opts);

  try {
    let result = await addKey('akey', 'value');
    t.ok(result === 'OK', 'sucessfully set a key with no expires');
    result = await addKey('bkey', 'another value', 3);
    t.ok(result === 'OK', 'sucessfully set a key with expires');


    await deleteKey('akey');
    await deleteKey('bkey');

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

