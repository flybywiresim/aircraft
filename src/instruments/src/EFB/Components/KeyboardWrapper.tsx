import React, { useState } from 'react';
import Keyboard, { KeyboardInput } from 'react-simple-keyboard';
import '../Assets/Keyboard.scss';

interface KeyboardWrapperProps {
  onChangeAll: (inputObj: KeyboardInput, e?: MouseEvent) => any;
  keyboardRef: any;
  setOpen: (value: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const KeyboardWrapper = ({ onChangeAll, keyboardRef, setOpen, inputRef }: KeyboardWrapperProps) => {
    const [layoutName, setLayoutName] = useState('default');

    const onKeyPress = (button: string) => {
        if (button === '{shift}' || button === '{lock}') {
            setLayoutName(layoutName === 'default' ? 'shift' : 'default');
        }
        if (button === '{enter}') {
            if (inputRef.current) {
                inputRef.current.blur();
            }
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
                preventMouseDownDefault
                layoutName={layoutName}
                onChangeAll={onChangeAll}
                onKeyPress={onKeyPress}
            />
        </div>
    );
};
