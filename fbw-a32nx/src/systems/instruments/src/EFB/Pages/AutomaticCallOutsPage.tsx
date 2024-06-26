// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import { usePersistentNumberProperty } from '@flybywiresim/fbw-sdk';
import { pathify, SettingItem, SettingsPage, t, Toggle } from '@flybywiresim/flypad';
import { A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS, A32NXRadioAutoCallOutFlags } from '../../../../shared/src/AutoCallOuts';

export const AutomaticCallOutsPage: React.FC = () => {
  const [autoCallOuts, setAutoCallOuts] = usePersistentNumberProperty(
    'CONFIG_A32NX_FWC_RADIO_AUTO_CALL_OUT_PINS',
    A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS,
  );

  const toggleRadioAcoFlag = (flag: A32NXRadioAutoCallOutFlags): void => {
    let newFlags = autoCallOuts;
    if ((autoCallOuts & flag) > 0) {
      newFlags &= ~flag;
    } else {
      newFlags |= flag;
    }

    // two-thousand-five-hundred and twenty-five-hundred are exclusive
    const both2500s = A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred | A32NXRadioAutoCallOutFlags.TwentyFiveHundred;
    if ((newFlags & both2500s) === both2500s) {
      if (flag === A32NXRadioAutoCallOutFlags.TwentyFiveHundred) {
        newFlags &= ~A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred;
      } else {
        newFlags &= ~A32NXRadioAutoCallOutFlags.TwentyFiveHundred;
      }
    }

    // one of five-hundred or four-hundred is mandatory
    const fiveHundredFourHundred = A32NXRadioAutoCallOutFlags.FiveHundred | A32NXRadioAutoCallOutFlags.FourHundred;
    if ((newFlags & fiveHundredFourHundred) === 0) {
      // Airbus basic config is four hundred so prefer that if it wasn't just de-selected
      if (flag === A32NXRadioAutoCallOutFlags.FourHundred) {
        newFlags |= A32NXRadioAutoCallOutFlags.FiveHundred;
      } else {
        newFlags |= A32NXRadioAutoCallOutFlags.FourHundred;
      }
    }

    // can't have 500 glide without 500
    if ((newFlags & A32NXRadioAutoCallOutFlags.FiveHundred) === 0) {
      newFlags &= ~A32NXRadioAutoCallOutFlags.FiveHundredGlide;
    }

    setAutoCallOuts(newFlags);
  };

  return (
    <SettingsPage
      name={t('Settings.AutomaticCallOuts.Title')}
      backRoute={`/settings/${pathify('Aircraft Options / Pin Programs')}`}
    >
      <div className="grid grid-cols-2 gap-x-6">
        <div className="mr-3 divide-y-2 divide-theme-accent">
          <SettingItem name="Two Thousand Five Hundred">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred)}
            />
          </SettingItem>
          <SettingItem name="Twenty Five Hundred">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.TwentyFiveHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.TwentyFiveHundred)}
            />
          </SettingItem>
          <SettingItem name="Two Thousand">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.TwoThousand) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.TwoThousand)}
            />
          </SettingItem>
          <SettingItem name="One Thousand">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.OneThousand) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.OneThousand)}
            />
          </SettingItem>
          {/* TODO enable this when the new rust FWC is merged with the 500 hundred GS inhibit logic */}
          {/* <SettingGroup> */}
          {/* groupType="parent" */}
          <SettingItem name="Five Hundred">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.FiveHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.FiveHundred)}
            />
          </SettingItem>
          {/* <SettingItem name={t('Settings.AutomaticCallOuts.FiveHundredGlide')} groupType="sub">
                            <Toggle
                                value={(autoCallOuts & RadioAutoCallOutFlags.FiveHundredGlide) > 0}
                                disabled={(autoCallOuts & RadioAutoCallOutFlags.FiveHundred) === 0}
                                onToggle={() => toggleRadioAcoFlag(RadioAutoCallOutFlags.FiveHundredGlide)}
                            />
                        </SettingItem> */}
          {/* </SettingGroup> */}
          <SettingItem name="Four Hundred">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.FourHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.FourHundred)}
            />
          </SettingItem>
          <SettingItem name="Three Hundred">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.ThreeHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.ThreeHundred)}
            />
          </SettingItem>
          <SettingItem name="Two Hundred">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.TwoHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.TwoHundred)}
            />
          </SettingItem>
          <SettingItem name="One Hundred">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.OneHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.OneHundred)}
            />
          </SettingItem>
        </div>
        <div className="ml-3 divide-y-2 divide-theme-accent">
          <SettingItem name="Fifty">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.Fifty) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.Fifty)}
            />
          </SettingItem>

          <SettingItem name="Forty">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.Forty) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.Forty)}
            />
          </SettingItem>

          <SettingItem name="Thirty">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.Thirty) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.Thirty)}
            />
          </SettingItem>

          <SettingItem name="Twenty">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.Twenty) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.Twenty)}
            />
          </SettingItem>

          <SettingItem name="Ten">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.Ten) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.Ten)}
            />
          </SettingItem>

          <SettingItem name="Five">
            <Toggle
              value={(autoCallOuts & A32NXRadioAutoCallOutFlags.Five) > 0}
              onToggle={() => toggleRadioAcoFlag(A32NXRadioAutoCallOutFlags.Five)}
            />
          </SettingItem>
        </div>
      </div>
      <SettingItem name={t('Settings.AutomaticCallOuts.ResetStandardConfig')}>
        <button
          type="button"
          className="rounded-md border-2 border-theme-highlight bg-theme-highlight px-5
                                       py-2.5 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
          onClick={() => setAutoCallOuts(A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS)}
        >
          {t('Settings.AutomaticCallOuts.Reset')}
        </button>
      </SettingItem>
    </SettingsPage>
  );
};
