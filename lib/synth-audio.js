const assert = require('assert');
const fs = require('fs');
const ttsGoogle = require('@google-cloud/text-to-speech');
const Polly = require('aws-sdk/clients/polly');
const {makeSynthKey, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');
const EXPIRES = 3600 * 24; // cache tts for 24 hours
const TMP_FOLDER = '/tmp';

/**
 * Synthesize speech to an mp3 file, and also cache the generated speech
 * in redis (base64 format) for 24 hours so as to avoid unnecessarily paying
 * time and again for speech synthesis of the same text.
 * It is the responsibility of the caller to unlink the mp3 file after use.
 *
 * @param {*} client - redis client
 * @param {*} logger - pino logger
 * @param {object} opts - options
 * @param {string} opts.vendor - 'google' or 'aws' ('polly' is an alias for 'aws')
 * @param {string} opt.language - language code
 * @param {string} opts.voice - voice identifier
 * @param {string} opts.text - text or ssml to synthesize
 * @returns {string} filepath to an mp3 file in the /tmp folder containing
 * the synthesized audio.
 */
async function synthAudio(client, logger, {vendor, language, voice, text}) {
  assert.ok(vendor && language && voice && text, 'synthAudio requires vendor, language, voice, and text');
  assert.ok(['google', 'aws', 'polly'].includes(vendor),
    `synthAudio supported vendors are google and aws (alias polly), not ${vendor}`);
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
    client.setexAsync(key, EXPIRES, audioBuffer.toString('base64'))
      .catch((err) => logger.error(err, `error calling setex on key ${key}`));
  }

  return new Promise((resolve, reject) => {
    const filePath = `${TMP_FOLDER}/${key.replace('tts:', 'tts-')}.mp3`;
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
