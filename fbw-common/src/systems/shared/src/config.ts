/** Mapping from FBW config weather providers to FBW API weather sources or 3rd party services. */
export enum ConfigWeatherMap {
  FAA = 'faa',
  IVAO = 'ivao',
  MSFS = 'ms',
  NOAA = 'aviationweather',
  PILOTEDGE = 'pilotedge',
  VATSIM = 'vatsim',
  BEYONDATC = 'BEYONDATC',
  SAI = 'SAI',
}

export const CONFIG_ATIS_WEATHER_SOURCES = [
  ConfigWeatherMap.FAA,
  ConfigWeatherMap.IVAO,
  ConfigWeatherMap.PILOTEDGE,
  ConfigWeatherMap.VATSIM,
  ConfigWeatherMap.BEYONDATC,
  ConfigWeatherMap.SAI,
] as const;

export const CONFIG_METAR_WEATHER_SOURCES = [
  ConfigWeatherMap.MSFS,
  ConfigWeatherMap.NOAA,
  ConfigWeatherMap.PILOTEDGE,
  ConfigWeatherMap.VATSIM,
  ConfigWeatherMap.BEYONDATC,
  ConfigWeatherMap.SAI,
] as const;

export const CONFIG_TAF_WEATHER_SOURCES = [ConfigWeatherMap.MSFS, ConfigWeatherMap.NOAA] as const;

export type ConfigAtisSource = (typeof CONFIG_ATIS_WEATHER_SOURCES)[number];
export type ConfigSelectableAtisSource = (typeof CONFIG_ATIS_WEATHER_SOURCES)[number];
export type ConfigMetarSource = (typeof CONFIG_METAR_WEATHER_SOURCES)[number];
export type ConfigTafSource = (typeof CONFIG_TAF_WEATHER_SOURCES)[number];
