import React, { useContext, useState, useEffect } from 'react';
import { Slider, Toggle } from '@flybywiresim/react-components';
import { useSimVar } from '@instruments/common/simVars';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons';
import { SelectGroup, SelectItem } from '../Components/Form/Select';
import { usePersistentNumberProperty, usePersistentProperty } from '../../Common/persistence';
import Button from '../Components/Button/Button';
import ThrottleConfig from './ThrottleConfig/ThrottleConfig';
import SimpleInput from '../Components/Form/SimpleInput/SimpleInput';
import { Navbar } from '../Components/Navbar';

type ButtonType = {
    name: string,
    setting: string,
}

type AdirsButton = {
    simVarValue: number,
}

const ControlSettings = ({ setShowSettings }) => (
    <div className="bg-navy-lighter divide-y my-4 divide-gray-700 flex flex-col rounded-xl p-6 shadow-lg">
        <div className="flex flex-row justify-between items-center">
            <span className="text-lg text-gray-300">Detents</span>
            <Button className="bg-teal-light-contrast border-teal-light-contrast" text="Calibrate" onClick={() => setShowSettings(true)} />
        </div>
    </div>
);

const DefaultsPage = () => {
    const [thrustReductionHeight, setThrustReductionHeight] = usePersistentProperty('CONFIG_THR_RED_ALT', '1500');
    const [thrustReductionHeightSetting, setThrustReductionHeightSetting] = useState(thrustReductionHeight);
    const [accelerationHeight, setAccelerationHeight] = usePersistentProperty('CONFIG_ACCEL_ALT', '1500');
    const [accelerationHeightSetting, setAccelerationHeightSetting] = useState(accelerationHeight);
    const [accelerationOutHeight, setAccelerationOutHeight] = usePersistentProperty('CONFIG_ENG_OUT_ACCEL_ALT', '1500');
    const [accelerationOutHeightSetting, setAccelerationOutHeightSetting] = useState(accelerationOutHeight);

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

    return (
        <div className="bg-navy-lighter rounded-xl px-6 shadow-lg divide-y divide-gray-700 flex flex-col">

            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Thrust Reduction Height (ft)</span>
                <div className="flex flex-row">
                    <SimpleInput
                        className="w-30 ml-1.5 px-5 py-1.5 text-lg text-gray-300 rounded-lg bg-navy-light
                            border-2 border-navy-light focus-within:outline-none focus-within:border-teal-light-contrast text-center"
                        placeholder={thrustReductionHeight}
                        noLabel
                        value={thrustReductionHeightSetting}
                        onChange={(event) => handleSetThrustReductionAlt(event)}
                    />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Acceleration Height (ft)</span>
                <div className="flex flex-row">
                    <SimpleInput
                        className="w-30 ml-1.5 px-5 py-1.5 text-lg text-gray-300 rounded-lg bg-navy-light
                            border-2 border-navy-light focus-within:outline-none focus-within:border-teal-light-contrast text-center"
                        placeholder={accelerationHeight}
                        noLabel
                        value={accelerationHeightSetting}
                        onChange={(event) => handleSetAccelerationAlt(event)}
                    />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Engine-Out Acceleration Height (ft)</span>
                <div className="flex flex-row">
                    <SimpleInput
                        className="w-30 ml-1.5 px-5 py-1.5 text-lg text-gray-300 rounded-lg bg-navy-light
                            border-2 border-navy-light focus-within:outline-none focus-within:border-teal-light-contrast text-center"
                        placeholder={accelerationOutHeight}
                        noLabel
                        value={accelerationOutHeightSetting}
                        onChange={(event) => handleSetAccelerationOutAlt(event)}
                    />
                </div>
            </div>
        </div>
    );
};

