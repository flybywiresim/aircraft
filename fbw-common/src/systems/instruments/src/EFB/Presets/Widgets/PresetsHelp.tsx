// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

export const PresetsHelp = () => (
    <div className="p-4 mt-4 mb-4 h-content-section-reduced rounded-lg border-2 border-theme-accent">
        <ScrollableContainer height={52}>
            <div className="space-y-2 w-full ">
                <h1 className="font-bold">Lighting</h1>
                <p className="text-2xl">
                    <ul className="leading-9 list-disc">
                        <li>Load a preset by clicking on the corresponding "Load Preset" button when the aircraft is powered.</li>
                        <li>
                            Save current interior lighting levels by clicking on "Save Preset" button of the
                            corresponding preset when the aircraft is powered.
                        </li>
                        <li>
                            Rename a preset by clicking on the current name and entering a new name.
                            The new name will be saved after leaving the input field.
                        </li>
                    </ul>
                </p>

                <h1 className="font-bold">Aircraft</h1>
                <p className="text-2xl">
                    Aircraft Presets act as a virtual Co-Pilot supporting you setting up the aircraft correctly
                    while you are preparing the flight management system. The Aircraft Presets do not cover the FMS
                    and FCU setup.
                </p>
                <p className="pt-4 pb-4 text-2xl font-bold">
                    You still have to setup the FMS using the MCDU and the FCU according to your flight plan.
                </p>
                <p className="text-2xl">
                    <ul className="text-2xl leading-9 list-disc">
                        <li>
                            When clicking on a preset button the corresponding preset procedure will be started.
                            This happens in real time as if a Co-Pilot would execute the setup.
                        </li>
                        <li>
                            This means that the preset procedure will take some time to complete especially when
                            waiting for certain steps to finish, e.g. ADIRS alignment, APU start, engines start, etc.
                        </li>
                        <li>
                            You can stop and interrupt the procedure anytime by clicking on "Cancel". The
                            procedure will stop after the current step is finished. The aircraft will be in a state
                            in-between two presets. You can always press a preset again and let it run until
                            completion to make sure a procedure is complete.
                        </li>
                        <li>
                            If you have partly setup the aircraft already the presets will check if the correct
                            setting is already done and skip this step. Otherwise it will overwrite your setup.
                        </li>
                        <li>
                            If you change any settings during a running procedure you might confuse your Co-Pilot
                            and end up with an incomplete preset state. You can repeat loading  the preset in this
                            case.
                        </li>
                    </ul>

                </p>
            </div>
        </ScrollableContainer>
    </div>
);
