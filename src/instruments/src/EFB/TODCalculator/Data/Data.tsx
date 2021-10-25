import React, { useEffect } from 'react';
import { round } from 'lodash';
import Input from '../../Components/Form/Input/Input';
import Card from '../../Components/Card/Card';
import Divider from '../../Components/Divider/Divider';
import { TOD_CALCULATION_TYPE } from '../../Enum/TODCalculationType';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import { useSimVar } from '../../../Common/simVars';
import { TOD_INPUT_MODE } from '../../Enum/TODInputMode';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import { setTodCurrentAltitudeSync, setTodData } from '../../Store/features/todCalculator';

const Data = ({ className }: {className: string}) => {
    let [altitude] = useSimVar('INDICATED ALTITUDE', 'feet', 1_000);
    let [distance] = useSimVar('GPS WP DISTANCE', 'nautical miles', 1_000);
    let [verticalSpeed] = useSimVar('VERTICAL SPEED', 'feet per minute', 1_000);
    let [pitchAngle] = useSimVar('L:A32NX_AUTOPILOT_FPA_SELECTED', 'degree', 1_000);
    const [trkModeActive] = useSimVar('L:A32NX_TRK_FPA_MODE_ACTIVE', 'bool', 1_000);

    const dispatch = useAppDispatch();
    const calculationType = useAppSelector((state) => state.todCalculator.calculation.type);
    const currentAltitudeSyncEnabled = useAppSelector((state) => state.todCalculator.currentAltitudeMode) === TOD_INPUT_MODE.AUTO;
    const calculationInputSyncEnabled = useAppSelector((state) => state.todCalculator.calculationInputMode) === TOD_INPUT_MODE.AUTO;
    const calculationInput = useAppSelector((state) => state.todCalculator.calculation.input);
    const targetAltitude = useAppSelector((state) => state.todCalculator.targetAltitude);
    const currentAltitude = useAppSelector((state) => state.todCalculator.currentAltitude);

    altitude = round(altitude, -1);
    distance = round(distance, 1);
    verticalSpeed = round(verticalSpeed);
    pitchAngle = round(pitchAngle, 1);

    const syncedInput = ({
        [TOD_CALCULATION_TYPE.DISTANCE]: distance,
        [TOD_CALCULATION_TYPE.VERTICAL_SPEED]: verticalSpeed,
        [TOD_CALCULATION_TYPE.FLIGHT_PATH_ANGLE]: pitchAngle,
    })[calculationType!] || undefined;

    const inputValid = (type: TOD_CALCULATION_TYPE, input) => ({
        [TOD_CALCULATION_TYPE.DISTANCE]: input > 0,
        [TOD_CALCULATION_TYPE.VERTICAL_SPEED]: input < -50,
        [TOD_CALCULATION_TYPE.FLIGHT_PATH_ANGLE]: !!trkModeActive && input < 0,
    })[type];

    useEffect(() => {
        if (!currentAltitudeSyncEnabled) {
            return;
        }

        setTodData({ currentAltitude: altitude });
    }, [currentAltitudeSyncEnabled, altitude]);

    useEffect(() => {
        if (!calculationInputSyncEnabled) {
            return;
        }

        if (!inputValid(calculationType!, syncedInput)) {
            setTodData({ calculationInputMode: TOD_INPUT_MODE.MANUAL, calculation: { input: '', type: undefined } });
            return;
        }

        setTodData({ calculation: { input: syncedInput, type: calculationType } });
    }, [calculationInputSyncEnabled, distance, verticalSpeed, pitchAngle]);

    const calculationTypes = [
        { label: 'Distance', rightLabel: 'NM', type: TOD_CALCULATION_TYPE.DISTANCE, syncValue: distance, negativeValue: false },
        { label: 'Vertical speed', rightLabel: 'ft/min', type: TOD_CALCULATION_TYPE.VERTICAL_SPEED, syncValue: verticalSpeed, negativeValue: true },
        { label: 'Angle', rightLabel: 'degrees', type: TOD_CALCULATION_TYPE.FLIGHT_PATH_ANGLE, syncValue: pitchAngle, negativeValue: true },
    ];

    return (
        <Card title="Data" childrenContainerClassName="flex-1 flex flex-col justify-start" className={className}>
            <Input
                label="Current altitude"
                type="number"
                className="pr-1 mb-4 dark-option"
                rightComponent={(
                    <div className="flex justify-center items-center">
                        <span className="mr-4 text-2xl">ft</span>
                        <Button
                            text="SYNC"
                            type={currentAltitudeSyncEnabled ? BUTTON_TYPE.BLUE : BUTTON_TYPE.BLUE_OUTLINE}
                            onClick={() => dispatch(setTodCurrentAltitudeSync(!currentAltitudeSyncEnabled))}
                        />
                    </div>
                )}
                value={currentAltitude}
                onChange={(currentAltitude) => setTodData({ currentAltitude })}
                disabled={currentAltitudeSyncEnabled}
            />

            <Input
                label="Target altitude"
                type="number"
                className="mb-6 dark-option"
                rightComponent={<span className="text-2xl">ft</span>}
                value={targetAltitude}
                onChange={(targetAltitude) => setTodData({ targetAltitude })}
            />

            <Divider className="mb-6" />

            {calculationTypes.map(({ label, rightLabel, type, syncValue, negativeValue }) => (!calculationInput || calculationType === type) && (
                <>
                    <Input
                        label={label}
                        type="number"
                        className="pr-1 mb-2 dark-option"
                        leftInnerComponent={negativeValue ? <span className="text-2xl">-</span> : null}
                        rightComponent={(
                            <div className="flex justify-center items-center">
                                <span className="pr-3 text-2xl">{rightLabel}</span>

                                {inputValid(type, syncValue) && (
                                    <Button
                                        className="ml-1"
                                        text="SYNC"
                                        type={calculationInputSyncEnabled ? BUTTON_TYPE.BLUE : BUTTON_TYPE.BLUE_OUTLINE}
                                        onClick={() => dispatch(setTodData({
                                            calculationInputMode: !calculationInputSyncEnabled ? TOD_INPUT_MODE.AUTO : TOD_INPUT_MODE.MANUAL,
                                            calculation: { type, input: syncedInput },
                                        }))}
                                    />
                                )}

                                {!!calculationInput && !calculationInputSyncEnabled && (
                                    <Button
                                        className="ml-1"
                                        text="X"
                                        type={BUTTON_TYPE.RED_OUTLINE}
                                        onClick={() => setTodData({ calculation: { input: '', type: undefined } })}
                                    />
                                )}
                            </div>
                        )}
                        onChange={(input) => setTodData({ calculation: { input, type: input !== '' ? type : undefined } })}
                        value={calculationInput ? Math.abs(calculationInput) : ''}
                        disabled={calculationInputSyncEnabled}
                    />
                </>
            ))}
        </Card>
    );
};

export default Data;