const AircraftConfigurationPage = () => {
    const [weightUnit, setWeightUnit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const [paxSigns, setPaxSigns] = usePersistentProperty('CONFIG_USING_PORTABLE_DEVICES', '0');

    const paxSignsButtons: ButtonType[] = [
        { name: 'No Smoking', setting: '0' },
        { name: 'No Portable Device', setting: '1' },
    ];

    const weightUnitButtons: ButtonType[] = [
        { name: 'kg', setting: '1' },
        { name: 'lbs', setting: '0' },
    ];

    return (
        <div className="bg-navy-lighter rounded-xl px-6 shadow-lg divide-y divide-gray-700 flex flex-col">
            <div className="py-4 flex-grow flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300 mr-1">Weight Unit</span>
                <SelectGroup>
                    {weightUnitButtons.map((button) => (
                        <SelectItem
                            enabled
                            onSelect={() => setWeightUnit(button.setting)}
                            selected={weightUnit === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </div>

            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">PAX Signs</span>
                <SelectGroup>
                    {paxSignsButtons.map((button) => (
                        <SelectItem
                            enabled
                            onSelect={() => setPaxSigns(button.setting)}
                            selected={paxSigns === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </div>
        </div>
    );
};

const SimOptionsPage = () => {
    const [showThrottleSettings, setShowThrottleSettings] = useState(false);
    const { setShowNavbar } = useContext(SettingsNavbarContext);

    const [adirsAlignTime, setAdirsAlignTime] = usePersistentProperty('CONFIG_ALIGN_TIME', 'REAL');
    const [, setAdirsAlignTimeSimVar] = useSimVar('L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME', 'Enum', Number.MAX_SAFE_INTEGER);
    const [dmcSelfTestTime, setDmcSelfTestTime] = usePersistentProperty('CONFIG_SELF_TEST_TIME', '12');

    const [defaultBaro, setDefaultBaro] = usePersistentProperty('CONFIG_INIT_BARO_UNIT', 'AUTO');

    const adirsAlignTimeButtons: (ButtonType & AdirsButton)[] = [
        { name: 'Instant', setting: 'INSTANT', simVarValue: 1 },
        { name: 'Fast', setting: 'FAST', simVarValue: 2 },
        { name: 'Real', setting: 'REAL', simVarValue: 0 },
    ];

    const dmcSelfTestTimeButtons: ButtonType[] = [
        { name: 'Instant', setting: '0' },
        { name: 'Fast', setting: '5' },
        { name: 'Real', setting: '12' },
    ];

    const defaultBaroButtons: ButtonType[] = [
        { name: 'Auto', setting: 'AUTO' },
        { name: 'in Hg', setting: 'IN HG' },
        { name: 'hPa', setting: 'HPA' },
    ];

    useEffect(() => {
        setShowNavbar(!showThrottleSettings);
    }, [showThrottleSettings]);

    return (
        <div>
            {!showThrottleSettings
        && (
            <>
                <div className="bg-navy-lighter rounded-xl px-6 shadow-lg divide-y divide-gray-700 flex flex-col">
                    <div className="py-4 flex flex-row justify-between items-center">
                        <span className="text-lg text-gray-300">ADIRS Align Time</span>
                        <SelectGroup>
                            {adirsAlignTimeButtons.map((button) => (
                                <SelectItem
                                    enabled
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
                    </div>

                    <div className="py-4 flex flex-row justify-between items-center">
                        <span className="text-lg text-gray-300">DMC Self Test Time</span>
                        <SelectGroup>
                            {dmcSelfTestTimeButtons.map((button) => (
                                <SelectItem
                                    enabled
                                    onSelect={() => setDmcSelfTestTime(button.setting)}
                                    selected={dmcSelfTestTime === button.setting}
                                >
                                    {button.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
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
                </div>
                <ControlSettings setShowSettings={setShowThrottleSettings} />
            </>
        )}
            <ThrottleConfig isShown={showThrottleSettings} onClose={() => setShowThrottleSettings(false)} />
        </div>
    );
};

const ATSUAOCPage = (props: {simbriefUsername, setSimbriefUsername}) => {
    const [atisSource, setAtisSource] = usePersistentProperty('CONFIG_ATIS_SRC', 'FAA');
    const [metarSource, setMetarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');
    const [tafSource, setTafSource] = usePersistentProperty('CONFIG_TAF_SRC', 'NOAA');

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
                <span className="text-lg text-gray-300">Simbrief Username</span>
                <div className="flex flex-row items-center">
                    <SimpleInput
                        className="w-30"
                        value={props.simbriefUsername}
                        noLabel
                        onChange={(event) => props.setSimbriefUsername(event)}
                    />
                </div>
            </div>
        </div>
    );
};

const AudioPage = () => {
    const [ptuAudible, setPtuAudible] = usePersistentNumberProperty('SOUND_PTU_AUDIBLE_COCKPIT', 0);
    const [exteriorVolume, setExteriorVolume] = usePersistentNumberProperty('SOUND_EXTERIOR_MASTER', 0);
    const [engineVolume, setEngineVolume] = usePersistentNumberProperty('SOUND_INTERIOR_ENGINE', 0);
    const [windVolume, setWindVolume] = usePersistentNumberProperty('SOUND_INTERIOR_WIND', 0);

    return (
        <div className="bg-navy-lighter divide-y divide-gray-700 flex flex-col rounded-xl px-6 ">
            <div className="py-8 flex flex-row justify-between items-center">
                <span>
                    <span className="text-lg text-gray-300">PTU Audible in Cockpit</span>
                    <span className="text-lg text-gray-500 ml-2">(unrealistic)</span>
                </span>
                <Toggle value={!!ptuAudible} onToggle={(value) => setPtuAudible(value ? 1 : 0)} />
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Exterior Master Volume</span>
                <div className="flex flex-row items-center py-1.5">
                    <span className="text-base pr-3">{exteriorVolume}</span>
                    <Slider className="w-60" value={exteriorVolume + 50} onInput={(value) => setExteriorVolume(value - 50)} />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Engine Interior Volume</span>
                <div className="flex flex-row items-center py-1.5">
                    <span className="text-base pr-3">{engineVolume}</span>
                    <Slider className="w-60" value={engineVolume + 50} onInput={(value) => setEngineVolume(value - 50)} />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Wind Interior Volume</span>
                <div className="flex flex-row items-center py-1.5">
                    <span className="text-base pr-3">{windVolume}</span>
                    <Slider className="w-60" value={windVolume + 50} onInput={(value) => setWindVolume(value - 50)} />
                </div>
            </div>
        </div>
    );
};

const FlyPadPage = () => {
    const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
    const [usingAutobrightness, setUsingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);

    return (
        <div className="bg-navy-lighter rounded-xl px-6 shadow-lg divide-y divide-gray-700 flex flex-col">
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Brightness</span>
                <div className={`flex flex-row items-center py-1.5 ${usingAutobrightness && 'pointer-events-none filter saturate-0'}`}>
                    <Slider className="w-60" value={usingAutobrightness ? brightness : brightnessSetting} onInput={(value) => setBrightnessSetting(value)} />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Auto Brightness</span>
                <div className="flex flex-row items-center py-1.5">
                    <Toggle value={!!usingAutobrightness} onToggle={(value) => setUsingAutobrightness(value ? 1 : 0)} />
                </div>
            </div>
        </div>
    );
};

interface SettingsNavbarContextInterface {
    showNavbar: boolean,
    setShowNavbar: (newValue: boolean) => void
}

const SettingsNavbarContext = React.createContext<SettingsNavbarContextInterface>(undefined as any);

const Settings = (props: {simbriefUsername, setSimbriefUsername}) => {
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const [subPageIndex, setSubPageIndex] = useState(0);
    const [showNavbar, setShowNavbar] = useState(true);

    function currentPage(): JSX.Element[] {
        switch (selectedTabIndex) {
        case 0: return [<DefaultsPage />];
        case 1: return [<AircraftConfigurationPage />];
        case 2: return [<SimOptionsPage />];
        case 3: return [<ATSUAOCPage simbriefUsername={props.simbriefUsername} setSimbriefUsername={props.setSimbriefUsername} />];
        case 4: return [<AudioPage />];
        case 5: return [<FlyPadPage />];
        default: return [<AircraftConfigurationPage />];
        }
    }

    return (
        <SettingsNavbarContext.Provider value={{ showNavbar, setShowNavbar }}>
            <div className="w-full">
                <div className={`flex flex-row flex-wrap items-center space-x-10 mb-2 ${!showNavbar && 'hidden'}`}>
                    <Navbar
                        tabs={[
                            'Defaults',
                            'Aircraft Configuration',
                            'Sim Options',
                            'ATSU/AOC',
                            'Audio',
                            'flyPad',
                        ]}
                        onSelected={(indexNumber) => {
                            setSelectedTabIndex(indexNumber);
                            setSubPageIndex(0);
                        }}
                    />
                </div>
                {currentPage()[subPageIndex]}
                <div className={`mx-auto w-min mb-4 flex flex-row space-x-10 items-center justify-center mt-5 align-baseline ${!showNavbar && 'hidden'}`}>
                    <div
                        className={`p-3 rounded-full duration-200
                            ${subPageIndex === 0 ? 'bg-navy-lighter text-gray-700' : 'bg-teal-light-contrast hover:bg-white hover:text-teal-light-contrast text-white'}`}
                        onClick={() => {
                            if (subPageIndex > 0) {
                                setSubPageIndex(subPageIndex - 1);
                            }
                        }}
                    >
                        <IconArrowLeft size={32} className="text-current" />
                    </div>
                    <div
                        className={`p-3 rounded-full duration-200
                            ${subPageIndex === currentPage().length - 1 ? 'bg-navy-lighter text-gray-700' : 'bg-teal-light-contrast hover:bg-white hover:text-teal-light-contrast text-white'}`}
                        onClick={() => {
                            if (subPageIndex < currentPage().length - 1) {
                                setSubPageIndex(subPageIndex + 1);
                            }
                        }}
                    >
                        <IconArrowRight size={32} className="text-current" />
                    </div>
                </div>
            </div>
        </SettingsNavbarContext.Provider>
    );
};

export default Settings;
