import { useEffect, useState } from 'react';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

/**
 * This hook allows to read and set a persistent storage property.
 * Overloads are provided to absolve callers with defaults from dealing with possibly undefined
 */
export function usePersistentProperty(propertyName: string, defaultValue: string): [string, (value: string) => void];
export function usePersistentProperty(
  propertyName: string,
  defaultValue?: string,
): [string | undefined, (value: string) => void];
export function usePersistentProperty(propertyName: string, defaultValue?: string): any {
  const [propertyValue, rawPropertySetter] = useState(() => NXDataStore.get(propertyName, defaultValue));

  useEffect(() => {
    const unsubscribe = NXDataStore.subscribe(propertyName, (key, value) => rawPropertySetter(value));
    return () => {
      unsubscribe();
    };
  }, []);

  const propertySetter = (value: string) => {
    NXDataStore.set(propertyName, value);
    rawPropertySetter(value);
  };

  return [propertyValue, propertySetter];
}

/**
 * This hook allows to read and set a persistent storage property as a number.
 * Overloads are provided to absolve callers with defaults from dealing with possibly undefined
 */
export function usePersistentNumberProperty(
  propertyName: string,
  defaultValue: number,
): [number, (value: number) => void];
export function usePersistentNumberProperty(
  propertyName: string,
  defaultValue?: number,
): [number | undefined, (value: number) => void];
export function usePersistentNumberProperty(propertyName: string, defaultValue?: number): any {
  const [strPropertyValue, strPropertySetter] = usePersistentProperty(
    propertyName,
    defaultValue !== undefined ? `${defaultValue}` : undefined,
  );

  const propertyValue = strPropertyValue !== undefined ? parseInt(strPropertyValue) : undefined;
  const propertySetter = (value: number) => strPropertySetter(`${value}`);

  return [propertyValue, propertySetter];
}
