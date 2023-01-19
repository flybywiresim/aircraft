/* eslint-disable max-len */
import React, { useState } from 'react';

import { usePersistentProperty } from '@instruments/common/persistence';

import { Hoppie } from '@flybywiresim/api-client';
import { toast } from 'react-toastify';
import { HoppieConnector } from '@atsu/com/webinterfaces/HoppieConnector';
import { t } from '../../translation';
import { useModals, PromptModal } from '../../UtilComponents/Modals/Modals';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';
import {
    SENTRY_CONSENT_KEY,
    SentryConsentState,
} from '../../../../../sentry-client/src/FbwAircraftSentryClient';

export const AtsuAocPage = () => {
    const [atisSource, setAtisSource] = usePersistentProperty('CONFIG_ATIS_SRC', 'FAA');
    const [metarSource, setMetarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');
    const [tafSource, setTafSource] = usePersistentProperty('CONFIG_TAF_SRC', 'NOAA');
    const [telexEnabled, setTelexEnabled] = usePersistentProperty('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED');

    const [simbriefUserId, setSimbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');
    const [simbriefDisplay, setSimbriefDisplay] = useState(simbriefUserId);

    const [autoSimbriefImport, setAutoSimbriefImport] = usePersistentProperty('CONFIG_AUTO_SIMBRIEF_IMPORT', 'DISABLED');

    const [hoppieEnabled, setHoppieEnabled] = usePersistentProperty('CONFIG_HOPPIE_ENABLED', 'DISABLED');
    const [hoppieUserId, setHoppieUserId] = usePersistentProperty('CONFIG_HOPPIE_USERID');

    const [sentryEnabled, setSentryEnabled] = usePersistentProperty(SENTRY_CONSENT_KEY, SentryConsentState.Refused);

    const getSimbriefUserData = (value: string): Promise<any> => {
        const SIMBRIEF_URL = 'http://www.simbrief.com/api/xml.fetcher.php?json=1';

        if (!value) {
            throw new Error('No SimBrief username/pilot ID provided');
        }

        // The SimBrief API will try both username and pilot ID if either one
        // isn't valid, so request both if the input is plausibly a pilot ID.
        let apiUrl = `${SIMBRIEF_URL}&username=${value}`;
        if (/^\d{1,8}$/.test(value)) {
            apiUrl += `&userid=${value}`;
        }

        return fetch(apiUrl)
            .then((response) => {
                // 400 status means request was invalid, probably invalid username so preserve to display error properly
                if (!response.ok && response.status !== 400) {
                    throw new Error(`Error when making fetch request to SimBrief API. Response status code: ${response.status}`);
                }

                return response.json();
            });
    };

    const getSimbriefUserId = (value: string):Promise<any> => new Promise((resolve, reject) => {
        if (!value) {
            reject(new Error('No SimBrief username/pilot ID provided'));
        }
        getSimbriefUserData(value)
            .then((data) => {
                if (data.fetch.status === 'Error: Unknown UserID') {
                    reject(new Error('Error: Unknown UserID'));
                }
                resolve(data.fetch.userid);
            })
            .catch((_error) => {
                reject(_error);
            });
    });

    const handleUsernameInput = (value: string) => {
        getSimbriefUserId(value).then((response) => {
            toast.success(`${t('Settings.AtsuAoc.YourSimBriefPilotIdHasBeenValidatedAndUpdatedTo')} ${response}`);

            setSimbriefUserId(response);
            setSimbriefDisplay(response);
        }).catch(() => {
            setSimbriefDisplay(simbriefUserId);
            toast.error(t('Settings.AtsuAoc.PleaseCheckThatYouHaveCorrectlyEnteredYourSimbBriefUsernameOrPilotId'));
        });
    };

    const getHoppieResponse = (value: string): Promise<any> => new Promise((resolve, reject) => {
        if (!value || value === '') {
            resolve(value);
        }

        const body = {
            logon: value,
            from: 'FBWA32NX',
            to: 'ALL-CALLSIGNS',
            type: 'ping',
            packet: '',
        };
        return Hoppie.sendRequest(body).then((resp) => {
            if (resp.response === 'error {illegal logon code}') {
                reject(new Error(`Error: Unknown user ID: ${resp.response}`));
            } else {
                resolve(value);
            }
        });
    });

    const handleHoppieUsernameInput = (value: string) => {
        getHoppieResponse(value)
            .then((response) => {
                if (!value) {
                    toast.success(`${t('Settings.AtsuAoc.YourHoppieIdHasBeenRemoved')} ${response}`);
                    return;
                }
                toast.success(`${t('Settings.AtsuAoc.YourHoppieIdHasBeenValidated')} ${response}`);
            })
            .catch((_error) => {
                toast.error(t('Settings.AtsuAoc.ThereWasAnErrorEncounteredWhenValidatingYourHoppieID'));
            });
    };

    const handleHoppieEnabled = (toggleValue: boolean) => {
        if (toggleValue) {
            setHoppieEnabled('ENABLED');
            HoppieConnector.activateHoppie();
        } else {
            setHoppieEnabled('DISABLED');
            HoppieConnector.deactivateHoppie();
        }
    };

    const atisSourceButtons: ButtonType[] = [
        { name: 'FAA (US)', setting: 'FAA' },
        { name: 'PilotEdge', setting: 'PILOTEDGE' },
        { name: 'IVAO', setting: 'IVAO' },
        { name: 'VATSIM', setting: 'VATSIM' },
    ];

    const metarSourceButtons: ButtonType[] = [
        { name: 'MeteoBlue', setting: 'MSFS' },
        { name: 'PilotEdge', setting: 'PILOTEDGE' },
        { name: 'IVAO', setting: 'IVAO' },
        { name: 'VATSIM', setting: 'VATSIM' },
    ];

    const tafSourceButtons: ButtonType[] = [
        { name: 'IVAO', setting: 'IVAO' },
        { name: 'NOAA', setting: 'NOAA' },
    ];

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
            HoppieConnector.deactivateHoppie();
        }

        if (type === 'ATIS') {
            setAtisSource(source);
        } else if (type === 'METAR') {
            setMetarSource(source);
        } else if (type === 'TAF') {
            setTafSource(source);
        }

        if (type !== 'TAF') {
            HoppieConnector.activateHoppie();
        }
    }

    return (
        <SettingsPage name={t('Settings.AtsuAoc.Title')}>
            <SettingItem name={t('Settings.AtsuAoc.AtisAtcSource')}>
                <SelectGroup>
                    {atisSourceButtons.map((button) => (
                        <SelectItem
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
                            onSelect={() => handleWeatherSource(button.setting, 'TAF')}
                            selected={tafSource === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name={t('Settings.AtsuAoc.AutomaticallyImportSimBriefData')}>
                <Toggle value={autoSimbriefImport === 'ENABLED'} onToggle={(toggleValue) => setAutoSimbriefImport(toggleValue ? 'ENABLED' : 'DISABLED')} />
            </SettingItem>

            <SettingItem name={t('Settings.AtsuAoc.ErrorReporting')}>
                <Toggle value={sentryEnabled === SentryConsentState.Given} onToggle={(toggleValue) => handleSentryToggle(toggleValue)} />
            </SettingItem>

            <SettingItem name={t('Settings.AtsuAoc.Telex')}>
                <Toggle value={telexEnabled === 'ENABLED'} onToggle={(toggleValue) => handleTelexToggle(toggleValue)} />
            </SettingItem>

            <SettingItem name={t('Settings.AtsuAoc.HoppieEnabled')}>
                <Toggle value={hoppieEnabled === 'ENABLED'} onToggle={(toggleValue) => handleHoppieEnabled(toggleValue)} />
            </SettingItem>

            <SettingItem name={t('Settings.AtsuAoc.HoppieUserId')}>
                <SimpleInput
                    className="text-center w-30"
                    value={hoppieUserId}
                    onBlur={(value) => handleHoppieUsernameInput(value.replace(/\s/g, ''))}
                    onChange={(value) => setHoppieUserId(value)}
                />
            </SettingItem>

            <SettingItem name={t('Settings.AtsuAoc.SimBriefUsernamePilotId')}>
                <SimpleInput
                    className="text-center w-30"
                    value={simbriefDisplay}
                    onBlur={(value) => handleUsernameInput(value.replace(/\s/g, ''))}
                    onChange={(value) => setSimbriefDisplay(value)}
                />
            </SettingItem>
        </SettingsPage>
    );
};
