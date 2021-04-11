import { IconLayoutSidebar } from '@tabler/icons';
import React, { useEffect, useState } from 'react';
import { useSplitSimVar } from '../../Common/simVars';
import Button, { BUTTON_TYPE } from '../Components/Button/Button';

interface Props {
    index: number,
    clickCallback,
    selectionCallback,
    id: string,
    tugActive: boolean,
    disabled?
}
export const DoorToggle = (props: Props) => {
    const [doorState, setDoorState] = useSplitSimVar(`A:INTERACTIVE POINT OPEN:${props.index}`, 'Percent over 100', 'K:TOGGLE_AIRCRAFT_EXIT', 'Enum', 500);
    const [previousDoorState, setPreviousDoorState] = useState(doorState);

    useEffect(() => {
        if (props.tugActive && previousDoorState) {
            setDoorState(props.index + 1);
            setPreviousDoorState(!previousDoorState);
        } else if (props.tugActive) {
            setPreviousDoorState(false);
        } else {
            setPreviousDoorState(doorState);
        }
    });

    return (
        <Button
            onClick={(e) => props.clickCallback(() => {
                setDoorState(props.index + 1);
                setPreviousDoorState(true);
            }, e)}
            className={props.selectionCallback('w-32', props.id, doorState, props.id)}
            type={BUTTON_TYPE.NONE}
            id={props.id}
            disabled={props.disabled}
        >
            <IconLayoutSidebar size="2.825rem" stroke="1.5" />
        </Button>
    );
};
