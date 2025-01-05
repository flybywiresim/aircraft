export class NavigraphKeys {
  private static clientId = process.env.CLIENT_ID;

  private static clientSecret = process.env.CLIENT_SECRET;

  public static get hasSufficientEnv() {
    if (NavigraphKeys.clientSecret === undefined || NavigraphKeys.clientId === undefined) {
      return false;
    }
    return !(NavigraphKeys.clientSecret === '' || NavigraphKeys.clientId === '');
  }
}
