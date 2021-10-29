import React, { FC, MouseEventHandler } from 'react';

import Button, { BUTTON_TYPE } from '../Components/Button/Button';

export interface FailureButtonProps {
    name: string,
    isActive: boolean,
    isChanging: boolean,
    onClick: MouseEventHandler<HTMLButtonElement>
}

export const FailureButton: FC<FailureButtonProps> = ({ name, isActive, isChanging, onClick }) => {
    let type: BUTTON_TYPE | undefined;
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
            className="mx-2 my-2"
        >
            <span>{name}</span>
        </Button>
    );
};
