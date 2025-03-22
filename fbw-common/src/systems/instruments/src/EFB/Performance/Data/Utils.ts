export const WIND_MAGNITUDE_ONLY_REGEX = /^(TL|HD|T|H|\+|-)?(\d{1,2}(?:\.\d)?)$/;
export const WIND_MAGNITUDE_AND_DIR_REGEX = /^(\d{1,3})\/(\d{1,2}(?:\.\d)?)$/;

export const isWindMagnitudeOnly = (input: string): boolean => {
  const magnitudeOnlyMatch = input.match(WIND_MAGNITUDE_ONLY_REGEX);
  return magnitudeOnlyMatch !== null && (magnitudeOnlyMatch[1] !== '' || input === '0');
};

export const isWindMagnitudeAndDirection = (input: string): boolean => {
  const magnitudeOnlyMatch = input.match(WIND_MAGNITUDE_AND_DIR_REGEX);
  return magnitudeOnlyMatch !== null;
};

export const isValidIcao = (icao: string): boolean => icao?.length === 4;
