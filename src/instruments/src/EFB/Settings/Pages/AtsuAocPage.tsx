import React, { useState } from 'react';

import { usePersistentProperty } from '@instruments/common/persistence';

import { PopUp } from '@shared/popup';
import { HttpError } from '@flybywiresim/api-client';
import { toast } from 'react-toastify';
import { Toggle } from '../../Components/Form/Toggle';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';
import { SimpleInput } from '../../Components/Form/SimpleInput/SimpleInput';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';

export const AtsuAocPage = () => {
    const [atisSource, setAtisSource] = usePersistentProperty('CONFIG_ATIS_SRC', 'FAA');
    const [metarSource, setMetarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');
    const [tafSource, setTafSource] = usePersistentProperty('CONFIG_TAF_SRC', 'NOAA');
    const [telexEnabled, setTelexEnabled] = usePersistentProperty('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED');

    const [simbriefUserId, setSimbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');
    const [simbriefDisplay, setSimbriefDisplay] = useState(simbriefUserId);

    const [autoSimbriefImport, setAutoSimbriefImport] = usePersistentProperty('CONFIG_AUTO_SIMBRIEF_IMPORT', 'DISABLED');

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
                    throw new HttpError(response.status);
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

    function handleTelexToggle(toggleValue: boolean): void {
        if (toggleValue) {
            new PopUp().showPopUp(
                'TELEX WARNING',
                // eslint-disable-next-line max-len
                'Telex enables free text and live map. If enabled, aircraft position data is published for the duration of the flight. Messages are public and not moderated. USE AT YOUR OWN RISK. To learn more about telex and the features it enables, please go to https://docs.flybywiresim.com/telex. Would you like to enable telex?',
                'small',
                () => setTelexEnabled('ENABLED'),
                () => {},
            );
        } else {
            setTelexEnabled('DISABLED');
        }
    }

    return (
        <SettingsPage name="ATSU / AOC">
            <SettingItem name="ATIS/ATC Source">
                <SelectGroup>
                    {atisSourceButtons.map((button) => (
                        <SelectItem
                            enabled
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
                            enabled
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
                            enabled
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
                    noLabel
                    onBlur={(value) => handleUsernameInput(value.replace(/\s/g, ''))}
                    onChange={(value) => setSimbriefDisplay(value)}
                />
            </SettingItem>

            <SettingItem name="Automatically Import SimBrief Data">
                <Toggle value={autoSimbriefImport === 'ENABLED'} onToggle={(toggleValue) => setAutoSimbriefImport(toggleValue ? 'ENABLED' : 'DISABLED')} />
            </SettingItem>
        </SettingsPage>
    );
};
