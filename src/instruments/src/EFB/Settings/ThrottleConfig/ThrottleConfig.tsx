/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import { ExclamationCircleFill } from 'react-bootstrap-icons';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SelectItem, VerticalSelectGroup } from '../../UtilComponents/Form/Select';

import { BaseThrottleConfig } from './BaseThrottleConfig';
import { ThrottleSimvar } from './ThrottleSimVar';
import { PromptModal, useModals } from '../../UtilComponents/Modals/Modals';

interface ThrottleConfigProps {
    isShown: boolean,
    onClose: () => void,
}

export const ThrottleConfig = ({ isShown, onClose }: ThrottleConfigProps) => {
    const [isDualAxis, setDualAxis] = usePersistentNumberProperty('THROTTLE_DUAL_AXIS', 1);

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [validConfig, setValidConfig] = useState(true);
    const [validationError, setValidationError] = useState<string>();

    const [reverserOnAxis1, setReverserOnAxis1] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:1', 'number', 1000);
    const [, setReverserOnAxis2] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:2', 'number', 1000);

    const [, syncToDisk] = useSimVar('K:A32NX.THROTTLE_MAPPING_SAVE_TO_FILE', 'number', 1000);
    const [, defaultsToThrottle] = useSimVar('K:A32NX.THROTTLE_MAPPING_SET_DEFAULTS', 'number', 100);
    const [, syncToThrottle] = useSimVar('K:A32NX.THROTTLE_MAPPING_LOAD_FROM_FILE', 'number', 100);
    const [, applyLocalVar] = useSimVar('K:A32NX.THROTTLE_MAPPING_LOAD_FROM_LOCAL_VARIABLES', 'number', 1000);

    const mappingsAxisOne: Array<ThrottleSimvar> = [
        new ThrottleSimvar('Reverse Full', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 1),
        new ThrottleSimvar('Reverse Idle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 1),
        new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 1),
        new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 1),
        new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 1),
        new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 1),
    ];
    const mappingsAxisTwo: Array<ThrottleSimvar> = [
        new ThrottleSimvar('Reverse Full', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 2),
        new ThrottleSimvar('Reverse Idle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 2),
        new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 2),
        new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 2),
        new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 2),
        new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 2),
    ];

    const { showModal } = useModals();

    useEffect(() => {
        if (reverserOnAxis1 === 0 && selectedIndex < 2) {
            setSelectedIndex(2);
        }
    }, [reverserOnAxis1, selectedIndex]);

    const getOverlapErrors = (mappingsAxis: ThrottleSimvar[]) => {
        const overlapErrors: string[] = [];

        for (let index = reverserOnAxis1 ? 0 : 2; index < mappingsAxis.length; index++) {
            const element = mappingsAxis[index];

            for (let nextIndex = index + 1; nextIndex < mappingsAxis.length; nextIndex++) {
                const nextElement = mappingsAxis[nextIndex];
                if (element.getHiGetter() >= nextElement.getLowGetter() || element.getLowGetter() >= nextElement.getHiGetter()) {
                    overlapErrors.push(`${element.readableName} (${element.getLowGetter().toFixed(2)}) overlaps with ${nextElement.readableName} (${nextElement.getLowGetter().toFixed(2)})`);
                }
            }
        }

        return overlapErrors;
    };

    useEffect(() => {
        const errors: string[] = [...getOverlapErrors(mappingsAxisOne), ...getOverlapErrors(mappingsAxisTwo)];

        setValidationError(errors[0]);
        setValidConfig(errors.length === 0);
    }, [mappingsAxisOne, mappingsAxisTwo]);

    const setReversersOnAxis = (reverserOnAxis: number) => {
        setReverserOnAxis1(reverserOnAxis);
        setReverserOnAxis2(reverserOnAxis);
        if (reverserOnAxis === 0 && selectedIndex < 2) {
            setSelectedIndex(2);
        }
    };

    const switchDetent = (index: number) => {
        if (index >= 0 && index <= 5) {
            setSelectedIndex(index);
        }
    };

    const navigationBar = (
        <VerticalSelectGroup>
            <SelectItem onSelect={() => switchDetent(5)} selected={selectedIndex === 5}>TO/GA</SelectItem>
            <SelectItem onSelect={() => switchDetent(4)} selected={selectedIndex === 4}>FLX</SelectItem>
            <SelectItem onSelect={() => switchDetent(3)} selected={selectedIndex === 3}>CLB</SelectItem>
            <SelectItem onSelect={() => switchDetent(2)} selected={selectedIndex === 2}>Idle</SelectItem>
            <SelectItem
                disabled={!reverserOnAxis1}
                className={`${reverserOnAxis1 ? '' : 'opacity-30'}`}
                onSelect={() => {
                    if (reverserOnAxis1) {
                        switchDetent(1);
                    }
                }}
                selected={selectedIndex === 1}
            >
                Reverse Idle
            </SelectItem>
            <SelectItem
                disabled={!reverserOnAxis1}
                className={`${reverserOnAxis1 ? '' : 'opacity-30'}`}
                onSelect={() => {
                    if (reverserOnAxis1) {
                        switchDetent(0);
                    }
                }}
                selected={selectedIndex === 0}
            >
                Reverse Full
            </SelectItem>
        </VerticalSelectGroup>
    );

    if (!isShown) return null;

    return (
        <div className="flex flex-col justify-between h-content-section-full">
            <div className="space-y-6">
                <div>
                    <div className="flex flex-row justify-center p-4 mt-auto mb-8 space-x-16 w-full rounded-lg border-2 border-theme-accent">
                        <div className="flex flex-row space-x-4">
                            <div>Reverser On Axis</div>
                            <Toggle value={!!reverserOnAxis1} onToggle={(value) => setReversersOnAxis(value ? 1 : 0)} />
                        </div>
                        <div className="flex flex-row space-x-4">
                            <div>Independent Axis</div>
                            <Toggle
                                value={!!isDualAxis}
                                onToggle={(value) => {
                                    setDualAxis(value ? 1 : 0);
                                }}
                            />
                        </div>
                    </div>

                    {isDualAxis ? (
                        <div className="flex flex-row justify-between rounded-xl">
                            <BaseThrottleConfig
                                mappingsAxisOne={mappingsAxisOne}
                                disabled={false}
                                throttleNumber={1}
                                throttleCount={isDualAxis ? 1 : 2}
                                activeIndex={selectedIndex}
                            />
                            <div className="m-auto">
                                {navigationBar}
                            </div>
                            <BaseThrottleConfig
                                mappingsAxisOne={mappingsAxisTwo}
                                disabled={false}
                                throttleNumber={2}
                                throttleCount={1}
                                activeIndex={selectedIndex}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-row justify-center rounded-xl">
                            <BaseThrottleConfig
                                mappingsAxisOne={mappingsAxisOne}
                                mappingsAxisTwo={mappingsAxisTwo}
                                disabled={false}
                                throttleNumber={1}
                                throttleCount={2}
                                activeIndex={selectedIndex}
                            />
                            <div className="mt-auto mb-auto ml-8">
                                {navigationBar}
                            </div>
                        </div>
                    )}
                </div>

                {!validConfig && (
                    <div className="overflow-hidden w-full rounded-md border-2 border-theme-accent">
                        <div className="flex justify-center items-center py-3 w-full bg-utility-red">
                            <ExclamationCircleFill size={25} />
                        </div>
                        <h2 className="py-4 text-center">
                            {validationError}
                        </h2>
                    </div>
                )}
            </div>

            <div className="flex flex-row justify-between p-4 w-full rounded-lg border-2 border-theme-accent">
                <div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 px-5 rounded-md border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                    >
                        Back
                    </button>
                </div>
                <div className="flex flex-row space-x-3">
                    <button
                        type="button"
                        onClick={() => {
                            showModal(
                                <PromptModal
                                    title="Throttle Configuration Reset"
                                    bodyText="Are you sure that you want to reset your current throttle configuration settings to their default states? This action is irreversible."
                                    onConfirm={() => {
                                        defaultsToThrottle(1);
                                    }}
                                />,
                            );
                        }}
                        className="py-2.5 px-5 rounded-md border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            syncToThrottle(1);
                        }}
                        className="py-2.5 px-5 rounded-md border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                    >
                        Load from File
                    </button>
                    <button
                        type="button"
                        onClick={() => applyLocalVar(1)}
                        className={`py-2.5 px-5 rounded-md transition duration-100 border-2 ${validConfig
                            ? 'text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight'
                            : 'bg-theme-accent border-theme-accent opacity-30'}`}
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (validConfig) {
                                syncToDisk(1);
                                applyLocalVar(1);
                            }
                        }}
                        disabled={!validConfig}
                        className={`py-2.5 px-5 rounded-md transition duration-100 border-2 ${validConfig
                            ? 'bg-green-400 text-theme-body hover:text-green-400 hover:bg-theme-body border-green-400'
                            : 'bg-theme-accent border-theme-accent opacity-30'}`}
                    >
                        Save and Apply
                    </button>
                </div>
            </div>
        </div>
    );
};
