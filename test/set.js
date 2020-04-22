const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('set tests', async(t) => {
  const fn = require('..');
  const {createSet, retrieveSet, client} = fn(opts);

  try {
    const set1 = new Set();
    set1.add('10.10.10.1');
    set1.add('10.10.10.2');
    
    let added = await createSet('sbcList-1', set1);
    t.ok(2 === added, 'creates new set');

    const set2 = new Set();
    set2.add('10.10.10.4');

    added = await createSet('sbcList-1', set2);
    t.ok(1 === added, 'recreates set with new members');

    const ret = await retrieveSet('sbcList-1');
    t.ok(Array.isArray(ret) && ret.length === 1 && ret[0] === '10.10.10.4', 'retrieves set members');

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

