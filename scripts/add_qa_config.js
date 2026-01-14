#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const PR_NUMBER = process.env.PR_NUMBER || 'unknown';
const PR_TITLE = process.env.PR_TITLE || 'Untitled PR';
const PR_BODY = process.env.PR_BODY || 'No description provided.';
const TEXTURE_QUALITY = process.env.TEXTURE_QUALITY || '4k';
const GITHUB_REPO = process.env.GITHUB_REPO || 'flybywiresim/aircraft';
const QA_CONFIG_URL = process.env.QA_CONFIG_URL || 'https://flybywirecdn.com/installer/qa-config/pull-requests.json';
const PUBLISHER_KEY = process.env.PUBLISHER_KEY || 'flybywiresim';
const ADDON_KEYS = process.env.ADDON_KEYS
  ? process.env.ADDON_KEYS.split(',')
  : ['a32nx-msfs2020', 'a32nx-msfs2024', 'a380x-msfs2020', 'a380x-msfs2024'];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${response.statusCode}: ${data}`));
          }
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function createTrack(addonKey, prNumber, prTitle, prBody, textureQuality) {
  const addonPrefix = addonKey.split('-')[0];
  const textureQualitySuffix = addonKey.startsWith('a380x') ? `-${textureQuality}` : '';
  const trackKey = `${addonPrefix}-pr-${prNumber}${textureQualitySuffix}`;
  const trackName = `PR #${prNumber} ${addonKey.startsWith('a380x') ? `(${textureQuality.toUpperCase()})` : ''} | ${prTitle}`;
  const description = `## [${prTitle} #${prNumber}](https://github.com/${GITHUB_REPO}/pull/${prNumber})\n\n${prBody}`;

  let baseUrl;
  if (addonKey.startsWith('a32nx')) {
    baseUrl = `https://flybywirecdn.com/addons/a32nx/pr-${prNumber}`;
  } else if (addonKey.startsWith('a380x')) {
    baseUrl = `https://flybywirecdn.com/addons/a380x/pr-${prNumber}-${textureQuality}`;
  }

  return {
    name: trackName,
    key: trackKey,
    url: baseUrl,
    description: description,
    isQualityAssurance: true,
    releaseModel: { type: 'fragmenter' },
  };
}

function findOrCreatePublisher(config, publisherKey) {
  let publisher = config.publishers.find((p) => p.key === publisherKey);

  if (!publisher) {
    publisher = {
      key: publisherKey,
      addons: [],
    };
    config.publishers.push(publisher);
  }

  return publisher;
}

function findOrCreateAddon(publisher, addonKey) {
  let addon = publisher.addons.find((a) => a.key === addonKey);

  if (!addon) {
    addon = {
      key: addonKey,
      tracks: [],
    };
    publisher.addons.push(addon);
  }

  return addon;
}

function addOrUpdateTrack(addon, track) {
  const existingTrackIndex = addon.tracks.findIndex((t) => t.key === track.key);

  if (existingTrackIndex >= 0) {
    addon.tracks[existingTrackIndex] = track;
    console.log(`Updated existing track: ${track.key}`);
  } else {
    addon.tracks.push(track);
    console.log(`Added new track: ${track.key}`);
  }
}

function cacheKiller(url) {
  return `${url}?t=${Date.now()}`;
}

async function main() {
  try {
    console.log(`Processing PR #${PR_NUMBER}: ${PR_TITLE}`);
    console.log(`Fetching QA config from: ${cacheKiller(QA_CONFIG_URL)}`);

    let config;
    try {
      const configData = await fetchUrl(cacheKiller(QA_CONFIG_URL));
      config = JSON.parse(configData);
    } catch (error) {
      if (error.message.includes('HTTP 404')) {
        console.log('Config not found, re-creating new config.');
        config = {
          version: 1,
          publishers: [],
        };
      } else {
        throw error;
      }
    }

    const publisher = findOrCreatePublisher(config, PUBLISHER_KEY);

    for (const addonKey of ADDON_KEYS) {
      console.log(`Processing addon: ${addonKey}`);

      const addon = findOrCreateAddon(publisher, addonKey);
      const track = createTrack(addonKey, PR_NUMBER, PR_TITLE, PR_BODY, TEXTURE_QUALITY);

      addOrUpdateTrack(addon, track);
    }

    const updatedConfigJson = JSON.stringify(config, null, 2);

    const outputPath = path.join(__dirname, '..', 'qa-config', 'pull-requests.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, updatedConfigJson, 'utf8');
    console.log(`Updated config saved to: ${outputPath}`);
    console.log('\nSuccessfully updated QA configuration');
  } catch (error) {
    console.error('Error updating QA config:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
