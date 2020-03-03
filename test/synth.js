const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts);

  try {
    let filepath = await synthAudio({
      vendor: 'google',
      language: 'en-US',
      voice: 'en-US-Wavenet-C', 
      text: 'This is a test.  This is only a test'
    });
    t.pass(`successfully synthesized non-cached google audio to ${filepath}`);
  
    filepath = await synthAudio({
      vendor: 'google',
      language: 'en-US',
      voice: 'en-US-Wavenet-C', 
      text: 'This is a test.  This is only a test'
    });
    t.pass(`successfully synthesized cached google audio to ${filepath}`);

    filepath = await synthAudio({
      vendor: 'aws',
      language: 'en-US',
      voice: 'Amy', 
      text: 'This is a test.  This is only a test'
    });
    t.pass(`successfully synthesized non-cached aws audio to ${filepath}`);

    filepath = await synthAudio({
      vendor: 'aws',
      language: 'en-US',
      voice: 'Amy', 
      text: 'This is a test.  This is only a test'
    });
    t.pass(`successfully synthesized cached aws audio to ${filepath}`);

    await client.flushallAsync();

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

