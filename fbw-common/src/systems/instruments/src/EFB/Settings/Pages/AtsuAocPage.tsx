// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';

import {
  usePersistentProperty,
  SENTRY_CONSENT_KEY,
  SentryConsentState,
  usePersistentSetting,
  NXDataStoreSettings,
  useSimVar,
  ConfigAtisSource,
  ConfigMetarSource,
  ConfigTafSource,
  ConfigWeatherMap,
  CONFIG_ATIS_WEATHER_SOURCES,
  CONFIG_METAR_WEATHER_SOURCES,
  CONFIG_TAF_WEATHER_SOURCES,
  CONFIG_WEATHER_SOURCE_LABELS,
} from '@flybywiresim/fbw-sdk-react';

import { toast } from 'react-toastify';
import { t } from '../../Localization/translation';
import { useModals, PromptModal } from '../../UtilComponents/Modals/Modals';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SettingItem, SettingsPage } from '../Settings';
import { AcarsConnector, AcarsClient } from '../../../../../datalink/router/src';

export const AtsuAocPage = () => {
  const [atisSource, setAtisSource] = usePersistentSetting('CONFIG_ATIS_SRC');
  const [metarSource, setMetarSource] = usePersistentSetting('CONFIG_METAR_SRC');
  const [tafSource, setTafSource] = usePersistentSetting('CONFIG_TAF_SRC');
  const [telexEnabled, setTelexEnabled] = usePersistentProperty('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED');

  const [hoppieUserId, setHoppieUserId] = usePersistentProperty('CONFIG_HOPPIE_USERID');
  const [saiLogonKey, setSaiLogonKey] = usePersistentProperty('CONFIG_SAI_LOGON_KEY');

  const [acarsProvider, setAcarsProvider] = usePersistentSetting('ACARS_PROVIDER');
  const [acarsState] = useSimVar('L:A32NX_ACARS_ACTIVE', 'boolean', 1000);

  const [sentryEnabled, setSentryEnabled] = usePersistentProperty(SENTRY_CONSENT_KEY, SentryConsentState.Refused);

  const isUnavailableAcarsWeatherSource = (source: ConfigAtisSource | ConfigMetarSource) =>
    (source === ConfigWeatherMap.SAI && acarsProvider !== 'SAI') ||
    (source === ConfigWeatherMap.BEYONDATC && acarsProvider !== 'BATC');

  const createWeatherSourceButtons = <T extends ConfigAtisSource | ConfigMetarSource | ConfigTafSource>(
    sources: readonly T[],
  ) => sources.map((source) => ({ name: CONFIG_WEATHER_SOURCE_LABELS[source], setting: source }));

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

  const formatAcarsMessage = (messageKey: string) =>
    t(messageKey).replace(
      '{acarsid}',
      acarsProvider === 'SAI' ? t('Settings.AtsuAoc.SAIApiKey') : t('Settings.AtsuAoc.HoppieUserId'),
    );

  const handleAcarsUsernameInput = (value: string) => {
    getAcarsResponse(value)
      .then((response) => {
        if (!value) {
          toast.success(`${formatAcarsMessage('Settings.AtsuAoc.YourAcarsIdHasBeenRemoved')} ${response}`);
          return;
        }
        toast.success(`${formatAcarsMessage('Settings.AtsuAoc.YourAcarsIdHasBeenValidated')} ${response}`);
        AcarsConnector.activateAcars();
      })
      .catch(() => {
        toast.error(formatAcarsMessage('Settings.AtsuAoc.ThereWasAnErrorEncounteredWhenValidatingYourAcarsId'));
      });
  };

  const handleAcarsProviderChange = (provider: NXDataStoreSettings['ACARS_PROVIDER']) => {
    setAcarsProvider(provider);
    if (provider === 'SAI') {
      setAtisSource(ConfigWeatherMap.SAI);
      setMetarSource(ConfigWeatherMap.SAI);
    } else if (provider === 'BATC') {
      setAtisSource(ConfigWeatherMap.BEYONDATC);
      setMetarSource(ConfigWeatherMap.BEYONDATC);
    } else {
      setAtisSource(ConfigWeatherMap.FAA);
      setMetarSource(ConfigWeatherMap.MSFS);
    }

    if (provider == 'NONE') {
      AcarsConnector.deactivateAcars();
      setMetarSource(ConfigWeatherMap.MSFS);
      setAtisSource(ConfigWeatherMap.FAA);
    } else {
      AcarsConnector.activateAcars();
    }
  };

  const atisSourceButtons = createWeatherSourceButtons(CONFIG_ATIS_WEATHER_SOURCES);
  const metarSourceButtons = createWeatherSourceButtons(CONFIG_METAR_WEATHER_SOURCES);

  const tafSourceButtons = createWeatherSourceButtons(CONFIG_TAF_WEATHER_SOURCES);

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

  const restartAcars = (updateSource: () => void) => {
    AcarsConnector.deactivateAcars();
    updateSource();
    AcarsConnector.activateAcars();
  };

  const handleAtisSource = (source: ConfigAtisSource) => {
    restartAcars(() => setAtisSource(source));
  };

  const handleMetarSource = (source: ConfigMetarSource) => {
    restartAcars(() => setMetarSource(source));
  };

  const handleTafSource = (source: ConfigTafSource) => {
    setTafSource(source);
  };

  return (
    <SettingsPage name={t('Settings.AtsuAoc.Title')}>
      <SettingItem name={t('Settings.AtsuAoc.HoppieProvider')}>
        <div className="flex items-center">
          {acarsProvider !== 'NONE' && (
            <span className="mr-6 flex items-center">
              {acarsState ? t('Settings.AtsuAoc.AcarsConnected') : t('Settings.AtsuAoc.WaitingForConnection')}
              <span
                className={`ml-2 inline-block h-4 w-4 rounded-full ${acarsState ? 'bg-green-600' : 'bg-orange-600'}`}
              />
            </span>
          )}
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
        </div>
      </SettingItem>
      {(acarsProvider === 'HOPPIE' || acarsProvider === 'SAI') && (
        <SettingItem name={acarsProvider === 'SAI' ? 'SAI API Key' : t('Settings.AtsuAoc.HoppieUserId')}>
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
      <SettingItem name={t('Settings.AtsuAoc.AtisAtcSource')}>
        <SelectGroup>
          {atisSourceButtons
            .filter((button) => !isUnavailableAcarsWeatherSource(button.setting))
            .map((button) => (
              <SelectItem
                key={button.setting}
                onSelect={() => handleAtisSource(button.setting)}
                selected={atisSource === button.setting}
              >
                {button.name}
              </SelectItem>
            ))}
        </SelectGroup>
      </SettingItem>
      <SettingItem name={t('Settings.AtsuAoc.MetarSource')}>
        <SelectGroup>
          {metarSourceButtons
            .filter((button) => !isUnavailableAcarsWeatherSource(button.setting))
            .map((button) => (
              <SelectItem
                key={button.setting}
                onSelect={() => handleMetarSource(button.setting)}
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
              onSelect={() => handleTafSource(button.setting)}
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
    </SettingsPage>
  );
};
