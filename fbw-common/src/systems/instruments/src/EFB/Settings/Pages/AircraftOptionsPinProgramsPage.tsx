// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { usePersistentNumberProperty, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import React, { useContext, useState } from 'react';
import { Link, Route, Switch } from 'react-router-dom';
import { PageLink, TabRoutes, pathify } from '../../Utils/routing';
import { t } from '../../Localization/translation';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { AircraftContext } from '@flybywiresim/flypad';

const basePinProgRoute = `/settings/${pathify('Aircraft Options / Pin Programs')}`;

export const AircraftOptionsPinProgramsPage = () => {
  const aircraftContext = useContext(AircraftContext);
  const [acoPage] = useState(React.createElement(aircraftContext.settingsPages.autoCalloutsPage));

  const subTabs: PageLink[] = [
    { alias: t('Settings.AutomaticCallOuts.Title'), name: 'Automatic Call Outs', component: acoPage },
  ];

  const [thrustReductionHeight, setThrustReductionHeight] = usePersistentProperty('CONFIG_THR_RED_ALT', '1500');
  const [thrustReductionHeightSetting, setThrustReductionHeightSetting] = useState(thrustReductionHeight);
  const [accelerationHeight, setAccelerationHeight] = usePersistentProperty('CONFIG_ACCEL_ALT', '1500');
  const [accelerationHeightSetting, setAccelerationHeightSetting] = useState(accelerationHeight);
  const [accelerationOutHeight, setAccelerationOutHeight] = usePersistentProperty('CONFIG_ENG_OUT_ACCEL_ALT', '1500');
  const [accelerationOutHeightSetting, setAccelerationOutHeightSetting] = useState(accelerationOutHeight);

  const [usingMetric, setUsingMetric] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
  const [paxSigns, setPaxSigns] = usePersistentProperty('CONFIG_USING_PORTABLE_DEVICES', '0');
  const [isisBaro, setIsisBaro] = usePersistentProperty('ISIS_BARO_UNIT_INHG', '0');
  const [isisMetricAltitude, setIsisMetricAltitude] = usePersistentNumberProperty('ISIS_METRIC_ALTITUDE', 0);
  const [vhfSpacing, setVhfSpacing] = usePersistentProperty('RMP_VHF_SPACING_25KHZ', '0');
  const [latLonExtended, setLatLonExtended] = usePersistentProperty('LATLON_EXT_FMT', '0');
  const [satcomEnabled, setsatcomEnabled] = usePersistentNumberProperty('MODEL_SATCOM_ENABLED', 0);

  const handleSetThrustReductionAlt = (value: string) => {
    setThrustReductionHeightSetting(value);

    const parsedValue = parseInt(value);

    if (parsedValue >= 400 && parsedValue <= 5000) {
      setThrustReductionHeight(value.trim());
    }
  };

  const handleSetAccelerationAlt = (value: string) => {
    setAccelerationHeightSetting(value);

    const parsedValue = parseInt(value);

    if (parsedValue >= 400 && parsedValue <= 10000) {
      setAccelerationHeight(value.trim());
    }
  };

  const handleSetAccelerationOutAlt = (value: string) => {
    setAccelerationOutHeightSetting(value);

    const parsedValue = parseInt(value);

    if (parsedValue >= 400 && parsedValue <= 10000) {
      setAccelerationOutHeight(value.trim());
    }
  };

  const paxSignsButtons: ButtonType[] = [
    { name: 'No Smoking', setting: '0' },
    { name: 'No Portable Device', setting: '1' },
  ];

  const weightUnitButtons: ButtonType[] = [
    { name: 'kg', setting: '1' },
    { name: 'lbs', setting: '0' },
  ];

  const isisBaroButtons: ButtonType[] = [
    { name: 'hPa', setting: '0' },
    { name: 'hPa/inHg', setting: '1' },
  ];

  const vhfSpacingButtons: ButtonType[] = [
    { name: '8.33 kHz', setting: '0' },
    { name: '25 kHz', setting: '1' },
  ];

  const latLonExtendedButtons: ButtonType[] = [
    { name: 'LLnn', setting: '0' },
    { name: 'AxxByyy', setting: '1' },
  ];

  return (
    <Switch>
      <Route exact path={basePinProgRoute}>
        <SettingsPage name={t('Settings.AircraftOptionsPinPrograms.Title')}>
          <SettingItem name={`${t('Settings.AircraftOptionsPinPrograms.ThrustReductionHeight')}`}>
            <SimpleInput
              className="w-30 text-center"
              placeholder={thrustReductionHeight}
              value={thrustReductionHeightSetting}
              min={400}
              max={5000}
              onChange={(event) => handleSetThrustReductionAlt(event)}
            />
          </SettingItem>
          <SettingItem name={`${t('Settings.AircraftOptionsPinPrograms.AccelerationHeight')}`}>
            <SimpleInput
              className="w-30 text-center"
              placeholder={accelerationHeight}
              value={accelerationHeightSetting}
              min={400}
              max={10000}
              onChange={(event) => handleSetAccelerationAlt(event)}
            />
          </SettingItem>
          <SettingItem name={`${t('Settings.AircraftOptionsPinPrograms.EngineOutAccelerationHeight')}`}>
            <SimpleInput
              className="w-30 text-center"
              placeholder={accelerationOutHeight}
              value={accelerationOutHeightSetting}
              min={400}
              max={10000}
              onChange={(event) => handleSetAccelerationOutAlt(event)}
            />
          </SettingItem>

          <SettingItem name={t('Settings.AircraftOptionsPinPrograms.IsisBaroUnit')}>
            <SelectGroup>
              {isisBaroButtons.map((button) => (
                <SelectItem
                  key={button.name}
                  onSelect={() => setIsisBaro(button.setting)}
                  selected={isisBaro === button.setting}
                >
                  {button.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SettingItem>

          <SettingItem name={t('Settings.AircraftOptionsPinPrograms.IsisMetricAltitude')}>
            <Toggle value={!!isisMetricAltitude} onToggle={(value) => setIsisMetricAltitude(value ? 1 : 0)} />
          </SettingItem>
          {aircraftContext.settingsPages.pinProgram.paxSign && (
            <SettingItem name={t('Settings.AircraftOptionsPinPrograms.PaxSigns')}>
              <SelectGroup>
                {paxSignsButtons.map((button) => (
                  <SelectItem
                    key={button.name}
                    onSelect={() => setPaxSigns(button.setting)}
                    selected={paxSigns === button.setting}
                  >
                    {button.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SettingItem>
          )}

          {aircraftContext.settingsPages.pinProgram.rmpVhfSpacing && (
            <SettingItem name={t('Settings.AircraftOptionsPinPrograms.RmpVhfSpacing')}>
              <SelectGroup>
                {vhfSpacingButtons.map((button) => (
                  <SelectItem
                    key={button.name}
                    onSelect={() => setVhfSpacing(button.setting)}
                    selected={vhfSpacing === button.setting}
                  >
                    {button.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SettingItem>
          )}

          {aircraftContext.settingsPages.pinProgram.latLonExtend && (
            <SettingItem name={t('Settings.AircraftOptionsPinPrograms.LatLonExtendedFormat')}>
              <SelectGroup>
                {latLonExtendedButtons.map((button) => (
                  <SelectItem
                    key={button.name}
                    onSelect={() => setLatLonExtended(button.setting)}
                    selected={latLonExtended === button.setting}
                  >
                    {button.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SettingItem>
          )}

          <SettingItem name={t('Settings.AircraftOptionsPinPrograms.WeightUnit')}>
            <SelectGroup>
              {weightUnitButtons.map((button) => (
                <SelectItem
                  key={button.name}
                  onSelect={() => setUsingMetric(button.setting)}
                  selected={usingMetric === button.setting}
                >
                  {button.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SettingItem>
          {aircraftContext.settingsPages.pinProgram.satcom && (
            <SettingItem name={t('Settings.AircraftOptionsPinPrograms.Satcom')}>
              <Toggle value={!!satcomEnabled} onToggle={(value) => setsatcomEnabled(value ? 1 : 0)} />
            </SettingItem>
          )}

          <SettingItem name={t('Settings.AutomaticCallOuts.Title')}>
            <Link
              to={`${basePinProgRoute}/${pathify('Automatic Call Outs')}`}
              className="rounded-md border-2 border-theme-highlight bg-theme-highlight px-5
                                py-2.5 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
            >
              {t('Settings.AircraftOptionsPinPrograms.Select')}
            </Link>
          </SettingItem>
        </SettingsPage>
      </Route>
      <TabRoutes basePath={basePinProgRoute} tabs={subTabs} />
    </Switch>
  );
};
