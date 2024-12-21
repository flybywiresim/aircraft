//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export function wordWrap(text: string, maxLength: number) {
  const result = [];
  let line = [];
  let length = 0;

  const words = text.match(/[-.:*@_A-Z0-9]+|\[\s+\]|\n/g);
  for (const word of words) {
    if (word === '\n') {
      continue;
    }

    if (length + word.length >= maxLength) {
      result.push(line.join(' ').toUpperCase());
      line = [];
      length = 0;
    }

    length += word.length + 1;
    line.push(word);
  }

  if (line.length > 0) {
    result.push(line.join(' ').toUpperCase());
  }

  return result;
}

export function timestampToString(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
}

function decimalToDms(deg: number, lng: boolean) {
  // converts decimal degrees to degrees minutes seconds
  const M = 0 | ((deg % 1) * 60e7);
  let degree;
  if (lng) {
    degree = (0 | (deg < 0 ? -deg : deg)).toString().padStart(3, '0');
  } else {
    degree = 0 | (deg < 0 ? -deg : deg);
  }

  let dir = '';
  if (deg < 0) {
    dir = lng ? 'W' : 'S';
  } else {
    dir = lng ? 'E' : 'N';
  }

  return {
    dir,
    deg: degree,
    min: Math.abs(0 | (M / 1e7)),
    sec: Math.abs((0 | (((M / 1e6) % 1) * 6e4)) / 100),
  };
}

export function coordinateToString(coordinate: { lat: number; lon: number }, shortVersion: boolean): string {
  const dmsLat = decimalToDms(coordinate.lat, false);
  const dmsLon = decimalToDms(coordinate.lon, true);

  dmsLon.deg = Number(dmsLon.deg);
  dmsLat.sec = Math.ceil(Number(dmsLat.sec / 100));
  dmsLon.sec = Math.ceil(Number(dmsLon.sec / 100));

  if (shortVersion) {
    if (dmsLat.dir === 'N') {
      if (dmsLon.dir === 'E') {
        return `${dmsLat.deg}N${dmsLon.deg}`;
      }
      return `${dmsLat.deg}${dmsLon.deg}N`;
    }
    if (dmsLon.dir === 'E') {
      return `${dmsLat.deg}${dmsLon.deg}S`;
    }
    return `${dmsLat.deg}W${dmsLon.deg}`;
  }

  const lat = `${dmsLat.deg}°${dmsLat.min}.${dmsLat.sec}${dmsLat.dir}`;
  const lon = `${dmsLon.deg}°${dmsLon.min}.${dmsLon.sec}${dmsLon.dir}`;
  return `${lat}/${lon}`;
}
