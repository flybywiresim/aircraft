/* eslint-disable max-len */
import React, { useState } from 'react';

import { usePersistentProperty } from '@instruments/common/persistence';

import { Hoppie } from '@flybywiresim/api-client';
import { toast } from 'react-toastify';
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
            toast.success(`Your SimBrief PilotID has been validated and updated to ${response}`);

            setSimbriefUserId(response);
            setSimbriefDisplay(response);
        }).catch(() => {
            setSimbriefDisplay(simbriefUserId);
            toast.error('Please check that you have correctly entered your SimBrief username or pilot ID.');
        });
    };

    const getHoppieResponse = (value: string): Promise<any> => {
        const body = {
            logon: value,
            from: 'FBWA32NX',
            to: 'ALL-CALLSIGNS',
            type: 'ping',
            packet: '',
        };
        return Hoppie.sendRequest(body).then((resp) => resp.response);
    };

    const validateHoppieUserId = (value: string):Promise<any> => new Promise((resolve, reject) => {
        if (!value) {
            reject(new Error('No Hoppie user ID provided'));
        }
        getHoppieResponse(value)
            .then((response) => {
                if (response === 'error {illegal logon code}') {
                    reject(new Error(`Error: Unknown user ID: ${response}`));
                }
                resolve(value);
            })
            .catch((_error) => {
                reject(_error);
            });
    });

    const handleHoppieUsernameInput = (value: string) => {
        if (value !== '') {
            validateHoppieUserId(value).then((response) => {
                setHoppieUserId(response);
            }).catch(() => {
                toast.error('There was an error encountered when validating your Hoppie username.');
            });
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
                    title="TELEX Warning"
                    bodyText="TELEX enables free text and live map. If enabled, aircraft position data is published for the duration of the flight. Messages are public and not moderated. USE THIS FEATURE AT YOUR OWN RISK. To learn more about TELEX and the features it enables, please go to https://docs.flybywiresim.com/telex."
                    onConfirm={() => setTelexEnabled('ENABLED')}
                    confirmText="Enable TELEX"
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
                    title="Optional A32NX Error Reporting"
                    bodyText="You are able to opt into anonymous error reporting that will allow us to diagnose, monitor, and take care of issues at a faster rate. This feature is completely optional and we will never collect your personal data, but may allow you to more easily get support and have the issues you encounter fixed at a faster rate."
                    onConfirm={() => setSentryEnabled(SentryConsentState.Given)}
                    onCancel={() => setSentryEnabled(SentryConsentState.Refused)}
                    confirmText="Enable"
                />,
            );
        } else {
            setSentryEnabled(SentryConsentState.Refused);
        }
    };

    return (
        <SettingsPage name="ATSU / AOC">
            <SettingItem name="ATIS/ATC Source">
                <SelectGroup>
                    {atisSourceButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setAtisSource(button.setting)}
                            selected={atisSource === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name="METAR Source">
                <SelectGroup>
                    {metarSourceButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setMetarSource(button.setting)}
                            selected={metarSource === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name="TAF Source">
                <SelectGroup>
                    {tafSourceButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setTafSource(button.setting)}
                            selected={tafSource === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name="TELEX">
                <Toggle value={telexEnabled === 'ENABLED'} onToggle={(toggleValue) => handleTelexToggle(toggleValue)} />
            </SettingItem>

            <SettingItem name="SimBrief Username/Pilot ID">
                <SimpleInput
                    className="text-center w-30"
                    value={simbriefDisplay}
                    onBlur={(value) => handleUsernameInput(value.replace(/\s/g, ''))}
                    onChange={(value) => setSimbriefDisplay(value)}
                />
            </SettingItem>

            <SettingItem name="Automatically Import SimBrief Data">
                <Toggle value={autoSimbriefImport === 'ENABLED'} onToggle={(toggleValue) => setAutoSimbriefImport(toggleValue ? 'ENABLED' : 'DISABLED')} />
            </SettingItem>

            <SettingItem name="Hoppie User ID">
                <SimpleInput
                    className="w-30"
                    value={hoppieUserId}
                    onBlur={(value) => handleHoppieUsernameInput(value.replace(/\s/g, ''))}
                    onChange={(value) => setHoppieUserId(value)}
                />
            </SettingItem>

            <SettingItem name="Error Reporting">
                <Toggle value={sentryEnabled === SentryConsentState.Given} onToggle={(toggleValue) => handleSentryToggle(toggleValue)} />
            </SettingItem>
        </SettingsPage>
    );
};
