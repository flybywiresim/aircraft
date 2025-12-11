// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MutableSubscribable, Subscribable } from '@microsoft/msfs-sdk';

import { useCallback, useEffect, useState } from 'react';

/**
 * Exposes a subscribable as a reactive state
 * @param subscribable the subscribable to use
 */
export const useSubscribable = <T,>(subscribable: Subscribable<T>) => {
  const [state, setState] = useState(subscribable.get());

  useEffect(() => {
    const subscription = subscribable.sub(() => {
      setState(subscribable.get());
    });

    return () => subscription.destroy();
  }, [subscribable]);

  return state;
};

/**
 * Exposes a mutable subscribable as a settable reactive state
 * @param subscribable the subscribable to use
 */
export const useMutableSubscribable = <T,>(subscribable: MutableSubscribable<T>) => {
  const [state, setState] = useState(subscribable.get());

  useEffect(() => {
    const subscription = subscribable.sub(() => {
      setState(subscribable.get());
    }, true);

    return () => subscription.destroy();
  }, [subscribable]);

  const setValue = useCallback(
    (value: T) => {
      subscribable.set(value);
    },
    [subscribable],
  );

  return [state, setValue] as const;
};
