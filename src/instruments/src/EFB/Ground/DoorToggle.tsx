import { IconLayoutSidebar } from '@tabler/icons';
import React from 'react';
import { useSplitSimVar } from '../../Common/simVars';
import Button, { BUTTON_TYPE } from '../Components/Button/Button';

interface Props {
    index: number,
    clickCallback,
    selectionCallback,
    id: string,
    disabled?
}
export const DoorToggle = (props: Props) => {
    const [doorState, setDoorState] = useSplitSimVar(`A:INTERACTIVE POINT OPEN:${props.index}`, 'Percent over 100', 'K:TOGGLE_AIRCRAFT_EXIT', 'Enum', 100);

    return (
        <Button
            onClick={(e) => props.clickCallback(() => setDoorState(props.index + 1), e)}
            className={props.selectionCallback('w-32', props.id, doorState)}
            type={BUTTON_TYPE.NONE}
            id={props.id}
            disabled={props.disabled}
        >
            <IconLayoutSidebar size="2.825rem" stroke="1.5" />

        </Button>
    );
};
