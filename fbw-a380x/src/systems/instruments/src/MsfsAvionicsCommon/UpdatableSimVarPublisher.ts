import { SimVarDefinition, SimVarPublisher } from '@microsoft/msfs-sdk';

export class UpdatableSimVarPublisher<T> extends SimVarPublisher<T> {
  /**
   * Change the simvar read for a given key.
   * @param key The key of the simvar in simVarMap
   * @param value The new value to set the simvar to.
   * @deprecated Removed upstream and won't be needed when DMC switching implemented properly
   */
  public updateSimVarSource(key: keyof T & string, value: SimVarDefinition): void {
    this.resolvedSimVars.set(key, value);
  }
}
