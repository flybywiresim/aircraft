import React, { FC, MouseEventHandler } from 'react';

import Button, { BUTTON_TYPE } from '../UtilComponents/Button/Button';

export interface FailureButtonProps {
    name: string,
    isActive: boolean,
    isChanging: boolean,
    onClick: MouseEventHandler<HTMLButtonElement>
}

export const FailureButton: FC<FailureButtonProps> = ({ name, isActive, isChanging, onClick }) => {
    let type: BUTTON_TYPE;
    if (isChanging) {
        type = BUTTON_TYPE.NONE;
    } else {
        type = isActive ? BUTTON_TYPE.RED : BUTTON_TYPE.GREEN;
    }
    return (
        <Button
            onClick={onClick}
            type={type}
            disabled={isChanging}
            className="my-1 mx-1 h-36"
        >
            <span>{name}</span>
        </Button>
    );
};
