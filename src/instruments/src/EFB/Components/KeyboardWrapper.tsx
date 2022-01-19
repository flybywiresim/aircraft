import React, { useState } from 'react';
import Keyboard, { KeyboardInput } from 'react-simple-keyboard';
import '../Assets/Keyboard.scss';
import SimpleKeyboardLayouts from 'simple-keyboard-layouts';
import { usePersistentProperty } from '@instruments/common/persistence';

interface KeyboardWrapperProps {
  onChangeAll: (inputObj: KeyboardInput, e?: MouseEvent) => any;
  keyboardRef: any;
  setOpen: (value: boolean) => void;
  blurInput: () => void;
}

export const KeyboardWrapper = ({ onChangeAll, keyboardRef, setOpen, blurInput }: KeyboardWrapperProps) => {
    // TODO: Write to this property using a dropdown in settings later on
    const [currentLayoutIdentifier] = usePersistentProperty('EFB_KEYBOARD_LAYOUT_IDENT', 'english');
    const [currentLayout] = useState(() => new SimpleKeyboardLayouts().get(currentLayoutIdentifier));
    const [currentLayoutName, setCurrentLayoutName] = useState('default');

    const onKeyPress = (button: string) => {
        if (button === '{shift}' || button === '{lock}') {
            setCurrentLayoutName(currentLayoutName === 'default' ? 'shift' : 'default');
        }
        if (button === '{enter}') {
            blurInput();
            setOpen(false);
        }
    };

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-50 m-0 shadow-lg"
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
