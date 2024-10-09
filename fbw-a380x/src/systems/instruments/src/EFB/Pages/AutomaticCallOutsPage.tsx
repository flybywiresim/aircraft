// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import { usePersistentNumberProperty } from '@flybywiresim/fbw-sdk';
import { pathify, SettingItem, SettingsPage, t, Toggle } from '@flybywiresim/flypad';
import { A380X_DEFAULT_RADIO_AUTO_CALL_OUTS, A380XRadioAutoCallOutFlags } from '../../../../shared/src/AutoCallOuts';

export const AutomaticCallOutsPage: React.FC = () => {
  const [autoCallOuts, setAutoCallOuts] = usePersistentNumberProperty(
    'CONFIG_A380X_FWC_RADIO_AUTO_CALL_OUT_PINS',
    A380X_DEFAULT_RADIO_AUTO_CALL_OUTS,
  );

  const toggleRadioAcoFlag = (flag: A380XRadioAutoCallOutFlags): void => {
    let newFlags = autoCallOuts;
    if ((autoCallOuts & flag) > 0) {
      newFlags &= ~flag;
    } else {
      newFlags |= flag;
    }

    // two-thousand-five-hundred and twenty-five-hundred are exclusive
    const both2500s = A380XRadioAutoCallOutFlags.TwoThousandFiveHundred | A380XRadioAutoCallOutFlags.TwentyFiveHundred;
    if ((newFlags & both2500s) === both2500s) {
      if (flag === A380XRadioAutoCallOutFlags.TwentyFiveHundred) {
        newFlags &= ~A380XRadioAutoCallOutFlags.TwoThousandFiveHundred;
      } else {
        newFlags &= ~A380XRadioAutoCallOutFlags.TwentyFiveHundred;
      }
    }

    // one of five-hundred or four-hundred is mandatory
    const fiveHundredFourHundred = A380XRadioAutoCallOutFlags.FiveHundred | A380XRadioAutoCallOutFlags.FourHundred;
    if ((newFlags & fiveHundredFourHundred) === 0) {
      // Airbus basic config is four hundred so prefer that if it wasn't just de-selected
      if (flag === A380XRadioAutoCallOutFlags.FourHundred) {
        newFlags |= A380XRadioAutoCallOutFlags.FiveHundred;
      } else {
        newFlags |= A380XRadioAutoCallOutFlags.FourHundred;
      }
    }

    // can't have 500 glide without 500
    if ((newFlags & A380XRadioAutoCallOutFlags.FiveHundred) === 0) {
      newFlags &= ~A380XRadioAutoCallOutFlags.FiveHundredGlide;
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
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.TwoThousandFiveHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.TwoThousandFiveHundred)}
            />
          </SettingItem>
          <SettingItem name="Twenty Five Hundred">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.TwentyFiveHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.TwentyFiveHundred)}
            />
          </SettingItem>
          <SettingItem name="Two Thousand">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.TwoThousand) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.TwoThousand)}
            />
          </SettingItem>
          <SettingItem name="One Thousand">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.OneThousand) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.OneThousand)}
            />
          </SettingItem>
          {/* TODO enable this when the new rust FWC is merged with the 500 hundred GS inhibit logic */}
          {/* <SettingGroup> */}
          {/* groupType="parent" */}
          <SettingItem name="Five Hundred">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.FiveHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.FiveHundred)}
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
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.FourHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.FourHundred)}
            />
          </SettingItem>
          <SettingItem name="Three Hundred">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.ThreeHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.ThreeHundred)}
            />
          </SettingItem>
          <SettingItem name="Two Hundred">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.TwoHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.TwoHundred)}
            />
          </SettingItem>
          <SettingItem name="One Hundred">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.OneHundred) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.OneHundred)}
            />
          </SettingItem>
        </div>
        <div className="ml-3 divide-y-2 divide-theme-accent">
          <SettingItem name="Ninety">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Ninety) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Ninety)}
            />
          </SettingItem>

          <SettingItem name="Eighty">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Eighty) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Eighty)}
            />
          </SettingItem>

          <SettingItem name="Seventy">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Seventy) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Seventy)}
            />
          </SettingItem>

          <SettingItem name="Sixty">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Sixty) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Sixty)}
            />
          </SettingItem>

          <SettingItem name="Fifty">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Fifty) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Fifty)}
            />
          </SettingItem>

          <SettingItem name="Forty">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Forty) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Forty)}
            />
          </SettingItem>

          <SettingItem name="Thirty">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Thirty) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Thirty)}
            />
          </SettingItem>

          <SettingItem name="Twenty">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Twenty) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Twenty)}
            />
          </SettingItem>

          <SettingItem name="Ten">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Ten) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Ten)}
            />
          </SettingItem>

          <SettingItem name="Five">
            <Toggle
              value={(autoCallOuts & A380XRadioAutoCallOutFlags.Five) > 0}
              onToggle={() => toggleRadioAcoFlag(A380XRadioAutoCallOutFlags.Five)}
            />
          </SettingItem>
        </div>
      </div>
      <SettingItem name={t('Settings.AutomaticCallOuts.ResetStandardConfig')}>
        <button
          type="button"
          className="rounded-md border-2 border-theme-highlight bg-theme-highlight px-5
                                       py-2.5 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
          onClick={() => setAutoCallOuts(A380X_DEFAULT_RADIO_AUTO_CALL_OUTS)}
        >
          {t('Settings.AutomaticCallOuts.Reset')}
        </button>
      </SettingItem>
    </SettingsPage>
  );
};
