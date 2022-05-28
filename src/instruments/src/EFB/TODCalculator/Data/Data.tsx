/* eslint-disable max-len */
import React, { useEffect } from 'react';
import { round } from 'lodash';
import { useSimVar } from '@instruments/common/simVars';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import Card from '../../UtilComponents/Card/Card';
import { TOD_CALCULATION_TYPE } from '../../Enum/TODCalculationType';
import { TOD_INPUT_MODE } from '../../Enum/TODInputMode';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import { setTodCurrentAltitudeSync, setTodData } from '../../Store/features/todCalculator';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';

export const Data = ({ className }: {className: string}) => {
    let [altitude] = useSimVar('INDICATED ALTITUDE', 'feet', 1_000);
    let [distance] = useSimVar('L:A32NX_GPS_WP_DISTANCE', 'nautical miles', 1_000);
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

        dispatch(setTodData({ currentAltitude: altitude }));
    }, [currentAltitudeSyncEnabled, altitude]);

    useEffect(() => {
        if (!calculationInputSyncEnabled) {
            return;
        }

        if (!inputValid(calculationType!, syncedInput)) {
            // Reset to default as otherwise there was an issue that the FPA field vanished
            // when having it synced and the switch to HDG-VS.
            dispatch(setTodData({ calculationInputMode: TOD_INPUT_MODE.MANUAL, calculation: { input: 3, type: TOD_CALCULATION_TYPE.FLIGHT_PATH_ANGLE } }));
            return;
        }

        dispatch(setTodData({ calculation: { input: syncedInput, type: calculationType } }));
    }, [calculationInputSyncEnabled, distance, verticalSpeed, pitchAngle]);

    const calculationTypes = [
        { label: `${t('Performance.TopOfDescent.Data.Distance')}`, placeholder: `${t('Performance.TopOfDescent.Data.UnitNM')}`, type: TOD_CALCULATION_TYPE.DISTANCE, syncValue: distance, negativeValue: false },
        { label: `${t('Performance.TopOfDescent.Data.VerticalSpeed')}`, placeholder: `${t('Performance.TopOfDescent.Data.UnitFtMin')}`, type: TOD_CALCULATION_TYPE.VERTICAL_SPEED, syncValue: verticalSpeed, negativeValue: true },
        { label: `${t('Performance.TopOfDescent.Data.Angle')}`, placeholder: `${t('Performance.TopOfDescent.Data.UnitAngleDegrees')}`, type: TOD_CALCULATION_TYPE.FLIGHT_PATH_ANGLE, syncValue: pitchAngle, negativeValue: true },
    ];

    return (
        <Card title={t('Performance.TopOfDescent.Data.Title')} childrenContainerClassName="flex-1 flex flex-col justify-start space-y-4" className={className}>
            <div>
                <p>{t('Performance.TopOfDescent.Data.CurrentAltitude')}</p>

                <div className="flex flex-row">
                    <SimpleInput
                        className="w-full rounded-r-none"
                        placeholder={t('Performance.TopOfDescent.Data.UnitFeet')}
                        value={currentAltitude}
                        onChange={(value) => dispatch(setTodData({ currentAltitude: parseFloat(value) }))}
                        disabled={currentAltitudeSyncEnabled}
                        number
                    />

                    <TooltipWrapper text={currentAltitudeSyncEnabled ? t('Performance.TopOfDescent.TT.DesynchronizeInputWithAircraftsCurrentAltitude') : t('Performance.TopOfDescent.TT.SynchronizeInputWithAircraftsCurrentAltitude')}>
                        <button
                            onClick={() => dispatch(setTodCurrentAltitudeSync(!currentAltitudeSyncEnabled))}
                            className={`flex items-center h-auto border-2 border-theme-highlight text-theme-highlight px-3 rounded-md rounded-l-none transition duration-100 ${currentAltitudeSyncEnabled && 'bg-theme-highlight !text-theme-body'}`}
                            type="button"
                        >
                            <p className="text-current">SYNC</p>
                        </button>
                    </TooltipWrapper>
                </div>
            </div>

            <div>
                <p>{t('Performance.TopOfDescent.Data.TargetAltitude')}</p>
                <SimpleInput
                    placeholder={t('Performance.TopOfDescent.Data.UnitFeet')}
                    className="w-full"
                    value={targetAltitude}
                    onChange={(targetAltitude) => dispatch(setTodData({ targetAltitude: parseFloat(targetAltitude) }))}
                    number
                />
            </div>

            <div className="w-full h-1 bg-theme-accent rounded-full" />

            {calculationTypes.map(({ label, placeholder, type, syncValue }) => (!calculationInput || calculationType === type) && (
                <div>
                    <p>{label}</p>
                    <div className="flex flex-row">
                        <SimpleInput
                            placeholder={placeholder}
                            number
                            className={`w-full ${!!calculationInput && !calculationInputSyncEnabled && 'rounded-r-none'}`}
                            onChange={(input) => dispatch(setTodData({ calculation: { input: parseFloat(input), type: input !== '' ? type : undefined } }))}
                            value={calculationInput ? Math.abs(calculationInput) : ''}
                            disabled={calculationInputSyncEnabled}
                        />
                        {inputValid(type, syncValue) && (
                            <button
                                type="button"
                                className={`flex items-center border-2 border-theme-highlight text-theme-highlight px-3 rounded-md rounded-l-none transition duration-100 ${calculationInputSyncEnabled && 'bg-theme-highlight !text-theme-body'}`}
                                onClick={() => dispatch(setTodData({
                                    calculationInputMode: !calculationInputSyncEnabled ? TOD_INPUT_MODE.AUTO : TOD_INPUT_MODE.MANUAL,
                                    calculation: { type, input: syncedInput },
                                }))}
                            >
                                <p className="text-current">SYNC</p>
                            </button>
                        )}
                        {!!calculationInput && !calculationInputSyncEnabled && (
                            <button
                                type="button"
                                className="flex items-center px-3 text-utility-red hover:text-theme-body hover:bg-utility-red rounded-md rounded-l-none border-2 border-utility-red transition duration-100"
                                onClick={() => dispatch(setTodData({ calculation: { input: undefined, type: undefined } }))}
                            >
                                X
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </Card>
    );
};
