import React, {useEffect, useState} from "react";

import './Input.scss'

type InputProps = {
    type?: 'text',
    value?: any,
    label?: string,
    leftComponent?: any,
    rightComponent?: any,
    onChange?: (value: string) => any
};

function Input({
   type,
   value: propsValue,
   label,
   leftComponent,
   rightComponent,
   onChange: onChangeProps
}: InputProps) {
    const [focusActive, setFocusActive] = useState(false);
    const [value, setValue] = useState(propsValue);

    const onChange = (value) => {
        if(onChangeProps) {
            onChangeProps(value);
        }

        setValue(value);
    };

    useEffect(() => {
        onChange(propsValue);
    }, [propsValue]);

    return (
        <div className={focusActive ? 'default-input-container focus-active' : 'default-input-container'}>
                {leftComponent}

                <div className={"input-row-container"}>
                    {label && value && <span className={'label'}>{label}</span>}

                    <div className={"input-container"}>
                        <input
                            type={type}
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            onFocus={() => setFocusActive(true)}
                            onBlur={() => setFocusActive(false)}
                        />

                        {label && !value && <span className={'placeholder'}>{label}</span>}
                    </div>
                </div>

                {rightComponent}
        </div>
    );
}

export default Input;