import React from 'react';
import classNames from 'classnames';

export enum BUTTON_TYPE {BLUE, BLUE_OUTLINE, GREEN, GREEN_OUTLINE, RED, RED_OUTLINE, NONE}

type props = {
    text?: string,
    type?: BUTTON_TYPE,
    onClick: (e?) => any,
    className?: any,
    id?: any,
    disabled?,
    children?: any
};

const Button = ({ text, type = BUTTON_TYPE.BLUE, onClick, className, ...props }: props) => (
    <button
        type="button"
        onMouseDown={onClick}
        className={classNames([
            {
                'bg-blue-500 border-blue-500': type === BUTTON_TYPE.BLUE,
                'border-blue-500 text-blue-500': type === BUTTON_TYPE.BLUE_OUTLINE,
                'bg-green-500 border-green-500': type === BUTTON_TYPE.GREEN,
                'border-green-500 text-green-500': type === BUTTON_TYPE.GREEN_OUTLINE,
                'bg-red-500 border-red-500': type === BUTTON_TYPE.RED,
                'border-red-500 text-red-500': type === BUTTON_TYPE.RED_OUTLINE,
                '': type === BUTTON_TYPE.NONE,
            },
            'py-2 px-4 flex items-center justify-center rounded-lg focus:outline-none border-4',
            className,
        ])}
        {...props}
    >
        {props.children}

        {text}
    </button>
);

export default Button;
