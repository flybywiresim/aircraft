/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { useSimVar, useSplitSimVar } from '@instruments/common/simVars';
import useInterval from '@instruments/common/useInterval';
import {
    ArrowDown,
    ArrowUp,
    StopCircleFill,
    TruckFlatbed,
} from 'react-bootstrap-icons';
import Slider from 'rc-slider';
import { useUpdate } from '@instruments/common/hooks';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { removeDisabledButton, setActiveButtons, setTugRequestOnly, setPushbackWaitTimerHandle } from '../../Store/features/buttons';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import { applySelected, applySelectedWithSync, StatefulButton } from '../Ground';

export const PushbackPage = () => {
    const [tugDirection, setTugDirection] = useState(0);
    const [rudderPosition] = useSimVar('A:RUDDER POSITION', 'number', 50);
    const [pushBackWait, setPushbackWait] = useSimVar('Pushback Wait', 'bool', 100);
    const [planeHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees');
    const [tugHeading, setTugHeading] = useSplitSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 'K:KEY_TUG_HEADING', 'UINT32', 1000);
    const [pushBack, setPushBack] = useSplitSimVar('PUSHBACK STATE', 'enum', 'K:TOGGLE_PUSHBACK', 'bool', 1000);
    const [pushBackAttached] = useSimVar('Pushback Attached', 'bool', 1000);
    const [parkingBrakeEngaged, setParkingBrakeEngaged] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool', 1000);
    const [tugActive, setTugActive] = useState(false);
    const [noseWheelPos, setNoseWheelPos] = useSimVar('L:A32NX_NOSE_WHEEL_POSITION', 'percent over 100');

    const { t } = useTranslation();

    const getTugHeading = (value: number): number => (tugHeading + value) % 360;

    const dispatch = useAppDispatch();

    const tugRequestOnly = useAppSelector((state) => state.buttons.tugRequestOnly);
    const disabledButtons = useAppSelector((state) => state.buttons.disabledButtons);
    const activeButtons = useAppSelector((state) => state.buttons.activeButtons);
    const pushBackWaitTimerHandle = useAppSelector((state) => state.buttons.pushBackWaitTimerHandle);

    useInterval(() => {
        if (activeButtons.find((button) => button.id === 'tug-request') && tugRequestOnly) {
            /* Timer needed, as we cannot check when the variable "Pushback Wait" is being set to false after calling the tug */
            setPushbackWait(1);
        }
    }, 100);

    const computeAndSetTugHeading = (direction: number) => {
        if (tugRequestOnly) {
            dispatch(setTugRequestOnly(false));
        }
        const tugHeading = getTugHeading(direction);
        // KEY_TUG_HEADING is an unsigned integer, so let's convert
        setPushbackWait(0);
        setTugHeading((tugHeading * 11930465) & 0xffffffff);
        setTugDirection(direction);
    };

    /**
     * allows a direction to be selected directly
     * rather than first backwards and after that the direction
     */
    useEffect(() => {
        if (pushBack === 0 && tugDirection !== 0) {
            computeAndSetTugHeading(tugDirection);
            setTugDirection(0);
        }
        if (activeButtons.find((button) => button.id === 'tug-request') && tugRequestOnly) {
            /* Timer needed, as we cannot check when the variable "Pushback Wait" is being set to false after calling the tug */
            if (pushBackWaitTimerHandle === -1) {
                const timer = setInterval(() => {
                    setPushbackWaitTimerHandle(1);
                }, 100);

                setPushbackWaitTimerHandle(timer);
            }
        } else if (pushBackWaitTimerHandle !== -1) {
            clearInterval(pushBackWaitTimerHandle);
            setPushbackWaitTimerHandle(-1);
        }
    }, [pushBack, tugDirection, activeButtons, pushBackWaitTimerHandle, tugRequestOnly]);

    const STATE_WAITING = 'WAITING';
    const STATE_ACTIVE = 'ACTIVE';

    const togglePushback = (callOnly: boolean = false) => {
        setPushBack(!pushBack);
        setTugActive(!tugActive);
        dispatch(setTugRequestOnly(callOnly));
    };

    /**
     * Pushback actions disable all other services
     * So all highlighting should be removed as well
     */
    const handlePushBackClick = (callBack: () => void, event: React.MouseEvent) => {
        const tugRequest = 'tug-request';
        if (event.currentTarget.id === tugRequest) {
            if (!activeButtons.map((b: StatefulButton) => b.id).includes(tugRequest)) {
                dispatch(setActiveButtons([{ id: tugRequest, state: STATE_WAITING, callBack, value: pushBackAttached }]));
                disabledButtons.forEach((b, index) => {
                    dispatch(removeDisabledButton(index));
                });
                callBack();
            } else {
                dispatch(setActiveButtons([]));
                disabledButtons.forEach((b, index) => {
                    dispatch(removeDisabledButton(index));
                });
                callBack();
            }
        } else if (!activeButtons.map((b: StatefulButton) => b.id).includes(event.currentTarget.id)) {
            dispatch(setActiveButtons([{ id: tugRequest, state: STATE_ACTIVE, callBack, value: pushBackAttached }, { id: event.currentTarget.id, state: STATE_ACTIVE, callBack, value: 1 }]));
            callBack();
        }
    };

    const [commandedTugHeadingFactor, setCommandedTugHeadingFactor] = useState(0);
    const [tugSpeed, setTugSpeed] = useState(0);

    const [commandedTugDirectionFactor, setCommandedTugDirectionFactor] = useState(-1);

    const [, setVelX] = useSimVar('VELOCITY BODY X', 'Number');
    const [, setVelY] = useSimVar('VELOCITY BODY Y', 'Number');
    const [, setVelZ] = useSimVar('VELOCITY BODY Z', 'Number');

    const [, setRotVelX] = useSimVar('ROTATION VELOCITY BODY X', 'Number');
    const [, setRotVelY] = useSimVar('ROTATION VELOCITY BODY Y', 'Number');
    const [, setRotVelZ] = useSimVar('ROTATION VELOCITY BODY Z', 'Number');

    useEffect(() => {
        const newNoseWheelPos = commandedTugDirectionFactor / 2 + 0.5;
        setNoseWheelPos(newNoseWheelPos);

        const angle = commandedTugHeadingFactor <= 0 ? Math.abs(commandedTugHeadingFactor) * 90 : 270 + (1 - Math.abs(commandedTugHeadingFactor)) * 90;

        const newTugHeading = getTugHeading(angle);
        setPushbackWait(0);
        setTugHeading((newTugHeading * 11930465) & 0xffffffff);
    }, [tugHeading, commandedTugHeadingFactor, planeHeading]);

    useEffect(() => () => {
        if (pushBackAttached) {
            toast.info('Pausing Pushback. Return to Pushback page to resume pushback.');
            setPushbackWait(1);
        }
    }, []);

    useUpdate(() => {
        if (!pushBackAttached) return;
        setVelX(0);
        setVelY(0);
        setVelZ(tugSpeed * (parkingBrakeEngaged ? 0.75 : 8) * commandedTugDirectionFactor);

        setRotVelX(0);
        setRotVelY(tugSpeed * (parkingBrakeEngaged ? 0.015 : 0.16) * commandedTugHeadingFactor * commandedTugDirectionFactor);
        setRotVelZ(0);
    });

    return (
        <div className="flex relative flex-col space-y-4 h-content-section-reduced">
            <div className="flex-grow rounded-lg border-2 border-theme-accent">
                {/* TODO: Insert bing map here */}
            </div>
            <div className="flex flex-col p-6 space-y-4 rounded-lg border-2 border-theme-accent">
                <div className="flex flex-row space-x-4">
                    <div className="w-full">
                        <p className="text-center">{t('Pushback.CallTug')}</p>
                        <button
                            type="button"
                            id="tug-request"
                            onClick={(e) => {
                                handlePushBackClick(() => togglePushback(true), e);
                            }}
                            className={`${applySelectedWithSync(
                                'border-2 border-theme-accent rounded-md w-full h-20 rounded-md transition duration-100 flex items-center justify-center',
                                'tug-request',
                                pushBackAttached,
                            )}`}
                        >
                            <TruckFlatbed size="2.825rem" />
                        </button>
                    </div>
                    <div className="w-full">
                        <p className="text-center">{t('Pushback.Halt')}</p>
                        <button
                            type="button"
                            id="stop"
                            onClick={(e) => handlePushBackClick(() => {
                                dispatch(setTugRequestOnly(true));
                            }, e)}
                            className={`w-full h-20 rounded-md transition duration-100 flex items-center justify-center ${applySelected('text-white bg-utility-red border-utility-red hover:bg-utility-red hover:border-utility-red')}`}
                        >
                            <StopCircleFill size={40} />
                        </button>
                    </div>
                    <div className="w-full">
                        <p className="text-center">{t('Pushback.ParkingBrake.Title')}</p>
                        <button
                            type="button"
                            id="parking-brake"
                            onClick={() => setParkingBrakeEngaged((old) => !old)}
                            className={`w-full h-20 rounded-md transition duration-100 flex items-center justify-center ${parkingBrakeEngaged ? 'bg-white text-utility-red' : 'bg-utility-red text-white'}`}
                        >
                            <h1 className="font-bold text-current uppercase">{parkingBrakeEngaged ? t('Pushback.ParkingBrake.On') : t('Pushback.ParkingBrake.Off')}</h1>
                        </button>
                    </div>
                </div>

                <div className="flex flex-row space-x-4">
                    <div className="w-full">
                        <p className="text-center">{t('Pushback.Forward')}</p>
                        <button
                            type="button"
                            className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${commandedTugDirectionFactor === 1 && '!text-theme-highlight !bg-theme-body'}`}
                            onClick={() => {
                                setCommandedTugDirectionFactor(1);
                            }}
                        >
                            <ArrowUp size={40} />
                        </button>
                    </div>
                    <div className="w-full">
                        <p className="text-center">{t('Pushback.Backward')}</p>
                        <button
                            type="button"
                            className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${commandedTugDirectionFactor === -1 && '!text-theme-highlight !bg-theme-body'}`}
                            onClick={() => {
                                setCommandedTugDirectionFactor(-1);
                            }}
                        >
                            <ArrowDown size={40} />
                        </button>
                    </div>
                </div>
                <div>
                    <p>{t('Pushback.TugDirection')}</p>
                    <div className="flex flex-row items-center space-x-4">
                        <p className="font-bold text-unselected">L</p>
                        <Slider
                            onChange={(value) => {
                                setPushbackWait(0);
                                setCommandedTugHeadingFactor(value);
                            }}
                            min={-1}
                            step={0.01}
                            max={1}
                            defaultValue={commandedTugHeadingFactor}
                            startPoint={0}
                        />
                        <p className="font-bold text-unselected">R</p>
                    </div>
                </div>
                <div>
                    <p>{t('Pushback.TugSpeed')}</p>
                    <Slider
                        min={0}
                        step={0.01}
                        max={1}
                        onChange={(value) => {
                            setTugSpeed(value);
                            // TODO Value should be stored into redux as tug heading
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
