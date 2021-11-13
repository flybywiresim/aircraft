import React, { FC, useEffect, useRef, useState } from 'react';

import { Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';


import { AircraftOptionsPinProgramsPage } from './Pages/AircraftOptionsPinProgramsPage';
import { SimOptionsPage } from './Pages/SimOptionsPage';
import { AtsuAocPage } from './Pages/AtsuAocPage';
import { AudioPage } from './Pages/AudioPage';
import { FlyPadPage } from './Pages/FlyPadPage';
import { ArrowLeft, ChevronRight } from 'react-bootstrap-icons';

export type ButtonType = {
    name: string,
    setting: string,
}

interface PageLink {
    name: string,
    component: JSX.Element,
}

type SelectionTabsProps = {
    tabs: PageLink[],
}

export const SelectionTabs = ({ tabs }: SelectionTabsProps) => (
    <div className="space-y-6">
        {
            tabs.map((tab) => (
                <Link
                    to={`settings/${tab.name.toLowerCase().replace(/\s/g, '-')}`}
                    className="flex justify-between items-center p-6 rounded-md hover:shadow-lg transition duration-100 bg-theme-secondary"
                >
                    <p className="text-2xl">{tab.name}</p>
                    <ChevronRight size={30} />
                </Link>
            ))
        }
    </div>
);

export const Settings = () => {
    const tabs: PageLink[] = [
        { name: 'Aircraft Options / Pin Programs', component: <AircraftOptionsPinProgramsPage /> },
        { name: 'Sim Options', component: <SimOptionsPage /> },
        { name: 'ATSU / AOC', component: <AtsuAocPage /> },
        { name: 'Audio', component: <AudioPage /> },
        { name: 'flyPad', component: <FlyPadPage /> },
    ];

    return (
            <div className="w-full h-efb">
                <Switch>
                    <Route exact path="/settings">
                        <h1 className="mb-4">Settings</h1>
                        <SelectionTabs tabs={tabs} />
                    </Route>
                    {tabs.map((tab) => (
                        <Route path={`/settings/${tab.name.toLowerCase().replace(/\s/g, '-')}`}>
                                {tab.component}
                        </Route>
                    ))}
                </Switch>
            </div>
    );
};

type SettingsPageProps = {
    name: string,
}

export const SettingsPage: FC<SettingsPageProps> = ({name, children}) => {
    const [contentOverflows, setContentOverflows] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const position = useRef({ top: 0, y: 0 });

    const dynamicRegistrationButtons: ButtonType[] = [
        { name: 'Disabled', setting: '0' },
        { name: 'Enabled', setting: '1' },
    ];

    useEffect(() => {
        if (contentRef.current) {
            if(contentRef.current.clientHeight > 53 * parseFloat(getComputedStyle(document.documentElement).fontSize)) {
                setContentOverflows(true);
            }
        }
    }, [])

    function handleMouseDown(event: React.MouseEvent) {
        position.current.top = containerRef.current ? containerRef.current.scrollTop : 0;
        position.current.y = event.clientY;

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    function mouseMoveHandler(event: MouseEvent) {
        const dy = event.clientY - position.current.y;
        if (containerRef.current) {
            containerRef.current.scrollTop = position.current.top - dy;
        }
    };

    function mouseUpHandler() {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    return (
        <div>
            <Link to="/settings" className='inline-block mb-4'>
                <div className='flex flex-row items-center space-x-3 hover:text-theme-highlight transition duration-100'>
                    <ArrowLeft size={30} />
                    <h1 className="text-current">Settings - {name}</h1>
                </div>
            </Link>
            <div className="px-6 py-2 w-full rounded-lg border-2 shadow-md h-efb border-theme-accent">
                {/* TODO: replace with JIT value */}
                <div
                className={`w-full ${contentOverflows && 'overflow-y-scroll'} scrollbar`}
                style={{ height: '53rem' }}
                 ref={containerRef}
                  onMouseDown={handleMouseDown}>
                    <div className={`divide-y-2 divide-theme-accent ${contentOverflows && 'mr-6'}`} ref={contentRef}>
                        {children}
                    </div>

                    <div className="py-4 flex flex-row justify-between items-center">
                        <span className="text-lg text-gray-300 mr-1">Default Baro</span>
                        <SelectGroup>
                            {defaultBaroButtons.map((button) => (
                                <SelectItem
                                    enabled
                                    onSelect={() => setDefaultBaro(button.setting)}
                                    selected={defaultBaro === button.setting}
                                >
                                    {button.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </div>
                    <div className="py-4 flex flex-row justify-between items-center">
                        <span>
                            <span className="text-lg text-gray-300">MCDU Keyboard Input</span>
                            <span className="text-lg text-gray-500 ml-2">(unrealistic)</span>
                        </span>
                        <Toggle value={mcduInput === 'ENABLED'} onToggle={(value) => setMcduInput(value ? 'ENABLED' : 'DISABLED')} />
                    </div>
                    <div className="py-4 flex flex-row justify-between items-center">
                        <span>
                            <span className="text-lg text-gray-300">MCDU Focus Timeout (s)</span>
                        </span>
                        <SimpleInput
                            className="w-30 ml-1.5 px-5 py-1.5 text-lg text-gray-300 rounded-lg bg-navy-light
                            border-2 border-navy-light focus-within:outline-none focus-within:border-teal-light-contrast text-center disabled"
                            value={mcduTimeout}
                            noLabel
                            min={5}
                            max={120}
                            disabled={(mcduInput !== 'ENABLED')}
                            onChange={(event) => {
                                if (!Number.isNaN(event) && parseInt(event) >= 5 && parseInt(event) <= 120) {
                                    setMcduTimeout(event.trim());
                                }
                            }}
                        />
                    </div>
                </div>
                <ControlSettings setShowSettings={setShowThrottleSettings} />
            </>
        )}
            <ThrottleConfig isShown={showThrottleSettings} onClose={() => setShowThrottleSettings(false)} />
        </div>
    );
};

const ATSUAOCPage = () => {
    const [atisSource, setAtisSource] = usePersistentProperty('CONFIG_ATIS_SRC', 'FAA');
    const [metarSource, setMetarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');
    const [tafSource, setTafSource] = usePersistentProperty('CONFIG_TAF_SRC', 'NOAA');
    const [telexEnabled, setTelexEnabled] = usePersistentProperty('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED');

    const [simbriefError, setSimbriefError] = useState(false);
    const { simbriefUserId, setSimbriefUserId } = useContext(SimbriefUserIdContext);
    const [simbriefDisplay, setSimbriefDisplay] = useState(simbriefUserId);

    function getSimbriefUserData(value: string): Promise<any> {
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
    }

    function getSimbriefUserId(value: string):Promise<any> {
        return new Promise((resolve, reject) => {
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
    }

    function handleUsernameInput(value: string) {
        getSimbriefUserId(value).then((response) => {
            setSimbriefUserId(response);
            setSimbriefDisplay(response);
        }).catch(() => {
            setSimbriefError(true);
            setSimbriefDisplay(simbriefUserId);
            setTimeout(() => {
                setSimbriefError(false);
            }, 4000);
        });
    }

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

    function handleTelexToggle(toggleValue: boolean) {
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
        <div className="bg-navy-lighter rounded-xl px-6 divide-y divide-gray-700 flex flex-col">
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">ATIS/ATC Source</span>
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
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">METAR Source</span>
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
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">TAF Source</span>
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
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">TELEX</span>
                <Toggle value={telexEnabled === 'ENABLED'} onToggle={(toggleValue) => handleTelexToggle(toggleValue)} />
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">
                    SimBrief Username/Pilot ID
                    <span className={`${!simbriefError && 'hidden'} text-red-600`}>
                        <span className="text-white"> | </span>
                        SimBrief Error
                    </span>
                </span>
                <div className="flex flex-row items-center">
                    <SimpleInput
                        className="w-30"
                        value={simbriefDisplay}
                        noLabel
                        onBlur={(value) => handleUsernameInput(value.replace(/\s/g, ''))}
                        onChange={(value) => setSimbriefDisplay(value)}
                    />
                </div>
            </div>
        </div>
    );
}

type SettingItemProps = {
    name: string,
    unrealistic?: boolean,
}

export const SettingItem: FC<SettingItemProps> = ({name, unrealistic, children}) => (
    <div className="flex flex-row items-center justify-between py-4">
        <p>
            {name}
            {unrealistic && <span className="ml-2 text-theme-highlight"> (Unrealistic)</span>}
        </p>

        {children}
    </div>
)
