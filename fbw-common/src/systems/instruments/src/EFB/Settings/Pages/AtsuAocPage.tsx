// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';

import {
  usePersistentProperty,
  SENTRY_CONSENT_KEY,
  SentryConsentState,
  isMsfs2024,
  usePersistentSetting,
  NXDataStoreSettings,
} from '@flybywiresim/fbw-sdk';

import { toast } from 'react-toastify';
import { t } from '../../Localization/translation';
import { useModals, PromptModal } from '../../UtilComponents/Modals/Modals';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';
import { AcarsConnector, AcarsClient } from '../../../../../datalink/router/src';

export const AtsuAocPage = () => {
  const [atisSource, setAtisSource] = usePersistentProperty('CONFIG_ATIS_SRC', 'FAA');
  const [metarSource, setMetarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');
  const [tafSource, setTafSource] = usePersistentProperty('CONFIG_TAF_SRC', isMsfs2024() ? 'MSFS' : 'NOAA');
  const [telexEnabled, setTelexEnabled] = usePersistentProperty('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED');

  const [hoppieUserId, setHoppieUserId] = usePersistentProperty('CONFIG_HOPPIE_USERID');
  const [saiLogonKey, setSaiLogonKey] = usePersistentProperty('CONFIG_SAI_LOGON_KEY');

  const [acarsProvider, setAcarsProvider] = usePersistentSetting('ACARS_PROVIDER');

  const [sentryEnabled, setSentryEnabled] = usePersistentProperty(SENTRY_CONSENT_KEY, SentryConsentState.Refused);

  const getAcarsResponse = (value: string): Promise<any> =>
    new Promise((resolve, reject) => {
      if (!value || value === '') {
        resolve(value);
      }

      const body = {
        from: 'FBWA32NX',
        to: 'SERVER',
        type: 'ping',
        packet: '',
      };
      return AcarsClient.getData(body).then((resp) => {
        if (resp.response === 'error {invalid logon code}') {
          reject(new Error(`Error: Unknown user ID: ${resp.response}`));
        } else {
          resolve(value);
        }
      });
    });

  const handleAcarsUsernameInput = (value: string) => {
    getAcarsResponse(value)
      .then((response) => {
        if (!value) {
          toast.success(`${t('Settings.AtsuAoc.YourAcarsIdHasBeenRemoved')} ${response}`);
          return;
        }
        toast.success(`${t('Settings.AtsuAoc.YourAcarsIdHasBeenValidated')} ${response}`);
        AcarsConnector.activateAcars();
      })
      .catch((_error) => {
        toast.error(t('Settings.AtsuAoc.ThereWasAnErrorEncounteredWhenValidatingYourAcarsId'));
      });
  };

  const handleAcarsProviderChange = (provider: NXDataStoreSettings['ACARS_PROVIDER']) => {
    setAcarsProvider(provider);
    if (provider == 'NONE') {
      AcarsConnector.deactivateAcars();
    } else {
      AcarsConnector.activateAcars();
    }
  };

  const atisSourceButtons: ButtonType[] = [
    { name: 'FAA (US)', setting: 'FAA' },
    { name: 'PilotEdge', setting: 'PILOTEDGE' },
    { name: 'IVAO', setting: 'IVAO' },
    { name: 'VATSIM', setting: 'VATSIM' },
  ];

  const metarSourceButtons: ButtonType[] = [
    { name: 'MSFS', setting: 'MSFS' },
    { name: 'NOAA', setting: 'NOAA' },
    { name: 'PilotEdge', setting: 'PILOTEDGE' },
    { name: 'VATSIM', setting: 'VATSIM' },
  ];

  let tafSourceButtons: ButtonType[] = [
    { name: 'MSFS', setting: 'MSFS' },
    { name: 'NOAA', setting: 'NOAA' },
  ];
  if (!isMsfs2024()) {
    tafSourceButtons = tafSourceButtons.slice(1);
  }

  const acarsProviderButtons = [
    { name: t('Settings.AtsuAoc.AcarsProviderNone'), setting: 'NONE' },
    { name: t('Settings.AtsuAoc.AcarsProviderHoppie'), setting: 'HOPPIE' },
    { name: t('Settings.AtsuAoc.AcarsProviderBatc'), setting: 'BATC' },
    { name: t('Settings.AtsuAoc.AcarsProviderSai'), setting: 'SAI' },
  ] as const;

  const { showModal } = useModals();

  const handleTelexToggle = (toggleValue: boolean): void => {
    if (toggleValue) {
      showModal(
        <PromptModal
          title={t('Settings.AtsuAoc.TelexWarning')}
          bodyText={t('Settings.AtsuAoc.TelexEnablesFreeTextAndLiveMap')}
          onConfirm={() => setTelexEnabled('ENABLED')}
          confirmText={t('Settings.AtsuAoc.EnableTelex')}
        />,
      );
    } else {
      setTelexEnabled('DISABLED');
    }
  };

  const handleSentryToggle = (toggleValue: boolean) => {
    if (toggleValue) {
      showModal(
        <PromptModal
          title={t('Settings.AtsuAoc.OptionalA32nxErrorReporting')}
          bodyText={t('Settings.AtsuAoc.YouAreAbleToOptIntoAnonymousErrorReporting')}
          onConfirm={() => setSentryEnabled(SentryConsentState.Given)}
          onCancel={() => setSentryEnabled(SentryConsentState.Refused)}
          confirmText={t('Settings.AtsuAoc.Enable')}
        />,
      );
    } else {
      setSentryEnabled(SentryConsentState.Refused);
    }
  };

  function handleWeatherSource(source: string, type: string) {
    if (type !== 'TAF') {
      AcarsConnector.deactivateAcars();
    }

    if (type === 'ATIS') {
      setAtisSource(source);
    } else if (type === 'METAR') {
      setMetarSource(source);
    } else if (type === 'TAF') {
      setTafSource(source);
    }

    if (type !== 'TAF') {
      AcarsConnector.activateAcars();
    }
  }

  return (
    <SettingsPage name={t('Settings.AtsuAoc.Title')}>
      <SettingItem name={t('Settings.AtsuAoc.AtisAtcSource')}>
        <SelectGroup>
          {atisSourceButtons.map((button) => (
            <SelectItem
              key={button.setting}
              onSelect={() => handleWeatherSource(button.setting, 'ATIS')}
              selected={atisSource === button.setting}
            >
              {button.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SettingItem>

      <SettingItem name={t('Settings.AtsuAoc.MetarSource')}>
        <SelectGroup>
          {metarSourceButtons.map((button) => (
            <SelectItem
              key={button.setting}
              onSelect={() => handleWeatherSource(button.setting, 'METAR')}
              selected={metarSource === button.setting}
            >
              {button.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SettingItem>

      <SettingItem name={t('Settings.AtsuAoc.TafSource')}>
        <SelectGroup>
          {tafSourceButtons.map((button) => (
            <SelectItem
              key={button.setting}
              onSelect={() => handleWeatherSource(button.setting, 'TAF')}
              selected={tafSource === button.setting}
            >
              {button.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SettingItem>

      <SettingItem name={t('Settings.AtsuAoc.ErrorReporting')}>
        <Toggle
          value={sentryEnabled === SentryConsentState.Given}
          onToggle={(toggleValue) => handleSentryToggle(toggleValue)}
        />
      </SettingItem>

      <SettingItem name={t('Settings.AtsuAoc.Telex')}>
        <Toggle value={telexEnabled === 'ENABLED'} onToggle={(toggleValue) => handleTelexToggle(toggleValue)} />
      </SettingItem>

      <SettingItem name={t('Settings.AtsuAoc.HoppieProvider')}>
        <SelectGroup>
          {acarsProviderButtons.map((button) => (
            <SelectItem
              key={button.setting}
              onSelect={() => handleAcarsProviderChange(button.setting)}
              selected={acarsProvider === button.setting}
            >
              {button.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SettingItem>

      {(acarsProvider === 'HOPPIE' || acarsProvider === 'SAI') && (
        <SettingItem
          name={
            acarsProvider === 'SAI'
              ? t('Settings.AtsuAoc.SaiLogonKey') ?? 'SAI Logon Key'
              : t('Settings.AtsuAoc.HoppieUserId')
          }
        >
          <SimpleInput
            className="w-30 text-center"
            value={acarsProvider === 'SAI' ? saiLogonKey : hoppieUserId}
            onBlur={(value) => {
              const trimmed = value.replace(/\s/g, '');
              if (acarsProvider === 'SAI') {
                setSaiLogonKey(trimmed);
              } else {
                setHoppieUserId(trimmed);
              }
              handleAcarsUsernameInput(trimmed);
            }}
            onChange={(value) => {
              if (acarsProvider === 'SAI') {
                setSaiLogonKey(value);
              } else {
                setHoppieUserId(value);
              }
            }}
          />
        </SettingItem>
      )}
    </SettingsPage>
  );
};
