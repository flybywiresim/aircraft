// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useContext } from 'react';
import {
  usePersistentBooleanProperty,
  usePersistentNumberProperty,
  usePersistentProperty,
  useSimVar,
} from '@flybywiresim/fbw-sdk';

import { t } from '../../Localization/translation';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ButtonType, SettingGroup, SettingItem, SettingsPage } from '../Settings';

import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { AircraftContext } from '@flybywiresim/flypad';

type SimVarButton = {
  simVarValue: number;
};

export const RealismPage = () => {
  const aircraftContext = useContext(AircraftContext);

  const [adirsAlignTime, setAdirsAlignTime] = usePersistentProperty('CONFIG_ALIGN_TIME', 'REAL');
  const [, setAdirsAlignTimeSimVar] = useSimVar('L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME', 'Enum', Number.MAX_SAFE_INTEGER);
  const [dmcSelfTestTime, setDmcSelfTestTime] = usePersistentProperty('CONFIG_SELF_TEST_TIME', '12');
  const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
  const [mcduInput, setMcduInput] = usePersistentBooleanProperty('MCDU_KB_INPUT', false);
  const [mcduTimeout, setMcduTimeout] = usePersistentProperty('CONFIG_MCDU_KB_TIMEOUT', '60');
  const [pauseAtTod, setPauseAtTod] = usePersistentBooleanProperty('PAUSE_AT_TOD', false);
  const [todOffset, setTodOffset] = usePersistentNumberProperty('PAUSE_AT_TOD_DISTANCE', 10);
  const [realisticTiller, setRealisticTiller] = usePersistentNumberProperty('REALISTIC_TILLER_ENABLED', 0);
  const [autoFillChecklists, setAutoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);
  const [syncEfis, setFoEfis] = usePersistentNumberProperty('FO_SYNC_EFIS_ENABLED', 0);
  const [pilotAvatar, setPilotAvatar] = usePersistentNumberProperty('CONFIG_PILOT_AVATAR_VISIBLE', 0);
  const [firstOfficerAvatar, setFirstOfficerAvatar] = usePersistentNumberProperty(
    'CONFIG_FIRST_OFFICER_AVATAR_VISIBLE',
    0,
  );
  const [eclSoftKeys, setEclSoftKeys] = usePersistentNumberProperty('CONFIG_A380X_SHOW_ECL_SOFTKEYS', 0);

  const adirsAlignTimeButtons: (ButtonType & SimVarButton)[] = [
    { name: t('Settings.Instant'), setting: 'INSTANT', simVarValue: 1 },
    { name: t('Settings.Fast'), setting: 'FAST', simVarValue: 2 },
    { name: t('Settings.Real'), setting: 'REAL', simVarValue: 0 },
  ];

  const dmcSelfTestTimeButtons: ButtonType[] = [
    { name: t('Settings.Instant'), setting: '0' },
    { name: t('Settings.Fast'), setting: '5' },
    { name: t('Settings.Real'), setting: '12' },
  ];

  const boardingRateButtons: ButtonType[] = [
    { name: t('Settings.Instant'), setting: 'INSTANT' },
    { name: t('Settings.Fast'), setting: 'FAST' },
    { name: t('Settings.Real'), setting: 'REAL' },
  ];

  return (
    <SettingsPage name={t('Settings.Realism.Title')}>
      <SettingItem name={t('Settings.Realism.AdirsAlignTime')}>
        <SelectGroup>
          {adirsAlignTimeButtons.map((button) => (
            <SelectItem
              key={button.name}
              onSelect={() => {
                setAdirsAlignTime(button.setting);
                setAdirsAlignTimeSimVar(button.simVarValue);
              }}
              selected={adirsAlignTime === button.setting}
            >
              {button.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SettingItem>

      <SettingItem name={t('Settings.Realism.DmcSelfTestTime')}>
        <SelectGroup>
          {dmcSelfTestTimeButtons.map((button) => (
            <SelectItem
              key={button.name}
              onSelect={() => setDmcSelfTestTime(button.setting)}
              selected={dmcSelfTestTime === button.setting}
            >
              {button.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SettingItem>

      <SettingItem name={t('Settings.Realism.BoardingTime')}>
        <SelectGroup>
          {boardingRateButtons.map((button) => (
            <SelectItem
              key={button.name}
              onSelect={() => setBoardingRate(button.setting)}
              selected={boardingRate === button.setting}
            >
              {button.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SettingItem>

      <SettingItem name={t('Settings.Realism.AutofillChecklists')} unrealistic>
        <Toggle value={!!autoFillChecklists} onToggle={(value) => setAutoFillChecklists(value ? 1 : 0)} />
      </SettingItem>

      <SettingItem name={t('Settings.Realism.SeparateTillerFromRudderInputs')}>
        <Toggle value={!!realisticTiller} onToggle={(value) => setRealisticTiller(value ? 1 : 0)} />
      </SettingItem>

      {aircraftContext.settingsPages.realism.mcduKeyboard && (
        <SettingGroup>
          <SettingItem name={t('Settings.Realism.McduKeyboardInput')} unrealistic groupType="parent">
            <Toggle value={mcduInput} onToggle={(value) => setMcduInput(value)} />
          </SettingItem>

          {mcduInput && (
            <SettingItem name={t('Settings.Realism.McduFocusTimeout')} groupType="sub">
              <SimpleInput
                className="w-30 text-center"
                value={mcduTimeout}
                min={5}
                max={120}
                disabled={!mcduInput}
                onChange={(event) => {
                  if (!Number.isNaN(event) && parseInt(event) >= 5 && parseInt(event) <= 120) {
                    setMcduTimeout(event.trim());
                  }
                }}
              />
            </SettingItem>
          )}
        </SettingGroup>
      )}

      <SettingItem name={t('Settings.Realism.SyncEfis')} unrealistic>
        <Toggle value={!!syncEfis} onToggle={(value) => setFoEfis(value ? 1 : 0)} />
      </SettingItem>

      {aircraftContext.settingsPages.realism.pilotAvatars && (
        <>
          <SettingItem name={t('Settings.Realism.PilotAvatar')}>
            <Toggle value={!!pilotAvatar} onToggle={(value) => setPilotAvatar(value ? 1 : 0)} />
          </SettingItem>

          <SettingItem name={t('Settings.Realism.FirstOfficerAvatar')}>
            <Toggle value={!!firstOfficerAvatar} onToggle={(value) => setFirstOfficerAvatar(value ? 1 : 0)} />
          </SettingItem>
        </>
      )}

      {aircraftContext.settingsPages.realism.pauseOnTod && (
        <SettingGroup>
          <SettingItem name={t('Settings.Realism.PauseAtTod')} unrealistic groupType="parent">
            <Toggle value={pauseAtTod} onToggle={(value) => setPauseAtTod(value)} />
          </SettingItem>
          {pauseAtTod && (
            <SettingItem name={t('Settings.Realism.PauseAtTodDistance')} groupType="sub">
              <SimpleInput
                className="w-30 text-center"
                value={todOffset}
                min={0}
                max={50.0}
                disabled={!pauseAtTod}
                onChange={(event) => {
                  if (!Number.isNaN(event) && parseInt(event) >= 0 && parseInt(event) <= 50.0) {
                    setTodOffset(parseFloat(event.trim()));
                  }
                }}
              />
            </SettingItem>
          )}
        </SettingGroup>
      )}

      {aircraftContext.settingsPages.realism.eclSoftKeys && (
        <SettingItem name={t('Settings.Realism.EclSoftKeys')} unrealistic>
          <Toggle value={!!eclSoftKeys} onToggle={(value) => setEclSoftKeys(value ? 1 : 0)} />
        </SettingItem>
      )}
    </SettingsPage>
  );
};
