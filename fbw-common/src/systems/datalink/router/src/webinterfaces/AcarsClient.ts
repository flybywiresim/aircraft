import { NXDataStore } from '@flybywiresim/fbw-sdk';

import { Cpdlc } from './Cpdlc';
import { CpdlcMessageDto } from './CpdlcMessageDto';

const ACARS_PROVIDER_ENDPOINTS: Record<string, string> = {
  HOPPIE: 'https://www.hoppie.nl/acars/system/connect.html',
  BATC: 'http://localhost:57698/acars/system/connect.html',
  SAI: 'https://acars.sayintentions.ai/acars/system/connect.html',
};

const PROVIDER_LOGON_CONFIG: Record<
  string,
  { legacyKey: string; missingMessage: string; validationUrl?: (key: string) => string }
> = {
  SAI: {
    legacyKey: 'CONFIG_SAI_LOGON_KEY',
    missingMessage: 'Missing SAI logon key',
    validationUrl: (key: string) => `https://portal.sayintentions.ai/api/mep/validateKey?key=${key}`,
  },
  HOPPIE: { legacyKey: 'CONFIG_HOPPIE_USERID', missingMessage: 'Missing Hoppie user ID' },
};

export class AcarsClient {
  static async getData(dto: CpdlcMessageDto): Promise<Cpdlc> {
    const acarsProvider = NXDataStore.getSetting('ACARS_PROVIDER').get();
    const baseUrl = ACARS_PROVIDER_ENDPOINTS[acarsProvider];
    const logonConfig = PROVIDER_LOGON_CONFIG[acarsProvider];

    const params = new URLSearchParams();

    if (logonConfig) {
      const logon = NXDataStore.getLegacy(logonConfig.legacyKey, '');
      if (!logon) {
        throw AcarsClient.generateNotAvailableException(logonConfig.missingMessage);
      }

      if (acarsProvider === 'SAI' && logonConfig.validationUrl) {
        await AcarsClient.validateSayIntentionsKey(logonConfig.validationUrl(logon));
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
          throw AcarsClient.generateNotAvailableException('Empty response');
        }
        if (data.includes('error {invalid logon code}')) {
          throw AcarsClient.generateNotAvailableException('Invalid Hoppie User ID');
        }
        return { response: data };
      })
      .catch((err) => {
        throw AcarsClient.generateNotAvailableException(err);
      });
  }

  private static async validateSayIntentionsKey(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw AcarsClient.generateNotAvailableException(`Validation server returned ${response.status}`);
      }

      const result = (await response.json()) as { is_valid: number; flight_id: number };

      if (!result.is_valid) {
        throw AcarsClient.generateNotAvailableException('Invalid SAI API Key');
      }
    } catch (err) {
      throw AcarsClient.generateNotAvailableException(`Validation failed: ${err}`);
    }
  }

  static generateNotAvailableException(err: any): Error {
    const exception = new Error(`error ${err}`);
    return exception;
  }
}
