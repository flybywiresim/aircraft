// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useRef } from 'react';
import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
// Imported directly to avoid bundling unrelated FSComponent code into React instruments
import {
  OnScreenKeyboard,
  OnScreenKeyboardLayout,
  OnScreenKeyboardProps,
} from '../../MsfsAvionicsCommon/UiWidgets/OnScreenKeyboard';
import { store } from '../Store/store';
import { setOffsetY } from '../Store/features/keyboard';

export { OSK_EFB_LAYOUT, OSK_OIT_LAYOUT } from '../../MsfsAvionicsCommon/UiWidgets/OnScreenKeyboard';

type KeyHandler = { current?: (key: string, text: string) => void };

const activeKeyHandler = Subject.create<KeyHandler | null>(null);

let mountedKeyboard: OnScreenKeyboard | null = null;

export const showOnScreenKeyboard = (handler: KeyHandler, field: Element) => {
  activeKeyHandler.set(handler);
  store.dispatch(setOffsetY(mountedKeyboard?.coveredHeight(field) ?? 0));
};

export const hideOnScreenKeyboard = (handler: KeyHandler) => {
  if (activeKeyHandler.get() === handler) {
    activeKeyHandler.set(null);
    store.dispatch(setOffsetY(0));
  }
};

export const KeyboardWrapper = ({ layout }: { layout: OnScreenKeyboardLayout }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const keyboardRef = FSComponent.createRef<OnScreenKeyboard>();
    const visible = activeKeyHandler.map((handler) => handler !== null);
    const props: OnScreenKeyboardProps = {
      ref: keyboardRef,
      layout,
      visible,
      onKey: (key, text) => activeKeyHandler.get()?.current?.(key, text),
    };
    FSComponent.render(FSComponent.buildComponent(OnScreenKeyboard, props) as VNode, containerRef.current);
    mountedKeyboard = keyboardRef.instance;

    return () => {
      mountedKeyboard = null;
      keyboardRef.instance.destroy();
      visible.destroy();
    };
  }, []);

  return <div ref={containerRef} />;
};
