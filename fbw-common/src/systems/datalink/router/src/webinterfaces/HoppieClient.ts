import { Cpdlc } from './Cpdlc';
import { CpdlcMessageDto } from './CpdlcMessageDto';

export class HoppieClient {
  static async getData(dto: CpdlcMessageDto): Promise<Cpdlc> {
    const packet = `${dto.packet !== undefined ? `&packet=${encodeURIComponent(dto.packet)}` : ''}`;

    const getRequestData: RequestInit = {
      headers: { Accept: 'text/plain' },
      method: 'GET',
    };

    return fetch(
      /* `http://localhost:8010/proxy/acars/system/connect.html?from=${dto.from}&to=${dto.to}&type=${dto.type}${packet}`, */
      `http://localhost:57698/acars/system/connect.html?from=${dto.from}&to=${dto.to}&type=${dto.type}${packet}`,
      getRequestData,
    )
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
    /*  return this.http
      .get<string>(
        `http://www.hoppie.nl/acars/system/connect.html?logon=${dto.logon}&from=${dto.from}&to=${dto.to}&type=${dto.type}${packet}`,
      )
      .pipe(
        map((response) => {
          if (!response.data) {
            throw this.generateNotAvailableException('Empty response');
          }

          return { response: response.data };
        }),
        catchError((err) => {
          throw this.generateNotAvailableException(err);
        }),
      )
      .toPromise(); */
  }

  static generateNotAvailableException(err: any): Error {
    const exception = new Error(`error ${err}`);
    return exception;
  }
}
