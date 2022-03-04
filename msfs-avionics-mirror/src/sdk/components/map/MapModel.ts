/**
 * A model for maps. Specific functionality is added by adding one or more modules to the model. Each module added to
 * the model is assigned a name which is used to retrieve it from the model.
 */
export class MapModel<M> {
  private readonly modules = new Map<keyof M, any>();

  /**
   * Gets a module from this model.
   * @param name The name of the module.
   * @returns A module.
   */
  public getModule<K extends keyof M>(name: K): M[K] {
    return this.modules.get(name);
  }

  /**
   * Adds a module to this model.
   * @param name The name of the module to add.
   * @param module The module to add.
   */
  public addModule<K extends keyof M>(name: K, module: M[K]): void {
    if (this.modules.has(name)) {
      return;
    }

    this.modules.set(name, module);
  }
}