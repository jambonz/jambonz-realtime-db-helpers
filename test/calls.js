const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

function sleep(secs) {
  return new Promise((resolve) => {
    setTimeout(resolve, secs * 1000);
  });
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('calls tests', async(t) => {
  const fn = require('..');
  const {updateCallStatus, retrieveCallInfo, client} = fn(opts);

  //wait 1 sec for connection
  //await sleep(1); 

  try {
    let status = await updateCallStatus({
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'Trying'
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when callSid is missing');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      sipStatus: 100,
      callStatus: 'Trying'
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when callId is missing');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      callStatus: 'Trying'
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when sipStatus is missing');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      sipStatus: 100
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when callStatus is missing');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'foobar'
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when callStatus is invalid');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'trying'
    });
    t.ok(!status, 'fails to add new call when serviceUrl is not provided');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'trying'
    }, 'http://127.0.0.1:3000');
    t.ok(status, 'successfully adds new call when status is 100 Trying');

    let callInfo = await retrieveCallInfo('callSid-1');
    t.ok(callInfo.callId === 'xxxx', 'successfully retrieves call');

    callInfo = await retrieveCallInfo('callSid-2');
    t.ok(!callInfo, 'fails to retrieve call with unknown sid');

    t.end();
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

