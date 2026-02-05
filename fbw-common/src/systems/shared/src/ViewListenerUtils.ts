export class ViewListenerUtils {
  public static getListener(listenerName: string, singleton = true): Promise<ViewListener.ViewListener> {
    return new Promise((resolve, reject) => {
      let listener: ViewListener.ViewListener | undefined;
      // eslint-disable-next-line prefer-const
      listener = RegisterViewListener(listenerName, () => (listener ? resolve(listener) : reject()), singleton);
    });
  }
}
