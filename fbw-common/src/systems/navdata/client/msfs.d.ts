/* eslint-disable max-classes-per-file */
declare function RegisterViewListener(name: string);

declare class Coherent {
  public static call(method: string, ...args: any): any;

  // @todo returns clear method in an object
  public static on(event: string, callback: Function): any;
}

declare class Utils {
  public static Translate(str: string): string;
}

declare class Facilities {
  public static getMagVar(lat: number, lon: number): number;
}

type SimVarTypes = 'string' | 'number' | 'boolean';

type SimVarType<T> = T extends 'string' ? string : T extends 'number' ? number : T extends 'boolean' ? boolean : any;
