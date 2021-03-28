import React, { useEffect, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { NXDataStore } from '../../../Common/persistence';

import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import Input from '../../Components/Form/Input/Input';
import { DEADZONE_REDUCER } from '../../Store';
import { setDeadZone } from '../../Store/action-creator/deadzones';
import { SET_DEADZONE } from '../../Store/actions';
import { DeadZoneState } from '../../Store/reducer/deadzone-reducer';

interface Props {
    upperBoundDetentSetter,
    lowerBoundDetentSetter,
    lowerBoundDetentGetter,
    upperBoundDetentGetter,
    detentValue: number,
    throttleNumber,
    throttlePosition,
    text,
    index,
    disabled,
    deadZone: number
    setDeadZone,
}

const DetentConfig: React.FC<Props> = ({ deadZone1, setDeadZone, ...props }) => {
    // const currentValue = NXDataStore.get(`${props.text}deadzone`, '0.05');
    // console.log(`Stored${currentValue}`);

    // console.log(`CURRET${currentValue}`);

    const [showWarning, setShowWarning] = useState(false);

    const deadZone = NXDataStore.get(`THROTTLE_${props.throttleNumber}DETENT_${props.index}`, '0.05');

    // const deadZone = useSelector((state: DeadZoneState) => state.deadZone);

    const setFromTo = (throttle1Position, settingLower, settingUpper, overrideValue?: string) => {
        const newSetting = overrideValue || throttle1Position;

        settingLower.forEach((f) => f(newSetting < -0.95 ? -1 : newSetting - deadZone));
        settingUpper.forEach((f) => f(newSetting > 0.95 ? 1 : newSetting + deadZone));
    };

    /*    useEffect(() => {
        console.log('BRUH');

        setCurrentValue1(props.upperBoundDetentGetter - props.lowerBoundDetentGetter);
        // setFromTo(props.throttlePosition, props.lowerBoundDetentSetter, props.upperBoundDetentSetter);
    }, [currentValue1, props.upperBoundDetentGetter]); */

    return (
        <div className="mb-4 w-56 justify-between items-center mr-4 p-4">
            <Button
                className="w-full border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 mr-4"
                text="Set From Throttle"
                onClick={() => {
                    setFromTo(props.throttlePosition, props.lowerBoundDetentSetter, props.upperBoundDetentSetter);
                }}
                type={BUTTON_TYPE.NONE}
            />
            <Input
                key={props.index}
                label="Configure Range"
                type="number"
                className="dark-option mt-4"
                value={deadZone}
                onChange={(from) => {
                    if (parseFloat(from) >= 0.01) {
                        // setCurrentValue1(parseFloat(from));
                        // setDeadZone(parseFloat(from), props.index);
                        NXDataStore.set(`THROTTLE_${props.throttleNumber}DETENT_${props.index}`, parseFloat(from).toFixed(2));
                        console.log(`FUCKING ${NXDataStore.get(`THROTTLE_${props.throttleNumber}DETENT_${props.index}`)}`);
                        // currentValue = parseFloat(from);
                        setShowWarning(false);
                        // setFromTo(props.throttlePosition, props.lowerBoundDetentSetter, props.upperBoundDetentSetter);
                    // setCurrentValue(parseFloat(from));
                    //  } else {
                    //      // setCurrentValue(0.05);
                    //      setShowWarning(true);
                    //  }
                    } else {
                        // setDeadZone(0.05);
                        NXDataStore.set(`THROTTLE_${props.throttleNumber}DETENT_${props.index}`, parseFloat('0.05').toFixed(2));

                        setShowWarning(true);
                    }
                }}
            />
            {showWarning && (
                <h1 className="mt-4 text-red-600 text-xl">Please enter a valid deadzone (0.01 - 0.05)</h1>
            )}

            <h1 className="text-white mt-4 text-xl ">
                Stored Value:
                {' '}
                {(props.lowerBoundDetentGetter + parseFloat(deadZone)) }
            </h1>

        </div>
    );
};
// export default DetentConfig;
export default connect(
    ({ [DEADZONE_REDUCER]: { deadZone } }) => ({ deadZone }),
    { setDeadZone },
)(DetentConfig);
