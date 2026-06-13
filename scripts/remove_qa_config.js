#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Get PR information from environment variables or GitHub context
const PR_NUMBER = process.env.PR_NUMBER || 'unknown';
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

function removeTracksForPr(addon, prNumber) {
  const initialLength = addon.tracks.length;

  const trackKeysToRemove = [];
  if (addon.key.startsWith('a32nx')) {
    trackKeysToRemove.push(`a32nx-pr-${prNumber}`);
  } else if (addon.key.startsWith('a380x')) {
    trackKeysToRemove.push(`a380x-pr-${prNumber}-4k`, `a380x-pr-${prNumber}-8k`);
  }

  addon.tracks = addon.tracks.filter((track) => !trackKeysToRemove.includes(track.key));

  const removedCount = initialLength - addon.tracks.length;
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} track(s) from addon ${addon.key}`);
    return true;
  }

  return false;
}

function cleanupEmptyAddons(publisher) {
  const initialLength = publisher.addons.length;
  publisher.addons = publisher.addons.filter((addon) => addon.tracks.length > 0);

  const removedCount = initialLength - publisher.addons.length;
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} empty addon(s) from publisher ${publisher.key}`);
  }
}

function cleanupEmptyPublishers(config) {
  const initialLength = config.publishers.length;
  config.publishers = config.publishers.filter((publisher) => publisher.addons.length > 0);

  const removedCount = initialLength - config.publishers.length;
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} empty publisher(s)`);
  }
}

function cacheKiller(url) {
  return `${url}?t=${Date.now()}`;
}

async function main() {
  try {
    console.log(`Removing QA config entries for PR #${PR_NUMBER}`);
    console.log(`Fetching QA config from: ${cacheKiller(QA_CONFIG_URL)}`);

    let config;
    try {
      const configData = await fetchUrl(cacheKiller(QA_CONFIG_URL));
      config = JSON.parse(configData);
    } catch (error) {
      if (error.message.includes('HTTP 404')) {
        console.log('Config not found, nothing to remove.');
        return;
      } else {
        throw error;
      }
    }

    let removedAnyTracks = false;

    const publisher = config.publishers.find((p) => p.key === PUBLISHER_KEY);
    if (!publisher) {
      console.log(`Publisher '${PUBLISHER_KEY}' not found, nothing to remove.`);
      return;
    }

    for (const addonKey of ADDON_KEYS) {
      console.log(`Processing addon: ${addonKey}`);

      const addon = publisher.addons.find((a) => a.key === addonKey);
      if (!addon) {
        console.log(`Addon '${addonKey}' not found, skipping.`);
        continue;
      }

      if (removeTracksForPr(addon, PR_NUMBER)) {
        removedAnyTracks = true;
      }
    }

    cleanupEmptyAddons(publisher);
    cleanupEmptyPublishers(config);

    const updatedConfigJson = JSON.stringify(config, null, 2);

    const outputPath = path.join(__dirname, '..', 'qa-config', 'pull-requests.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, updatedConfigJson, 'utf8');
    console.log(`Updated config saved to: ${outputPath}`);

    if (!removedAnyTracks) {
      console.log('No tracks found to remove.');
      return;
    }
    console.log('\nSuccessfully removed QA configuration entries');
  } catch (error) {
    console.error('Error removing QA config:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
