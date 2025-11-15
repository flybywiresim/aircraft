// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DataStoreSettingKey, LegacyDataStoreSettingKey, NXDataStore } from '@flybywiresim/fbw-sdk';

import { useEffect, useState } from 'react';

import { useMutableSubscribable } from './subscribables';

/**
 * Exposes a DataStore setting as a settable reactive state
 * @param key the key of the setting
 */
export const usePersistentSetting = <k extends DataStoreSettingKey>(key: k) =>
  useMutableSubscribable(NXDataStore.getSetting(key));

/**
 * This hook allows to read and set a persistent storage property.
 * Overloads are provided to absolve callers with defaults from dealing with possibly undefined
 *
 * @deprecated
 */
export function usePersistentProperty<k extends string>(
  propertyName: LegacyDataStoreSettingKey<k>,
  defaultValue: string,
): [string, (value: string) => void];
export function usePersistentProperty<k extends string>(
  propertyName: LegacyDataStoreSettingKey<k>,
  defaultValue?: string,
): [string | undefined, (value: string) => void];
export function usePersistentProperty(propertyName: string, defaultValue?: string): any {
  const [propertyValue, rawPropertySetter] = useState(() => NXDataStore.getLegacy(propertyName, defaultValue));

  useEffect(() => {
    const unsubscribe = NXDataStore.subscribeLegacy(propertyName, (key, value) => rawPropertySetter(value));
    return () => {
      unsubscribe();
    };
  }, []);

  const propertySetter = (value: string) => {
    NXDataStore.setLegacy(propertyName, value);
    rawPropertySetter(value);
  };

  return [propertyValue, propertySetter];
}

/**
 * This hook allows to read and set a persistent storage property as a number.
 * Overloads are provided to absolve callers with defaults from dealing with possibly undefined
 *
 * @deprecated
 */
export function usePersistentNumberProperty<k extends string>(
  propertyName: LegacyDataStoreSettingKey<k>,
  defaultValue: number,
): [number, (value: number) => void];
export function usePersistentNumberProperty<k extends string>(
  propertyName: LegacyDataStoreSettingKey<k>,
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

/**
 * This hook allows to read and set a persistent storage property as a boolean.
 * Overloads are provided to absolve callers with defaults from dealing with possibly undefined
 *
 * @deprecated
 */
export function usePersistentBooleanProperty<k extends string>(
  propertyName: LegacyDataStoreSettingKey<k>,
  defaultValue: boolean,
): [boolean, (value: boolean) => void];
export function usePersistentBooleanProperty<k extends string>(
  propertyName: LegacyDataStoreSettingKey<k>,
  defaultValue?: boolean,
): [boolean | undefined, (value: boolean) => void];
export function usePersistentBooleanProperty(propertyName: string, defaultValue?: boolean): any {
  const [strPropertyValue, strPropertySetter] = usePersistentProperty(
    propertyName,
    defaultValue !== undefined ? `${defaultValue ? 'ENABLED' : 'DISABLED'}` : undefined,
  );

  const propertyValue = strPropertyValue !== undefined ? strPropertyValue === 'ENABLED' : undefined;
  const propertySetter = (value: boolean) => strPropertySetter(value ? 'ENABLED' : 'DISABLED');

  return [propertyValue, propertySetter];
}

const getLocalStorage = (propertyName: string, defaultValue?: string) => {
  const value: string | null = localStorage.getItem(propertyName);
  if (value) {
    return value;
  }
  return defaultValue;
};

const getSessionStorage = (propertyName: string, defaultValue?: string) => {
  const value: string | null = sessionStorage.getItem(propertyName);
  if (value) {
    return value;
  }
  return defaultValue;
};

/**
 * This hook allows to read and set a session storage property.
 * Overloads are provided to absolve callers with defaults from dealing with possibly undefined
 */
export function useSessionStorage(propertyName: string, defaultValue: string): [string, (value: string) => void];
export function useSessionStorage(
  propertyName: string,
  defaultValue?: string,
): [string | undefined, (value: string) => void];
export function useSessionStorage(propertyName: string, defaultValue?: string): any {
  const [propertyValue, rawPropertySetter] = useState(() => getSessionStorage(propertyName, defaultValue));

  const propertySetter = (value: string) => {
    sessionStorage.setItem(propertyName, value);
    rawPropertySetter(value);
  };

  return [propertyValue, propertySetter];
}

/**
 * This hook allows to read and set a local storage property.
 * Overloads are provided to absolve callers with defaults from dealing with possibly undefined
 */
export function useLocalStorage(propertyName: string, defaultValue: string): [string, (value: string) => void];
export function useLocalStorage(
  propertyName: string,
  defaultValue?: string,
): [string | undefined, (value: string) => void];
export function useLocalStorage(propertyName: string, defaultValue?: string): any {
  const [propertyValue, rawPropertySetter] = useState(() => getLocalStorage(propertyName, defaultValue));

  const propertySetter = (value: string) => {
    localStorage.setItem(propertyName, value);
    rawPropertySetter(value);
  };

  return [propertyValue, propertySetter];
}
