export class NavigraphKeys {
  private static clientId = process.env.CLIENT_ID;

  private static clientSecret = process.env.CLIENT_SECRET;

  public static get hasSufficientEnv() {
    if (NavigraphKeys.clientSecret === undefined || NavigraphKeys.clientId === undefined) {
      return false;
    }
    return !(NavigraphKeys.clientSecret === '' || NavigraphKeys.clientId === '');
  }

  // public async amdbCall(query: string): Promise<string> {
  //   const callResp = await fetch(`https://amdb.api.navigraph.com/v1/${query}`, {
  //     headers: {
  //       Authorization: `Bearer ${this.accessToken}`,
  //     },
  //   });
  //
  //   if (callResp.ok) {
  //     return callResp.text();
  //   }
  //
  //   // Unauthorized
  //   if (callResp.status === 401) {
  //     await this.getToken();
  //
  //     return this.amdbCall(query);
  //   }
  //
  //   return Promise.reject();
  // }
}
