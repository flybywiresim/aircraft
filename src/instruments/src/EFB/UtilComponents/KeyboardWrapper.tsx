import React, { useState } from 'react';
import Keyboard, { KeyboardInput } from 'react-simple-keyboard';
import '../Assets/Keyboard.scss';
import SimpleKeyboardLayouts from 'simple-keyboard-layouts';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useAppSelector } from '../Store/store';

interface KeyboardWrapperProps {
  onChangeAll: (inputObj: KeyboardInput, e?: MouseEvent) => any;
  keyboardRef: any;
  setOpen: (value: boolean) => void;
  blurInput: () => void;
  onKeyDown?: (buttonName: string) => void;
}

export const keyboardLayoutOptions = [
    {
        name: 'english',
        alias: 'English',
    },
    {
        name: 'spanish',
        alias: 'Español',
    },
    {
        name: 'german',
        alias: 'Deutsch',
    },
    {
        name: 'french',
        alias: 'Français',
    },
    {
        name: 'arabic',
        alias: 'العربية',
    },
    {
        name: 'italian',
        alias: 'Italiano',
    },
    {
        name: 'korean',
        alias: '한국어',
    },
    {
        name: 'japanese',
        alias: '日本語',
    },
    {
        name: 'thai',
        alias: 'ไทย',
    },
];

export const KeyboardWrapper = ({ onChangeAll, keyboardRef, setOpen, blurInput, onKeyDown }: KeyboardWrapperProps) => {
    // TODO: Write to this property using a dropdown in settings later on
    const [currentLayoutIdentifier] = usePersistentProperty('EFB_KEYBOARD_LAYOUT_IDENT', 'english');
    const [currentLayout] = useState(() => new SimpleKeyboardLayouts().get(currentLayoutIdentifier));
    const [currentLayoutName, setCurrentLayoutName] = useState('default');

    const { offsetY } = useAppSelector((state) => state.keyboard);

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

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-50 m-0 shadow-lg"
            style={{ transform: `translateY(${offsetY}px)` }}
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
