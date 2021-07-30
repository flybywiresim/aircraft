import { Failure } from '@flybywiresim/failures';
import React, { FC, MouseEventHandler } from 'react';

import Button, { BUTTON_TYPE } from '../Components/Button/Button';

export interface FailureButtonProps {
    failure: Readonly<Failure>,
    onClick: MouseEventHandler<HTMLButtonElement>
}

export const FailureButton: FC<FailureButtonProps> = ({ failure, onClick }) => {
    let type: BUTTON_TYPE | undefined;
    if (failure.isChanging) {
        type = BUTTON_TYPE.NONE;
    } else {
        type = failure.isActive ? BUTTON_TYPE.RED : BUTTON_TYPE.GREEN;
    }
    return (
        <Button
            onClick={onClick}
            type={type}
            disabled={failure.isChanging}
        >
            <span>{failure.name}</span>
        </Button>
    );
};
