// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useRef, useState } from 'react';
import Keyboard, { KeyboardInput } from 'react-simple-keyboard';
import '../Assets/Keyboard.scss';
import SimpleKeyboardLayouts from 'simple-keyboard-layouts';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { useAppSelector } from '../Store/store';

interface KeyboardWrapperProps {
  onChangeAll: (inputObj: KeyboardInput, e?: MouseEvent) => any;
  keyboardRef: any;
  setOpen: (value: boolean) => void;
  blurInput: () => void;
  onKeyDown?: (buttonName: string) => void;
}

export const keyboardLayoutOptions = [
  // Standard
  { name: 'english', alias: 'English' },
  // Alternatives
  { name: 'arabic', alias: 'العربية' },
  { name: 'chinese', alias: '中文键盘' },
  { name: 'czech', alias: 'Čeština' },
  { name: 'french', alias: 'Français' },
  { name: 'german', alias: 'Deutsch' },
  { name: 'greek', alias: 'Ελληνικά' },
  { name: 'hebrew', alias: 'עִבְרִית' },
  { name: 'hindi', alias: 'हिंदी' },
  { name: 'italian', alias: 'Italiano' },
  { name: 'japanese', alias: '日本語' },
  { name: 'korean', alias: '한국어' },
  { name: 'norwegian', alias: 'Norsk' },
  { name: 'polish', alias: 'Polski' },
  { name: 'russian', alias: 'Русский' },
  { name: 'spanish', alias: 'Español' },
  { name: 'swedish', alias: 'Svenska' },
  { name: 'thai', alias: 'ไทย' },
  { name: 'turkish', alias: 'Türkçe' },
];

export const KeyboardWrapper = ({ onChangeAll, keyboardRef, setOpen, blurInput, onKeyDown }: KeyboardWrapperProps) => {
  const [currentLayoutIdentifier] = usePersistentProperty('EFB_KEYBOARD_LAYOUT_IDENT', 'english');
  const [currentLayout] = useState(() => new SimpleKeyboardLayouts().get(currentLayoutIdentifier));
  const [currentLayoutName, setCurrentLayoutName] = useState('default');

  const { offsetY } = useAppSelector((state) => state.keyboard);
  const [offsetX, setOffsetX] = useState(0);
  const [verticalDeviation, setVerticalDeviation] = useState(0);
  const keyboardWrapperRef = useRef<HTMLDivElement>(null);

  const onKeyPress = (button: string) => {
    if (button === '{shift}' || button === '{lock}') {
      setCurrentLayoutName(currentLayoutName === 'default' ? 'shift' : 'default');
    }
    if (button === '{enter}') {
      blurInput();
      setOpen(false);
    }
    onKeyDown?.(button);
  };

  useEffect(() => {
    if (!keyboardWrapperRef.current) {
      return;
    }

    const { left, bottom } = keyboardWrapperRef.current.getBoundingClientRect();
    setVerticalDeviation(window.innerHeight - bottom);
    setOffsetX(-left);
  }, []);

  return (
    <div
      className="fixed bottom-0 z-50 m-0 w-[1430px] shadow-lg"
      style={{ transform: `translate(${offsetX}px, ${verticalDeviation - offsetY}px)` }}
      ref={keyboardWrapperRef}
    >
      <Keyboard
        keyboardRef={(r) => {
          keyboardRef.current = r;
        }}
        layoutName={currentLayoutName}
        preventMouseDownDefault
        onChangeAll={onChangeAll}
        onKeyPress={onKeyPress}
        {...currentLayout}
      />
    </div>
  );
};
