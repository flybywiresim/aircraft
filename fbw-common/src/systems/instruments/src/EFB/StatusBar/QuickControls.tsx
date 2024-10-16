// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC, forwardRef, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  BrightnessHigh,
  BrightnessHighFill,
  ChevronCompactDown,
  ChevronCompactUp,
  ClockHistory,
  Compass,
  Gear,
  Keyboard,
  MoonFill,
  PersonCheck,
  Power,
  Wifi,
  WifiOff,
} from 'react-bootstrap-icons';
import {
  usePersistentNumberProperty,
  usePersistentProperty,
  useSimVar,
  ClientState,
  SimBridgeClientState,
  usePersistentBooleanProperty,
  useGlobalVar,
} from '@flybywiresim/fbw-sdk';
import Slider from 'rc-slider';
import { useHistory } from 'react-router-dom';
import { useInterval } from '@flybywiresim/react-components';
import { t } from '../Localization/translation';
import { TooltipWrapper } from '../UtilComponents/TooltipWrapper';
import { PowerStates, usePower } from '../Efb';
import { PiAirplaneLandingFill } from 'react-icons/pi';
import { AircraftContext } from '@flybywiresim/flypad';

interface QuickSettingsButtonProps {
  onClick: () => void;
  className?: string;
}

const QuickSettingsButton: FC<QuickSettingsButtonProps> = forwardRef<HTMLButtonElement, QuickSettingsButtonProps>(
  ({ onClick, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`flex h-12 w-12 items-center justify-center rounded-full
                    bg-theme-body text-theme-text transition duration-100 hover:border-4 hover:border-theme-highlight
                    ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  ),
);

interface QuickSettingsToggleProps {
  onClick: () => void;
  icon: React.ReactElement;
  className?: string;
  width?: number;
}

const QuickSettingsToggle: FC<QuickSettingsToggleProps> = forwardRef<HTMLButtonElement, QuickSettingsToggleProps>(
  ({ onClick, icon, className, children, width, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-md
                   bg-theme-body text-theme-text transition duration-100 hover:border-4 hover:border-theme-highlight
                   ${className ?? ''}`}
      style={{ width: `${width ?? 130}px`, height: '100px' }}
      {...rest}
    >
      {icon}
      <div className="mt-1 flex flex-col items-center text-sm text-inherit">{children}</div>
    </button>
  ),
);

interface LargeQuickSettingsToggleProps {
  onClick: () => void;
  icon: React.ReactElement;
  className?: string;
  width?: number;
  infoBox?: React.ReactElement;
}

const LargeQuickSettingsToggle: FC<LargeQuickSettingsToggleProps> = forwardRef<
  HTMLButtonElement,
  LargeQuickSettingsToggleProps
