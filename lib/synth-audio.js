const assert = require('assert');
const fs = require('fs');
const ttsGoogle = require('@google-cloud/text-to-speech');
const Polly = require('aws-sdk/clients/polly');
const {makeSynthKey, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');
const EXPIRES = 3600 * 24; // cache tts for 24 hours

async function synthAudio(client, logger, {vendor, language, voice, text}) {
  assert.ok(vendor && language && voice && text, 'synthAudio requires vendor, language, voice, and text');
  assert.ok(['google', 'aws', 'polly'].includes(vendor),
    `synthAudio supported vendors are aws and google, not ${vendor}`);
  let audioBuffer;
  logger = logger || noopLogger;

  const key = makeSynthKey(vendor, language, voice, text);
  debug(`synth key is ${key}`);
  const result = await client.getAsync(key);
  if (result) {
    // found in cache - extend the expiry and use it
    debug('result WAS found in cache');
    audioBuffer = Buffer.from(result, 'base64');
    client.expireAsync(key, EXPIRES).catch((err) => logger.info(err, 'Error setting expires'));
  }
  if (!result) {
    // not found in cache - go get it from speech vendor and add to cache
    debug('result was NOT found in cache');
    audioBuffer = 'google' === vendor ?
      await synthGoogle(language, voice, text) :
      await synthPolly(language, voice, text);
    const r = await client.setexAsync(key, EXPIRES, audioBuffer.toString('base64'));
  }

  return new Promise((resolve, reject) => {
    const filePath = `/tmp/${key.replace('tts:', 'tts-')}.mp3`;
    fs.writeFile(filePath, audioBuffer, (err) => {
      if (err) return reject(err);
      resolve(filePath);
    });
  });
}

const synthPolly = (language, voice, text) => {
  const polly = new Polly();
  const opts = {
    OutputFormat: 'mp3',
    Text: text,
    LanguageCode: language,
    TextType: text.startsWith('<speak>') ? 'ssml' : 'text',
    VoiceId: voice
  };
  return new Promise((resolve, reject) => {
    polly.synthesizeSpeech(opts, (err, data) => {
      if (err) return reject(err);
      resolve(data.AudioStream);
    });
  });
};

const synthGoogle = async(language, voice, text) => {
  const client = new ttsGoogle.TextToSpeechClient();
  const opts = {
    voice: {
      name: voice,
      languageCode: language
    },
    audioConfig: {audioEncoding: 'MP3'}
  };
  Object.assign(opts, {input: text.startsWith('<speak>') ? {ssml: text} : {text}});
  const responses = await client.synthesizeSpeech(opts);
  return responses[0].audioContent;
};

module.exports = synthAudio;
