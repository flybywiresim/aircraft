import React, { useState } from 'react';
import Keyboard, { KeyboardInput } from 'react-simple-keyboard';
import '../Assets/Keyboard.scss';

interface KeyboardWrapperProps {
  onChangeAll: (inputObj: KeyboardInput, e?: MouseEvent | undefined) => any;
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
        <div className="shadow-lg">
            <Keyboard
                keyboardRef={(r) => {
                    keyboardRef.current = r;
                }}
                layoutName={layoutName}
                onChangeAll={onChangeAll}
                onKeyPress={onKeyPress}
            />
        </div>
    );
};
