// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { NavigraphSubscriptionStatus, usePersistentNumberProperty, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { Route, Switch, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { FullscreenSettingsPage, SettingItem, SettingsPage } from '../Settings';
import { t } from '../../translation';
import { NavigraphAuthUIWrapper, useNavigraphAuthInfo } from '../../Apis/Navigraph/Components/Authentication';
import { useNavigraph } from '../../Apis/Navigraph/Navigraph';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';

export const ThirdPartyOptionsPage = () => {
    const history = useHistory();
    const navigraph = useNavigraph();
    const navigraphAuthInfo = useNavigraphAuthInfo();

    const [gsxFuelSyncEnabled, setGsxFuelSyncEnabled] = usePersistentNumberProperty('GSX_FUEL_SYNC', 0);
    const [gsxPayloadSyncEnabled, setGsxPayloadSyncEnabled] = usePersistentNumberProperty('GSX_PAYLOAD_SYNC', 0);
    const [, setWheelChocksEnabled] = usePersistentNumberProperty('MODEL_WHEELCHOCKS_ENABLED', 1);
    const [, setConesEnabled] = usePersistentNumberProperty('MODEL_CONES_ENABLED', 1);

    useEffect(() => {
        if (gsxFuelSyncEnabled === 1 || gsxPayloadSyncEnabled === 1) {
            setWheelChocksEnabled(0);
            setConesEnabled(0);
        }
    }, [gsxFuelSyncEnabled, gsxPayloadSyncEnabled]);

    const [overrideSimbriefUserID, setOverrideSimbriefUserID] = usePersistentProperty('CONFIG_OVERRIDE_SIMBRIEF_USERID');
    const [overrideSimbriefDisplay, setOverrideSimbriefDisplay] = useState(overrideSimbriefUserID);

    const getSimbriefUserData = async (value: string): Promise<any> => {
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

        const response = await fetch(apiUrl);

        // 400 status means request was invalid, probably invalid username so preserve to display error properly
        if (!response.ok && response.status !== 400) {
            throw new Error(`Error when making fetch request to SimBrief API. Response status code: ${response.status}`);
        }

        return response.json();
    };

    const getSimbriefUserId = (value: string): Promise<any> => new Promise((resolve, reject) => {
        if (!value) {
            reject(new Error('No SimBrief username/pilot ID provided'));
        }
        getSimbriefUserData(value)
            .then((data) => {
                if (data.fetch.status === 'Error: Unknown UserID') {
                    reject(new Error('Error: Unknown UserID'));
                }
                resolve((data.fetch as { userid: any }).userid);
            })
            .catch((_error) => {
                reject(_error);
            });
    });

    const handleUsernameInput = (value: string) => {
        getSimbriefUserId(value).then((response) => {
            toast.success(`${t('Settings.AtsuAoc.YourSimBriefPilotIdHasBeenValidatedAndUpdatedTo')} ${response}`);

            setOverrideSimbriefUserID(response);
            setOverrideSimbriefDisplay(response);
        }).catch(() => {
            setOverrideSimbriefDisplay(overrideSimbriefUserID);
            toast.error(t('Settings.AtsuAoc.PleaseCheckThatYouHaveCorrectlyEnteredYourSimbBriefUsernameOrPilotId'));
        });
    };

    const handleNavigraphAccountSuccessfulLink = () => {
        history.push('/settings/3rd-party-options');
    };

    const handleNavigraphAccountUnlink = () => {
        navigraph.deAuthenticate();
    };

    return (
        <Switch>
            <Route exact path="/settings/3rd-party-options/navigraph-login">
                <FullscreenSettingsPage name={t('Settings.ThirdPartyOptions.NavigraphAccountLink.LoginPage.Title')}>
                    <NavigraphAuthUIWrapper showLogin onSuccessfulLogin={handleNavigraphAccountSuccessfulLink} />
                </FullscreenSettingsPage>
            </Route>

            <Route exact path="/settings/3rd-party-options">
                <SettingsPage name={t('Settings.ThirdPartyOptions.Title')}>
                    <SettingItem name={t('Settings.ThirdPartyOptions.NavigraphAccountLink.SettingTitle')}>
                        {navigraphAuthInfo.loggedIn ? (
                            <>
                                <span className="py-2.5 pr-4">
                                    {navigraphAuthInfo.username}
                                    {' - '}
                                    {t(`Settings.ThirdPartyOptions.NavigraphAccountLink.SubscriptionStatus.${NavigraphSubscriptionStatus[navigraphAuthInfo.subscriptionStatus]}`)}
                                </span>

                                <button
                                    type="button"
                                    className="py-2.5 px-5 text-theme-text hover:text-red-600 bg-red-600
                                       hover:bg-theme-body rounded-md border-2 border-red-600 transition duration-100"
                                    onClick={handleNavigraphAccountUnlink}
                                >
                                    {t('Settings.ThirdPartyOptions.NavigraphAccountLink.Unlink')}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="py-2.5 px-5 text-theme-body hover:text-theme-highlight bg-theme-highlight
                                       hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                                onClick={() => history.push('/settings/3rd-party-options/navigraph-login')}
                            >
                                {t('Settings.ThirdPartyOptions.NavigraphAccountLink.Link')}
                            </button>
                        )}
                    </SettingItem>

                    <TooltipWrapper text={t('Settings.ThirdPartyOptions.TT.OverrideSimBriefUserID')}>
                        <SettingItem name={t('Settings.ThirdPartyOptions.OverrideSimBriefUserID')}>
                            <SimpleInput
                                className="text-center w-30"
                                value={overrideSimbriefDisplay}
                                onBlur={(value) => handleUsernameInput(value.replace(/\s/g, ''))}
                                onChange={(value) => setOverrideSimbriefDisplay(value)}
                            />
                        </SettingItem>
                    </TooltipWrapper>

                    <SettingItem name={t('Settings.ThirdPartyOptions.GsxFuelEnabled')}>
                        <Toggle
                            value={gsxFuelSyncEnabled === 1}
                            onToggle={(value) => {
                                setGsxFuelSyncEnabled(value ? 1 : 0);
                            }}
                        />
                    </SettingItem>

                    <SettingItem name={t('Settings.ThirdPartyOptions.GsxPayloadEnabled')}>
                        <Toggle
                            value={gsxPayloadSyncEnabled === 1}
                            onToggle={(value) => {
                                setGsxPayloadSyncEnabled(value ? 1 : 0);
                            }}
                        />
                    </SettingItem>
                </SettingsPage>
            </Route>
        </Switch>
    );
};
