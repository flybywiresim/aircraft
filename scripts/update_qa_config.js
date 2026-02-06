#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const PR_NUMBER = process.env.PR_NUMBER || 'unknown';
const PR_TITLE = process.env.PR_TITLE || 'Untitled PR';
const PR_BODY = process.env.PR_BODY || 'No description provided.';
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

function updateTrackInfo(track, prNumber, prTitle, prBody) {
  const addonPrefix = track.key.split('-pr-')[0];
  const trackName = `PR #${prNumber} ${addonPrefix.startsWith('a380x') ? `(${track.key.includes('8k') ? '8K' : '4K'})` : ''} | ${prTitle}`;
  const description = `## [${prTitle} #${prNumber}](https://github.com/${GITHUB_REPO}/pull/${prNumber})\n\n${prBody}`;

  track.name = trackName;
  track.description = description;
}

function cacheKiller(url) {
  return `${url}?t=${Date.now()}`;
}

async function main() {
  try {
    console.log(`Updating QA config entries for PR #${PR_NUMBER}: ${PR_TITLE}`);
    console.log(`Fetching QA config from: ${cacheKiller(QA_CONFIG_URL)}`);

    let config;
    try {
      const configData = await fetchUrl(cacheKiller(QA_CONFIG_URL));
      config = JSON.parse(configData);
    } catch (error) {
      if (error.message.includes('HTTP 404')) {
        console.log('Config not found, no entries to update.');
        return;
      } else {
        throw error;
      }
    }

    const publisher = config.publishers.find((p) => p.key === PUBLISHER_KEY);
    if (!publisher) {
      console.log(`Publisher '${PUBLISHER_KEY}' not found, no entries to update.`);
      return;
    }

    let updatedAnyTracks = false;

    for (const addonKey of ADDON_KEYS) {
      console.log(`Processing addon: ${addonKey}`);

      const addon = publisher.addons.find((a) => a.key === addonKey);
      if (!addon) {
        console.log(`Addon '${addonKey}' not found, skipping.`);
        continue;
      }

      const trackKeysToUpdate = [];
      if (addonKey.startsWith('a32nx')) {
        trackKeysToUpdate.push(`a32nx-pr-${PR_NUMBER}`);
      } else if (addonKey.startsWith('a380x')) {
        trackKeysToUpdate.push(`a380x-pr-${PR_NUMBER}-4k`, `a380x-pr-${PR_NUMBER}-8k`);
      }

      for (const trackKey of trackKeysToUpdate) {
        const track = addon.tracks.find((t) => t.key === trackKey);
        if (track) {
          updateTrackInfo(track, PR_NUMBER, PR_TITLE, PR_BODY);
          console.log(`Updated track: ${track.key}`);
          updatedAnyTracks = true;
        }
      }
    }

    if (!updatedAnyTracks) {
      console.log('No existing tracks found to update.');
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `tracks-updated=${false}\n`);
      return;
    }

    const updatedConfigJson = JSON.stringify(config, null, 2);

    const outputPath = path.join(__dirname, '..', 'qa-config', 'pull-requests.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, updatedConfigJson, 'utf8');
    console.log(`Updated config saved to: ${outputPath}`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `tracks-updated=${true}\n`);
    console.log('\nSuccessfully updated QA configuration entries');
  } catch (error) {
    console.error('Error updating QA config:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