>(({ onClick, icon, className, children, width, infoBox, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center
                   rounded-md border-2 border-transparent bg-theme-body text-theme-text transition duration-100 hover:border-current
                   ${className ?? ''}`}
    style={{ width: `${width ?? 275}px`, height: '100px' }}
    {...rest}
  >
    <div className="flex flex-row items-center justify-center">
      <div className="mr-5 flex flex-col items-center justify-center">
        {icon}
        <div className="mt-1 text-sm text-inherit">{children}</div>
      </div>
      <div className="flex flex-col items-center justify-center">{infoBox}</div>
    </div>
  </button>
));

interface LargeQuickSettingsIncrementerProps {
  onDownClick?: () => void;
  onUpClick?: () => void;
  icon: React.ReactElement;
  className?: string;
  width?: number;
  infoBox?: React.ReactElement;
}

const LargeQuickSettingsIncrementer: FC<LargeQuickSettingsIncrementerProps> = forwardRef<
  HTMLButtonElement,
  LargeQuickSettingsIncrementerProps
>(({ icon, className, children, width, infoBox, onDownClick, onUpClick, ...rest }, ref) => (
  <div
    className={`flex flex-col items-center justify-center
                   rounded-md bg-theme-body text-theme-text transition duration-100
                   ${className ?? ''}`}
    style={{ width: `${width ?? 275}px`, height: '100px' }}
    {...rest}
  >
    <div className="flex flex-row items-center justify-center">
      <button
        ref={ref}
        type="button"
        onClick={onDownClick}
        className={`mr-5 flex flex-col items-center
                        justify-center rounded-md border-2 border-transparent bg-theme-accent px-4 py-2 text-theme-text transition duration-100 hover:border-current
                        ${className ?? ''}`}
      >
        <ChevronCompactDown size={24} />
      </button>
      <div className="mr-5 flex flex-col items-center justify-center">
        {icon}
        <div className="mt-1 text-sm text-inherit">{children}</div>
      </div>
      <div className="flex flex-col items-center justify-center">{infoBox}</div>

      <button
        ref={ref}
        type="button"
        onClick={onUpClick}
        className={`ml-5 flex flex-col items-center justify-center
                        rounded-md border-2 border-transparent bg-theme-accent px-4 py-2 text-theme-text transition duration-100 hover:border-current
                        ${className ?? ''}`}
      >
        <ChevronCompactUp size={24} />
      </button>
    </div>
  </div>
));

export const QuickControlsPane = ({
  setShowQuickControlsPane,
}: {
  setShowQuickControlsPane: (value: boolean) => void;
}) => {
  const aircraftContext = useContext(AircraftContext);
  const history = useHistory();
  const power = usePower();

  const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
  const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
  const [usingAutobrightness, setUsingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);
  const [autoOSK, setAutoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);
  const [pauseAtTod, setPauseAtTod] = usePersistentBooleanProperty('PAUSE_AT_TOD', false);
  const [todArmed] = useSimVar('L:A32NX_PAUSE_AT_TOD_ARMED', 'bool', 500);

  const simRate = useGlobalVar('SIMULATION RATE', 'number', 500);

  const decreaseSimrate = useCallback(() => SimVar.SetSimVarValue('K:SIM_RATE_DECR', 'bool', true), []);
  const increaseSimrate = useCallback(() => SimVar.SetSimVarValue('K:SIM_RATE_INCR', 'bool', true), []);

  const [adirsAlignTimeSimVar, setAdirsAlignTimeSimVar] = useSimVar(
    'L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME',
    'Enum',
    Number.MAX_SAFE_INTEGER,
  );
  const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
  const [, setSimbridgeEnabled] = usePersistentProperty('CONFIG_SIMBRIDGE_ENABLED', 'AUTO ON');

  const [simBridgeClientState, setSimBridgeClientState] = useState<SimBridgeClientState>(
    ClientState.getInstance().getSimBridgeClientState(),
  );

  // To prevent keyboard input (esp. END key for external view) to change
  // the slider position. This is accomplished by a
  // onAfterChange={() => sliderRef.current.blur()}
  // in the Slider component props.
  const brightnessSliderRef = useRef<any>(null);

  const handleAutoBrightness = () => {
    setUsingAutobrightness(usingAutobrightness ? 0 : 1);
  };

  const handleSettings = () => {
    history.push('/settings/flypad');
  };

  const handleSleep = () => {
    history.push('/');
    power.setPowerState(PowerStates.STANDBY);
  };

  const handlePower = () => {
    history.push('/');
    loadedToOff();
  };

  const loadedToOff = () => {
    setShowQuickControlsPane(false);
    power.setPowerState(PowerStates.SHUTDOWN);
    setTimeout(() => {
      power.setPowerState(PowerStates.SHUTOFF);
    }, 1000);
  };

  const handleAlignADIRS = () => {
    const previousAlignTimeVar = adirsAlignTimeSimVar;
    setAdirsAlignTimeSimVar(1);
    setTimeout(() => {
      setAdirsAlignTimeSimVar(previousAlignTimeVar);
    }, 500);
  };

  const handleInstantBoarding = () => {
    const previousBoardingRate = boardingRate;
    setBoardingRate('INSTANT');
    setTimeout(() => {
      setBoardingRate(previousBoardingRate);
    }, 500);
  };

  const handleResetSimBridgeConnection = () => {
    if (
      simBridgeClientState === SimBridgeClientState.CONNECTED ||
      simBridgeClientState === SimBridgeClientState.CONNECTING
    ) {
      setSimbridgeEnabled('PERM OFF');
      return;
    }
    setSimbridgeEnabled('AUTO ON');
  };

  const handleToggleOsk = () => {
    setAutoOSK(autoOSK === 0 ? 1 : 0);
  };

  const handleTogglePauseAtTod = () => {
    setPauseAtTod(!pauseAtTod);
  };

  const simBridgeButtonStyle = useMemo<string>((): string => {
    switch (simBridgeClientState) {
      case SimBridgeClientState.CONNECTED:
        return 'bg-utility-green text-theme-body';
      case SimBridgeClientState.CONNECTING:
        return 'bg-utility-amber text-theme-body';
      case SimBridgeClientState.OFFLINE:
        return 'bg-utility-red text-theme-body';
      default:
        return '';
    }
  }, [simBridgeClientState]);

  const simBridgeButtonStateString = useMemo<string>((): string => {
    switch (simBridgeClientState) {
      case SimBridgeClientState.CONNECTED:
        return t('QuickControls.SimBridgeConnected');
      case SimBridgeClientState.CONNECTING:
        return t('QuickControls.SimBridgeConnecting');
      case SimBridgeClientState.OFFLINE:
        return t('QuickControls.SimBridgeOffline');
      default:
        return t('QuickControls.SimBridgeOff');
    }
  }, [simBridgeClientState]);

  const pauseAtTodStyle = useMemo<string>((): string => {
    if (pauseAtTod && todArmed) {
      return 'bg-utility-green';
    } else if (pauseAtTod) {
      return 'bg-utility-amber';
    }
  }, [pauseAtTod, todArmed]);

  const pauseAtTodString = useMemo<string>((): string => {
    if (pauseAtTod && todArmed) {
      return t('QuickControls.PauseAtTodArmed');
    } else if (pauseAtTod) {
      return t('QuickControls.PauseAtTodStandby');
    } else {
      return t('QuickControls.PauseAtTodInactive');
    }
  }, [pauseAtTod, todArmed]);

  const oskButtonStyle = useMemo<string>(
    (): string => (autoOSK ? 'bg-utility-green text-theme-body' : 'text-theme-text'),
    [autoOSK],
  );

  useInterval(() => {
    setSimBridgeClientState(ClientState.getInstance().getSimBridgeClientState());
  }, 200);

  return (
    <>
      <div
        className="absolute left-0 top-0 z-30 h-screen w-screen bg-theme-body opacity-70"
        onMouseDown={() => setShowQuickControlsPane(false)}
      />

      <div
        className="absolute z-40 rounded-md border border-theme-secondary bg-theme-accent p-6 transition duration-100"
        style={{ top: '40px', right: '50px', width: '620px' }}
      >
        <div className="mb-5 flex flex-row items-center justify-end">
          <span className="mr-auto">
            <TooltipWrapper text={t('QuickControls.TT.Settings')}>
              <QuickSettingsButton onClick={handleSettings}>
                <Gear size={24} />
              </QuickSettingsButton>
            </TooltipWrapper>
          </span>

          <TooltipWrapper text={t('QuickControls.TT.Sleep')}>
            <QuickSettingsButton onClick={handleSleep}>
              <MoonFill size={20} />
            </QuickSettingsButton>
          </TooltipWrapper>

          <TooltipWrapper text={t('QuickControls.TT.PowerButton')}>
            <QuickSettingsButton onClick={handlePower} className="ml-4">
              <Power size={24} />
            </QuickSettingsButton>
          </TooltipWrapper>
        </div>
        <div className="mb-8 flex flex-row items-center justify-between">
          <div className={`flex flex-row items-center ${usingAutobrightness && 'opacity-30'}`}>
            <TooltipWrapper text={t('QuickControls.TT.Brightness')}>
              <div className="mr-4 flex w-[80px] flex-row items-center text-theme-text">
                <BrightnessHighFill size={24} />
                <span className="pointer-events-none ml-2 text-inherit">
                  {`${usingAutobrightness ? brightness.toFixed(0) : brightnessSetting}%`}
                </span>
              </div>
              <div>
                <Slider
                  disabled={usingAutobrightness === 1}
                  ref={brightnessSliderRef}
                  value={usingAutobrightness ? brightness : brightnessSetting}
                  min={1}
                  max={100}
                  onChange={setBrightnessSetting}
                  onAfterChange={() => brightnessSliderRef.current && brightnessSliderRef.current.blur()}
                  className="rounded-md"
                  style={{ width: '380px', height: '50px', padding: '0' }}
                  trackStyle={{ backgroundColor: 'var(--color-highlight)', height: '50px' }}
                  railStyle={{ backgroundColor: 'var(--color-body)', height: '50px' }}
                  handleStyle={{ top: '13px', height: '0px', width: '0px' }}
                />
              </div>
            </TooltipWrapper>
          </div>
          <TooltipWrapper text={t('QuickControls.TT.AutoBrightness')}>
            <button
              type="button"
              onClick={handleAutoBrightness}
              className={`ml-4 flex items-center justify-center rounded-md
                                                    bg-theme-body text-theme-text transition duration-100
                                                    hover:border-4 hover:border-theme-highlight ${usingAutobrightness === 1 ? 'bg-utility-green text-theme-body' : ''}`}
              style={{ width: '80px', height: '50px' }}
            >
              <BrightnessHigh size={24} />
            </button>
          </TooltipWrapper>
        </div>
        {/* Quick Settings Button */}
        {/* First Row */}
        <div className="mb-5 flex flex-row items-center justify-between">
          <TooltipWrapper text={t('QuickControls.TT.AlignAdirs')}>
            <QuickSettingsToggle onClick={handleAlignADIRS} icon={<Compass size={42} />}>
              {t('QuickControls.AlignAdirs')}
            </QuickSettingsToggle>
          </TooltipWrapper>
          <TooltipWrapper text={t('QuickControls.TT.FinishBoarding')}>
            <QuickSettingsToggle onClick={handleInstantBoarding} icon={<PersonCheck size={42} />}>
              {t('QuickControls.FinishBoarding')}
            </QuickSettingsToggle>
          </TooltipWrapper>
          <TooltipWrapper text={t('QuickControls.TT.SimBridge')}>
            <QuickSettingsToggle
              onClick={handleResetSimBridgeConnection}
              icon={
                simBridgeClientState === SimBridgeClientState.CONNECTED ? <Wifi size={42} /> : <WifiOff size={42} />
              }
              className={simBridgeButtonStyle}
            >
              {t('QuickControls.SimBridge')} <br />
              {simBridgeButtonStateString}
            </QuickSettingsToggle>
          </TooltipWrapper>

          <TooltipWrapper text={t('QuickControls.TT.OnScreenKeyboard')}>
            <QuickSettingsToggle onClick={handleToggleOsk} icon={<Keyboard size={42} />} className={oskButtonStyle}>
              {t('QuickControls.OnScreenKeyboard')}
            </QuickSettingsToggle>
          </TooltipWrapper>
        </div>
        {/* Second Row */}
        <div className="flex flex-row items-center justify-between">
          {aircraftContext.settingsPages.realism.pauseOnTod && (
            <TooltipWrapper text={t('QuickControls.TT.PauseAtTod')}>
              <LargeQuickSettingsToggle
                onClick={handleTogglePauseAtTod}
                icon={<PiAirplaneLandingFill size={42} />}
                className={pauseAtTodStyle}
              >
                {t('QuickControls.PauseAtTod')} <br />
                {pauseAtTodString}
              </LargeQuickSettingsToggle>
            </TooltipWrapper>
          )}
          <TooltipWrapper text={t('QuickControls.TT.Simrate')}>
            <LargeQuickSettingsIncrementer
              onDownClick={decreaseSimrate}
              onUpClick={increaseSimrate}
              icon={<ClockHistory size={42} />}
              infoBox={<span>{`${simRate}x`}</span>}
            >
              {t('QuickControls.Simrate')}
            </LargeQuickSettingsIncrementer>
          </TooltipWrapper>
        </div>
      </div>
    </>
  );
};

export const QuickControls = () => {
  const [showQuickControlsPane, setShowQuickControlsPane] = useState(false);

  return (
    <>
      <TooltipWrapper text={t('StatusBar.TT.QuickControls')}>
        <div onClick={() => setShowQuickControlsPane((old) => !old)}>
          <Gear size={26} />
        </div>
      </TooltipWrapper>
      {showQuickControlsPane && <QuickControlsPane setShowQuickControlsPane={setShowQuickControlsPane} />}
    </>
  );
};
