import { NXDataStore } from '@flybywiresim/fbw-sdk';

import { Cpdlc } from './Cpdlc';
import { CpdlcMessageDto } from './CpdlcMessageDto';
import { MutableSubscribable } from '@microsoft/msfs-sdk';

const HOPPIE_PROVIDER_ENDPOINTS: Record<string, string> = {
  HOPPIE: 'https://www.hoppie.nl/acars/system/connect.html',
  BATC: 'http://localhost:57698/acars/system/connect.html',
  SAI: 'https://acars.sayintentions.ai/acars/system/connect.html',
};

export class HoppieClient {
  private static acarsProvider: MutableSubscribable<'NONE' | 'HOPPIE' | 'BATC' | 'SAI'>;
  static async getData(dto: CpdlcMessageDto): Promise<Cpdlc> {
    if (!this.acarsProvider) {
      this.acarsProvider = NXDataStore.getSetting('ACARS_PROVIDER');
    }

    const baseUrl = HOPPIE_PROVIDER_ENDPOINTS[this.acarsProvider.get()] ?? HOPPIE_PROVIDER_ENDPOINTS.HOPPIE;

    const params = new URLSearchParams();
    if (this.acarsProvider.get() === 'SAI') {
      params.append('logon', NXDataStore.getLegacy('CONFIG_SAI_LOGON_KEY', ''));
    } else if (this.acarsProvider.get() === 'HOPPIE') {
      params.append('logon', NXDataStore.getLegacy('CONFIG_HOPPIE_USERID', ''));
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
