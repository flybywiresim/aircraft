/**
 * A model for maps. Specific functionality is added by adding one or more modules to the model. Each module added to
 * the model is assigned a name which is used to retrieve it from the model.
 */
export class MapModel<M> {
  private readonly modules = new Map<string, any>();

  /**
   * Gets a module from this model.
   * @param name The name of the module.
   * @returns A module.
   */
  public getModule<K extends keyof M & string>(name: K): M[K];

  /**
   * Gets a module instance from the model and assigns it
   * to the provided type.
   * @param module The module to get.
   * @returns The requested map data module.
   */
  public getModule<T>(module: new (...args: any) => T): T;

  /**
   * Gets a module instance from the model and assigns it
   * to the provided type.
   * @param nameOrModule The module to get or the name of the module.
   * @returns The requested map data module.
   * @throws An error if
   */
  public getModule<K extends keyof M & string, T>(nameOrModule: K | (new (...args: any) => T)): M[K] | T {
    if (typeof nameOrModule === 'string') {
      return this.modules.get(nameOrModule);
    } else if (typeof nameOrModule === 'function') {
      return this.modules.get(nameOrModule.name as any) as T;
    }

    throw new Error('Invalid type supplied: must be a string key or a module constructor.');
  }

  /**
   * Adds a module to this model.
   * @param name The name of the module to add.
   * @param module The module to add.
   */
  public addModule<K extends keyof M & string>(name: K, module: M[K]): void {
    if (this.modules.has(name)) {
      return;
    }

    this.modules.set(name, module);
  }
}