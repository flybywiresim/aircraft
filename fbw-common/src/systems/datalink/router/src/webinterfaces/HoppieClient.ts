import { NXDataStore } from '@flybywiresim/fbw-sdk';

import { Cpdlc } from './Cpdlc';
import { CpdlcMessageDto } from './CpdlcMessageDto';

const HOPPIE_PROVIDER_ENDPOINTS: Record<string, string> = {
  HOPPIE: 'https://www.hoppie.nl/acars/system/connect.html',
  BATC: 'http://localhost:57698/acars/system/connect.html',
  SAI: 'https://acars.sayintentions.ai/acars/system/connect.html',
};

const PROVIDER_LOGON_CONFIG: Record<string, { legacyKey: string; missingMessage: string }> = {
  SAI: { legacyKey: 'CONFIG_SAI_LOGON_KEY', missingMessage: 'Missing SAI logon key' },
  HOPPIE: { legacyKey: 'CONFIG_HOPPIE_USERID', missingMessage: 'Missing Hoppie user ID' },
};

export class HoppieClient {
  static async getData(dto: CpdlcMessageDto): Promise<Cpdlc> {
    const acarsProvider = NXDataStore.getSetting('ACARS_PROVIDER').get();
    const baseUrl = HOPPIE_PROVIDER_ENDPOINTS[acarsProvider];
    const logonConfig = PROVIDER_LOGON_CONFIG[acarsProvider];

    const params = new URLSearchParams();

    if (logonConfig) {
      const logon = NXDataStore.getLegacy(logonConfig.legacyKey, '');
      if (!logon) {
        throw HoppieClient.generateNotAvailableException(logonConfig.missingMessage);
      }
      params.append('logon', logon);
    }

    params.append('from', dto.from);
    params.append('to', dto.to);
    params.append('type', dto.type);
    if (dto.packet) {
      params.append('packet', dto.packet);
    }

    const requestUrl = `${baseUrl}?${params.toString()}`;

    const getRequestData: RequestInit = {
      headers: { Accept: 'text/plain' },
      method: 'GET',
    };

    return fetch(requestUrl, getRequestData)
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        if (!data) {
          throw HoppieClient.generateNotAvailableException('Empty response');
        }
        return { response: data };
      })
      .catch((err) => {
        throw HoppieClient.generateNotAvailableException(err);
      });
  }

  static generateNotAvailableException(err: any): Error {
    const exception = new Error(`error ${err}`);
    return exception;
  }
}
