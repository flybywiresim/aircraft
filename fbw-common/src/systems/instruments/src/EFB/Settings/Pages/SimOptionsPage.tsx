// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useContext, useRef, useState } from 'react';
import Slider from 'rc-slider';
import {
  DefaultPilotSeatConfig,
  PilotSeatConfig,
  usePersistentNumberProperty,
  usePersistentProperty,
  useSimVar,
} from '@flybywiresim/fbw-sdk';

import { toast } from 'react-toastify';
import { t } from '../../Localization/translation';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ButtonType, SettingGroup, SettingItem, SettingsPage } from '../Settings';

import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';

import { ThrottleConfig } from '../ThrottleConfig/ThrottleConfig';
import { AircraftContext } from '@flybywiresim/flypad';

export const SimOptionsPage = () => {
  const aircraftContext = useContext(AircraftContext);
  const [showThrottleSettings, setShowThrottleSettings] = useState(false);

  const [defaultBaro, setDefaultBaro] = usePersistentProperty('CONFIG_INIT_BARO_UNIT', 'AUTO');
  const [dynamicRegistration, setDynamicRegistration] = usePersistentProperty('DYNAMIC_REGISTRATION_DECAL', '0');
  const [fpSync, setFpSync] = usePersistentProperty('FP_SYNC', 'LOAD');
  const [simbridgeRemote, setSimbridgeRemoteStatus] = usePersistentProperty('CONFIG_SIMBRIDGE_REMOTE', 'local');
  const [simbridgeIp, setSimbridgeIp] = usePersistentProperty('CONFIG_SIMBRIDGE_IP', 'localhost');
  const [simbridgePort, setSimbridgePort] = usePersistentProperty('CONFIG_SIMBRIDGE_PORT', '8380');
  const [simbridgeEnabled, setSimbridgeEnabled] = usePersistentProperty('CONFIG_SIMBRIDGE_ENABLED', 'AUTO ON');
  const [radioReceiverUsage, setRadioReceiverUsage] = usePersistentProperty('RADIO_RECEIVER_USAGE_ENABLED', '0');
  const [, setRadioReceiverUsageSimVar] = useSimVar('L:A32NX_RADIO_RECEIVER_USAGE_ENABLED', 'number', 0);
  const [fdrEnabled, setFdrEnabled] = usePersistentProperty('FDR_ENABLED', '1');
  const [, setFdrEnabledSimVar] = useSimVar('L:A32NX_FDR_ENABLED', 'number', 1);
  const [wheelChocksEnabled, setWheelChocksEnabled] = usePersistentNumberProperty('MODEL_WHEELCHOCKS_ENABLED', 1);
  const [conesEnabled, setConesEnabled] = usePersistentNumberProperty('MODEL_CONES_ENABLED', 1);
  const [usingCabinAutobrightness, setUsingCabinAutobrightness] = usePersistentNumberProperty(
    'CABIN_USING_AUTOBRIGHTNESS',
    1,
  );
  const [cabinManualBrightness, setCabinManualBrightness] = usePersistentNumberProperty('CABIN_MANUAL_BRIGHTNESS', 0);
  const [pilotSeat, setPilotSeat] = usePersistentProperty('CONFIG_PILOT_SEAT', DefaultPilotSeatConfig);

  const defaultBaroButtons: ButtonType[] = [
    { name: t('Settings.SimOptions.Auto'), setting: 'AUTO' },
    { name: t('Settings.SimOptions.inHg'), setting: 'IN HG' },
    { name: t('Settings.SimOptions.Hpa'), setting: 'HPA' },
  ];

  const fpSyncButtons: ButtonType[] = [
    { name: t('Settings.SimOptions.None'), setting: 'NONE' },
    { name: t('Settings.SimOptions.LoadOnly'), setting: 'LOAD' },
    { name: t('Settings.SimOptions.Save'), setting: 'SAVE' },
  ];

  const pilotSeatButtons: ButtonType[] = [
    { name: t('Settings.SimOptions.Auto'), setting: PilotSeatConfig.Auto },
    { name: t('Settings.SimOptions.Left'), setting: PilotSeatConfig.Left },
    { name: t('Settings.SimOptions.Right'), setting: PilotSeatConfig.Right },
  ];

  const cabinBrightnessSliderRef = useRef<any>(null);

  return (
    <>
      {!showThrottleSettings && (
        <SettingsPage name={t('Settings.SimOptions.Title')}>
          <SettingItem name={t('Settings.SimOptions.DefaultBarometerUnit')}>
            <SelectGroup>
              {defaultBaroButtons.map((button) => (
                <SelectItem
                  key={button.setting}
                  onSelect={() => setDefaultBaro(button.setting)}
                  selected={defaultBaro === button.setting}
                >
                  {button.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SettingItem>

          {aircraftContext.settingsPages.sim.msfsFplnSync && (
            <SettingItem name={t('Settings.SimOptions.SyncMsfsFlightPlan')}>
              <SelectGroup>
                {fpSyncButtons.map((button) => (
                  <SelectItem
                    key={button.setting}
                    onSelect={() => setFpSync(button.setting)}
                    selected={fpSync === button.setting}
                  >
                    {button.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SettingItem>
          )}

          <SettingItem name={t('Settings.SimOptions.EnableSimBridge')}>
            <SelectGroup>
              <SelectItem
                className="color-red text-center"
                onSelect={() => setSimbridgeEnabled('AUTO ON')}
                selected={simbridgeEnabled === 'AUTO ON' || simbridgeEnabled === 'AUTO OFF'}
              >
                {t('Settings.SimOptions.Auto')}
              </SelectItem>
              <SelectItem onSelect={() => setSimbridgeEnabled('PERM OFF')} selected={simbridgeEnabled === 'PERM OFF'}>
                {t('Settings.SimOptions.Off')}
              </SelectItem>
            </SelectGroup>
            <div className="pt-2 text-center">
              {simbridgeEnabled === 'AUTO ON' ? t('Settings.SimOptions.Active') : t('Settings.SimOptions.Inactive')}
            </div>
          </SettingItem>

          <SettingItem name={t('Settings.SimOptions.SimbridgeMachine')}>
            <SelectGroup>
              <SelectItem
                className="color-red text-center"
                onSelect={() => {
                  setSimbridgeRemoteStatus('local');
                }}
                selected={simbridgeRemote === 'local'}
              >
                {t('Settings.SimOptions.SimbridgeLocal')}
              </SelectItem>
              <SelectItem
                onSelect={() => {
                  setSimbridgeRemoteStatus('remote');
                }}
                selected={simbridgeRemote === 'remote'}
              >
                {t('Settings.SimOptions.SimbridgeRemote')}
              </SelectItem>
            </SelectGroup>
            {simbridgeRemote === 'remote' && (
              <div className="pt-2 text-center">
                <SimpleInput
                  className="w-30 text-center"
                  value={simbridgeIp}
                  onChange={(event) => {
                    // Error on empty string
                    if (event === '') {
                      toast.error(t('Settings.SimOptions.SimbridgeEmptyAddress'));
                      // Reset to previous value
                      setSimbridgeIp(simbridgeIp);
                      return;
                    }
                    // Remove whitespace
                    setSimbridgeIp(event.replace(/\s/g, ''));
                  }}
                />
              </div>
            )}
          </SettingItem>

          <SettingItem name={t('Settings.SimOptions.SimBridgePort')}>
            <SimpleInput
              className="w-30 text-center"
              value={simbridgePort}
              onChange={(event) => {
                setSimbridgePort(event.replace(/[^0-9]+/g, ''));
              }}
            />
          </SettingItem>
          {aircraftContext.settingsPages.sim.registrationDecal && (
            <SettingItem name={t('Settings.SimOptions.DynamicRegistrationDecal')}>
              <Toggle
                value={dynamicRegistration === '1'}
                onToggle={(value) => setDynamicRegistration(value ? '1' : '0')}
              />
            </SettingItem>
          )}

          <SettingItem name={t('Settings.SimOptions.UseCalculatedIlsSignals')}>
            <Toggle
              value={radioReceiverUsage === '1'}
              onToggle={(value) => {
                setRadioReceiverUsage(value ? '1' : '0');
                setRadioReceiverUsageSimVar(value ? 1 : 0);
              }}
            />
          </SettingItem>

          <SettingItem name={t('Settings.SimOptions.FdrEnabled')}>
            <Toggle
              value={fdrEnabled === '1'}
              onToggle={(value) => {
                setFdrEnabled(value ? '1' : '0');
                setFdrEnabledSimVar(value ? 1 : 0);
              }}
            />
          </SettingItem>

          {aircraftContext.settingsPages.sim.wheelChocks && (
            <SettingItem name={t('Settings.SimOptions.WheelChocksEnabled')}>
              <Toggle
                value={wheelChocksEnabled === 1}
                onToggle={(value) => {
                  setWheelChocksEnabled(value ? 1 : 0);
                }}
              />
            </SettingItem>
          )}

          {aircraftContext.settingsPages.sim.cones && (
            <SettingItem name={t('Settings.SimOptions.ConesEnabled')}>
              <Toggle
                value={conesEnabled === 1}
                onToggle={(value) => {
                  setConesEnabled(value ? 1 : 0);
                }}
              />
            </SettingItem>
          )}

          <SettingItem name={t('Settings.SimOptions.ThrottleDetents')}>
            <button
              type="button"
              className="rounded-md border-2 border-theme-highlight bg-theme-highlight px-5
                                       py-2.5 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
              onClick={() => setShowThrottleSettings(true)}
            >
              {t('Settings.SimOptions.Calibrate')}
            </button>
          </SettingItem>

          {aircraftContext.settingsPages.sim.pilotSeat && (
            <SettingItem name={t('Settings.SimOptions.PilotSeat')}>
              <SelectGroup>
                {pilotSeatButtons.map((button) => (
                  <SelectItem
                    key={button.setting}
                    onSelect={() => setPilotSeat(button.setting)}
                    selected={pilotSeat === button.setting}
                  >
                    {button.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SettingItem>
          )}

          {aircraftContext.settingsPages.sim.cabinLighting && (
            <SettingGroup>
              <SettingItem name={t('Settings.SimOptions.CabinAutoBrightness')}>
                <Toggle
                  value={usingCabinAutobrightness === 1}
                  onToggle={(value) => {
                    setUsingCabinAutobrightness(value ? 1 : 0);
                  }}
                />
              </SettingItem>

              {!usingCabinAutobrightness && (
                <SettingItem name={t('Settings.SimOptions.CabinManualBrightness')}>
                  <div className="flex flex-row items-center space-x-8">
                    <Slider
                      ref={cabinBrightnessSliderRef}
                      style={{ width: '24rem' }}
                      value={cabinManualBrightness}
                      onChange={(value) => setCabinManualBrightness(value)}
                      onAfterChange={() => cabinBrightnessSliderRef.current.blur()}
                    />
                    <SimpleInput
                      min={0}
                      max={100}
                      value={cabinManualBrightness}
                      className="w-20 text-center"
                      onChange={(value) => setCabinManualBrightness(Number.parseInt(value))}
                      number
                    />
                  </div>
                </SettingItem>
              )}
            </SettingGroup>
          )}
        </SettingsPage>
      )}
      <ThrottleConfig isShown={showThrottleSettings} onClose={() => setShowThrottleSettings(false)} />
    </>
  );
};
