// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Metar as FbwApiMetar } from '@flybywiresim/api-client';
import { ConfigWeatherMap, NXDataStore } from '@flybywiresim/fbw-sdk';
import { Metar as MsfsMetar } from '@microsoft/msfs-sdk';
import { BeyondATCConnector, SayIntentionsConnector } from '../../../../datalink/router/src';
import { t } from '../Localization/translation';

export const mapMetarErrorToDisplayMessage = (error: unknown): string => {
  const errorMessage = `${error}`.replace(/^Error: /, '');

  if (errorMessage.startsWith('Unexpected') || errorMessage.startsWith('Invalid')) {
    return `${t('Dashboard.ImportantInformation.Weather.MetarParsingError')}: ${errorMessage.toUpperCase()}`;
  }

  if (errorMessage === 'No METAR available') {
    return t('Dashboard.ImportantInformation.Weather.IcaoInvalid');
  }

  return errorMessage;
};

export const fetchRawMetarBySource = async (icao: string): Promise<string> => {
  const source = NXDataStore.getSetting('CONFIG_METAR_SRC').get();
  if (source === ConfigWeatherMap.BEYONDATC) {
    const response = await BeyondATCConnector.getMetar(icao);
    if (!response.metar) {
      throw new Error('BEYONDATC METAR NOT AVAILABLE');
    }

    return response.metar;
  }

  if (source === ConfigWeatherMap.SAI) {
    const response = await SayIntentionsConnector.getMetar(icao);
    if (!response.metar) {
      throw new Error('SAI METAR NOT AVAILABLE');
    }

    return response.metar;
  }

  if (source === ConfigWeatherMap.MSFS) {
    const metar = await Coherent.call('GET_METAR_BY_IDENT', icao);
    const msfsMetar = metar as MsfsMetar;

    if (msfsMetar.icao !== icao.toUpperCase()) {
      throw new Error('No METAR available');
    }

    return msfsMetar.metarString;
  }

  const response = await FbwApiMetar.get(icao, source);
  if (!response.metar) {
    throw new Error('No METAR available');
  }

  return response.metar;
};
