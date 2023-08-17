// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentNumberProperty } from '@flybywiresim/fbw-sdk';
import React from 'react';
import { DEFAULT_RADIO_AUTO_CALL_OUTS, RadioAutoCallOutFlags } from '@shared/AutoCallOuts';
import { pathify } from 'instruments/src/EFB/Utils/routing';
import { t } from '../../translation';
import { SettingItem, SettingsPage } from '../Settings';
import { Toggle } from '../../UtilComponents/Form/Toggle';

export const AutomaticCallOutsPage = () => {
    const [autoCallOuts, setAutoCallOuts] = usePersistentNumberProperty('CONFIG_A32NX_FWC_RADIO_AUTO_CALL_OUT_PINS', DEFAULT_RADIO_AUTO_CALL_OUTS);

    const toggleRadioAcoFlag = (flag: RadioAutoCallOutFlags): void => {
        let newFlags = autoCallOuts;
        if ((autoCallOuts & flag) > 0) {
            newFlags &= ~flag;
        } else {
            newFlags |= flag;
        }

        // two-thousand-five-hundred and twenty-five-hundred are exclusive
        const both2500s = RadioAutoCallOutFlags.TwoThousandFiveHundred | RadioAutoCallOutFlags.TwentyFiveHundred;
        if ((newFlags & both2500s) === both2500s) {
            if (flag === RadioAutoCallOutFlags.TwentyFiveHundred) {
                newFlags &= ~RadioAutoCallOutFlags.TwoThousandFiveHundred;
            } else {
                newFlags &= ~RadioAutoCallOutFlags.TwentyFiveHundred;
            }
        }

        // one of five-hundred or four-hundred is mandatory
        const fiveHundredFourHundred = RadioAutoCallOutFlags.FiveHundred | RadioAutoCallOutFlags.FourHundred;
        if ((newFlags & fiveHundredFourHundred) === 0) {
            // Airbus basic config is four hundred so prefer that if it wasn't just de-selected
            if (flag === RadioAutoCallOutFlags.FourHundred) {
                newFlags |= RadioAutoCallOutFlags.FiveHundred;
            } else {
                newFlags |= RadioAutoCallOutFlags.FourHundred;
            }
        }

        setAutoCallOuts(newFlags);
    };

    return (
        <SettingsPage name={t('Settings.AutomaticCallOuts.Title')} backRoute={`/settings/${pathify('Aircraft Options / Pin Programs')}`}>
            <div className="grid grid-cols-2 gap-x-6">
                <div className="mr-3 divide-y-2 divide-theme-accent">
                    <SettingItem name="Two Thousand Five Hundred">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.TwoThousandFiveHundred) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.TwoThousandFiveHundred)} />
                    </SettingItem>
                    <SettingItem name="Twenty Five Hundred">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.TwentyFiveHundred) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.TwentyFiveHundred)} />
                    </SettingItem>
                    <SettingItem name="Two Thousand">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.TwoThousand) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.TwoThousand)} />
                    </SettingItem>
                    <SettingItem name="One Thousand">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.OneThousand) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.OneThousand)} />
                    </SettingItem>
                    <SettingItem name="Five Hundred">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.FiveHundred) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.FiveHundred)} />
                    </SettingItem>
                    <SettingItem name="Four Hundred">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.FourHundred) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.FourHundred)} />
                    </SettingItem>
                    <SettingItem name="Three Hundred">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.ThreeHundred) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.ThreeHundred)} />
                    </SettingItem>
                    <SettingItem name="Two Hundred">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.TwoHundred) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.TwoHundred)} />
                    </SettingItem>
                    <SettingItem name="One Hundred">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.OneHundred) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.OneHundred)} />
                    </SettingItem>
                </div>
                <div className="ml-3 divide-y-2 divide-theme-accent">
                    <SettingItem name="Fifty">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.Fifty) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.Fifty)} />
                    </SettingItem>

                    <SettingItem name="Forty">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.Forty) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.Forty)} />
                    </SettingItem>

                    <SettingItem name="Thirty">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.Thirty) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.Thirty)} />
                    </SettingItem>

                    <SettingItem name="Twenty">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.Twenty) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.Twenty)} />
                    </SettingItem>

                    <SettingItem name="Ten">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.Ten) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.Ten)} />
                    </SettingItem>

                    <SettingItem name="Five">
                        <Toggle value={(autoCallOuts & RadioAutoCallOutFlags.Five) > 0} onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.Five)} />
                    </SettingItem>
                </div>
            </div>
            <SettingItem name={t('Settings.AutomaticCallOuts.ResetStandardConfig')}>
                <button
                    type="button"
                    className="py-2.5 px-5 text-theme-body hover:text-theme-highlight bg-theme-highlight
                                       hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                    onClick={() => setAutoCallOuts(DEFAULT_RADIO_AUTO_CALL_OUTS)}
                >
                    {t('Settings.AutomaticCallOuts.Reset')}
                </button>
            </SettingItem>
        </SettingsPage>
    );
};
