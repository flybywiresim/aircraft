// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useEffect, useRef } from 'react';
import { MathUtils, usePersistentNumberProperty, useSimVar, useSplitSimVar } from '@flybywiresim/fbw-sdk';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowsAngleContract,
  ArrowsAngleExpand,
  ArrowUp,
  ChevronDoubleDown,
  ChevronDoubleUp,
  ChevronLeft,
  ChevronRight,
  DashCircle,
  DashCircleFill,
  PauseCircleFill,
  PlayCircleFill,
  ToggleOff,
  ToggleOn,
  TruckFlatbed,
} from 'react-bootstrap-icons';
import Slider from 'rc-slider';
import { toast } from 'react-toastify';
import { t, PromptModal, useModals, TooltipWrapper, Toggle } from '@flybywiresim/flypad';
import { PushbackMap } from './PushbackMap';

export const PushbackPage = () => {
  const { showModal } = useModals();

  const [simOnGround] = useSimVar('SIM ON GROUND', 'bool', 250);
  const [flightPhase] = useSimVar('L:A32NX_FMGC_FLIGHT_PHASE', 'enum', 250);

  // This is used to completely turn off the pushback for compatibility with other
  // pushback add-ons. Only watching sim variables like 'PUSHBACK STATE' or
  // 'PUSHBACK AVAILABLE' leads to conflicts as other add-on also read/write them.
  // It is implemented as a LVAR to allow 3rd parties to see that the a32nx pushback is active
  // and to be able to deactivate themselves or the a32nx pushback system if required.
  const [pushbackSystemEnabled, setPushbackSystemEnabled] = useSimVar('L:A32NX_PUSHBACK_SYSTEM_ENABLED', 'bool', 100);

  const [pushbackState, setPushbackState] = useSplitSimVar('PUSHBACK STATE', 'enum', 'K:TOGGLE_PUSHBACK', 'bool', 100);
  const [pushbackWait, setPushbackWait] = useSimVar('PUSHBACK WAIT', 'bool', 100);
  const [pushbackAttached] = useSimVar('PUSHBACK ATTACHED', 'bool', 100);
  const [pushbackAngle] = useSimVar('PUSHBACK ANGLE', 'Degrees', 100);

  const [useControllerInput, setUseControllerInput] = usePersistentNumberProperty('PUSHBACK_USE_CONTROLLER_INPUT', 1);
  const [rudderPosition] = useSimVar('L:A32NX_RUDDER_PEDAL_POSITION', 'number', 50);
  const [elevatorPosition] = useSimVar('L:A32NX_SIDESTICK_POSITION_Y', 'number', 50);

  const [planeGroundSpeed] = useSimVar('GROUND VELOCITY', 'Knots', 100);

  const [parkingBrakeEngaged, setParkingBrakeEngaged] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool', 250);
  const [nwStrgDisc] = useSimVar('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool', 250);

  const [tugCmdHdgFactor, setCmdHdgFactor] = useSimVar('L:A32NX_PUSHBACK_HDG_FACTOR', 'number', 100);
  const [tugCmdSpdFactor, setCmdSpdFactor] = useSimVar('L:A32NX_PUSHBACK_SPD_FACTOR', 'number', 100);

  const [showDebugInfo, setShowDebugInfo] = useSimVar('L:A32NX_PUSHBACK_DEBUG', 'bool', 100);

  // Required so these can be used inside the useEffect return callback
  const pushBackAttachedRef = useRef(pushbackAttached);
  pushBackAttachedRef.current = pushbackAttached;

  const pushbackUIAvailable: boolean = simOnGround;
  const tugInTransit: boolean = pushbackAttached !== nwStrgDisc;
  const pushbackActive: boolean = pushbackSystemEnabled && !tugInTransit && nwStrgDisc;

  const releaseTug = () => {
    setPushbackState(3);
    setPushbackWait(0);
    // This alone does not suffice to fully release the tug.
    // A "TUG_DISABLE" event has to be sent. But if sent too early it gets
    // ignored by the sim sometimes and the aircraft would not steer.
    // See the useEffect [nwStrgDisc] in Efb.tsx - it fires this event when the
    // NW STRG DISC message disappears which is also the moment when the
    // nose wheel visually starts turning again.
  };

  const callTug = () => {
    setPushbackState(0);
    setPushbackWait(1);
  };

  const handleEnableSystem = () => {
    if (pushbackSystemEnabled) {
      if (pushbackState < 3) {
        showModal(
          <PromptModal
            title={t('Pushback.DisableSystemMessageTitle')}
            bodyText={`${t('Pushback.DisableSystemMessageBody')}`}
            onConfirm={() => {
              releaseTug();
            }}
          />,
        );
      } else {
        setPushbackSystemEnabled(0);
      }
      return;
    }
    showModal(
      <PromptModal
        title={t('Pushback.EnableSystemMessageTitle')}
        bodyText={`${t('Pushback.EnableSystemMessageBody')}`}
        onConfirm={() => {
          setPushbackSystemEnabled(1);
        }}
      />,
    );
  };

  const handleCallTug = () => {
    if (pushbackState < 3) {
      releaseTug();
      return;
    }
    callTug();
  };

  const stopMovement = () => {
    setCmdHdgFactor(0);
    setCmdSpdFactor(0);
  };

  const handleTugSpeed = (speed: number) => {
    setCmdSpdFactor(MathUtils.clamp(speed, -1, 1));
  };

  const handleTugDirection = (value: number) => {
    setCmdHdgFactor(MathUtils.clamp(value, -1, 1));
  };

  // called once when loading and unloading the page
  useEffect(() => {
    // when loading the page
    stopMovement();

    // when unloading the page
    // !obs: as with setInterval no access to current local variable values
    return () => {
      if (pushBackAttachedRef.current) {
        toast.info(t('Pushback.LeavePageMessage'), {
          autoClose: 750,
          hideProgressBar: true,
          closeButton: false,
        });
        stopMovement();
      }
    };
  }, []);

  // Update commanded heading from input
  useEffect(() => {
    if (!pushbackActive || !useControllerInput) {
      return;
    }
    // create deadzone
    if (rudderPosition > -0.05 && rudderPosition < 0.05) {
      setCmdHdgFactor(0);
    } else {
      setCmdHdgFactor(rudderPosition / 100);
    }
  }, [rudderPosition]);

  // Update commanded speed from input
  useEffect(() => {
    if (!pushbackActive || !useControllerInput) {
      return;
    }
    // create deadzone
    if (elevatorPosition > -0.05 && elevatorPosition < 0.05) {
      setCmdSpdFactor(0);
    } else {
      setCmdSpdFactor(-elevatorPosition);
    }
  }, [elevatorPosition]);

  // Make sure to deactivate the pushback system completely when leaving ground
  useEffect(() => {
    if (flightPhase !== 0 && flightPhase !== 7) {
      setPushbackSystemEnabled(simOnGround);
    }
  }, [simOnGround]);

  // Debug info for pushback movement - can be removed eventually
  const debugInformation = () => (
    <div className="absolute inset-x-0 z-50 mx-4 flex grow justify-between border-gray-100 bg-gray-100 font-mono text-black opacity-50">
      <div className="text-m overflow-hidden text-black">
        pushbackSystemEnabled: {pushbackSystemEnabled}
        <br />
        deltaTime: {SimVar.GetSimVarValue('L:A32NX_PUSHBACK_UPDT_DELTA', 'number').toFixed(3)}
        <br />
        pushBackWait: {pushbackWait}
        <br />
        pushBackAttached: {pushbackAttached}
        <br />
        pushBackState: {pushbackState}
        <br />
        tugInTransit: {tugInTransit ? 'true' : 'false'}
        <br />
        pushbackAvailable: {SimVar.GetSimVarValue('PUSHBACK AVAILABLE', 'bool')}
        <br />
        tugAngle: {pushbackAngle.toFixed(3)}
        <br />
        NW STRG DISC MEMO {SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool')}
        <br />
        Steer Input Control: {SimVar.GetSimVarValue('STEER INPUT CONTROL', 'Percent Over 100').toFixed(3)}
        <br />
        Gear Steer Angle: {SimVar.GetSimVarValue('GEAR STEER ANGLE PCT:0', 'Percent Over 100').toFixed(3)}
      </div>
      <div className="text-m overflow-hidden text-black">
        Heading (True): {SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees').toFixed(3)}
        <br />
        Heading (Magnetic): {SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'degrees').toFixed(3)}
        <br />
        tCHeadingF: {tugCmdHdgFactor.toFixed(3)}
        <br />
        tCHeading : {SimVar.GetSimVarValue('L:A32NX_PUSHBACK_HDG', 'degrees').toFixed(3)}
        <br />
        Rotation Velocity X: {SimVar.GetSimVarValue('ROTATION VELOCITY BODY X', 'Number').toFixed(3)}
        <br />
        Rotation Velocity Y: {SimVar.GetSimVarValue('ROTATION VELOCITY BODY Y', 'Number').toFixed(3)}
        <br /> Rotation Velocity Z: {SimVar.GetSimVarValue('ROTATION VELOCITY BODY Z', 'Number').toFixed(3)}
        <br /> Rot. Accel. X:{' '}
        {SimVar.GetSimVarValue('ROTATION ACCELERATION BODY X', 'feet per second squared').toFixed(3)}
        <br /> Rot. Accel. Y:{' '}
        {SimVar.GetSimVarValue('ROTATION ACCELERATION BODY Y', 'feet per second squared').toFixed(3)}
        <br /> Rot. Accel Z:{' '}
        {SimVar.GetSimVarValue('ROTATION ACCELERATION BODY Z', 'feet per second squared').toFixed(3)}
        <br /> Counter Rot. Accel X:{' '}
        {SimVar.GetSimVarValue('L:A32NX_PUSHBACK_R_X_OUT', 'feet per second squared').toFixed(3)} <br /> Pitch:{' '}
        {SimVar.GetSimVarValue('PLANE PITCH DEGREES', 'degrees').toFixed(3)}
      </div>
      <div className="text-m overflow-hidden text-black">
        acGroundSpeed: {planeGroundSpeed.toFixed(3)}
        {'kts '}
        {' ('}
        {(planeGroundSpeed * 1.68781).toFixed(3)}
        ft/s)
        <br />
        tCSpeedFactor: {tugCmdSpdFactor.toFixed(3)}
        <br />
        tCSpeed: {SimVar.GetSimVarValue('L:A32NX_PUSHBACK_SPD', 'feet per second').toFixed(3)}
        <br />
        tInertiaSpeed: {SimVar.GetSimVarValue('L:A32NX_PUSHBACK_INERTIA_SPD', 'feet per second').toFixed(3)}
        <br />
        Velocity X: {SimVar.GetSimVarValue('VELOCITY BODY X', 'feet per second').toFixed(3)}
        <br />
        Velocity Y: {SimVar.GetSimVarValue('VELOCITY BODY Y', 'feet per second').toFixed(3)}
        <br />
        Velocity Z: {SimVar.GetSimVarValue('VELOCITY BODY Z', 'feet per second').toFixed(3)}
        <br /> Accel. X: {SimVar.GetSimVarValue('ACCELERATION BODY X', 'feet per second squared').toFixed(3)}
        <br /> Accel. Y: {SimVar.GetSimVarValue('ACCELERATION BODY Y', 'feet per second squared').toFixed(3)}
        <br /> Accel Z: {SimVar.GetSimVarValue('ACCELERATION BODY Z', 'feet per second squared').toFixed(3)}
        <br /> Rel. Wind Z: {SimVar.GetSimVarValue('RELATIVE WIND VELOCITY BODY Z', 'meter per second').toFixed(3)}
        m/s
      </div>
    </div>
  );

  // To prevent keyboard input (esp. END key for external view) to change
  // the slider position. This is accomplished by a
  // onAfterChange={() => sliderRef.current.blur()}
  // in the Slider component props.
  const directionSliderRef = useRef<any>(null);
  const speedSliderRef = useRef<any>(null);

  const callTugLabel = () => {
    if (pushbackActive) {
      return t('Pushback.TugAttached');
    }
    if (tugInTransit) {
      return t('Pushback.TugInTransit');
    }
    return t('Pushback.CallTug');
  };

  return (
    <>
      <div className="relative flex h-full w-full flex-col space-y-4">
        {/* Map Container */}
        <div className="flex grow flex-col space-y-4">
          <PushbackMap />
        </div>

        <div className="absolute inset-x-0">{showDebugInfo ? debugInformation() : <></>}</div>

        {/* Show message when not on ground */}
        {!pushbackUIAvailable && (
          <div className="absolute top-2/3 text-center bu left-0 right-0 text-5xl border-white border-2}">
            {t('Pushback.AvailableOnlyOnGround')}
          </div>
        )}

        {/* Manual Pushback Controls */}
        <div
          className={`flex h-full flex-col space-y-2 rounded-lg border-2 border-theme-accent p-6 ${!pushbackUIAvailable && 'pointer-events-none opacity-20'}`}
        >
          <div className="flex flex-row space-x-4">
            {/* Pushback System enabled On/Off */}
            {pushbackSystemEnabled ? (
              <div className="w-full">
                <p className="text-center" onDoubleClick={() => setShowDebugInfo((old: any) => !old)}>
                  {t('Pushback.SystemEnabledOn')}
                </p>
                <TooltipWrapper text={t('Pushback.TT.SystemEnabledOn')}>
                  <button
                    type="button"
                    onClick={handleEnableSystem}
                    className="flex h-20 w-full items-center justify-center rounded-md border-2 border-theme-accent bg-green-600 text-theme-text opacity-60 transition duration-100 hover:opacity-100"
                  >
                    <ToggleOn size={50} />
                  </button>
                </TooltipWrapper>
              </div>
            ) : (
              <div className="w-full">
                <p className="text-center" onDoubleClick={() => setShowDebugInfo((old: any) => !old)}>
                  {t('Pushback.SystemEnabledOff')}
                </p>
                <TooltipWrapper text={t('Pushback.TT.SystemEnabledOff')}>
                  <button
                    type="button"
                    onClick={handleEnableSystem}
                    className={`{ flex h-20 w-full items-center justify-center rounded-md border-2 border-theme-accent bg-red-600 text-theme-text opacity-60 transition duration-100 hover:opacity-100${!pushbackUIAvailable && 'pointer-events-none opacity-30'}`}
                  >
                    <ToggleOff size={50} />
                  </button>
                </TooltipWrapper>
              </div>
            )}

            {/* Call Tug */}
            <div className={`w-full ${!pushbackSystemEnabled && 'pointer-events-none opacity-30'}`}>
              <p className="text-center">{callTugLabel()}</p>
              <TooltipWrapper text={t('Pushback.TT.CallReleaseTug')}>
                <button
                  type="button"
                  onClick={handleCallTug}
                  className={`duration-100'} flex h-20 w-full items-center justify-center rounded-md border-2 border-theme-accent text-theme-text opacity-60 transition hover:opacity-100 ${tugInTransit ? 'bg-utility-amber' : 'bg-green-600'} ${!pushbackSystemEnabled && 'pointer-events-none opacity-30'}`}
                >
                  <TruckFlatbed size={50} />{' '}
                  {pushbackActive ? (
                    <ArrowsAngleContract className="ml-4" size={40} />
                  ) : (
                    <ArrowsAngleExpand className="ml-4" size={40} />
                  )}
                </button>
              </TooltipWrapper>
            </div>

            {/* Parking Brake */}
            <div className="w-full">
              <p className="jus text-center">
                {t('Pushback.ParkingBrake.Title')}{' '}
                {parkingBrakeEngaged ? t('Pushback.ParkingBrake.On') : t('Pushback.ParkingBrake.Off')}
              </p>
              <TooltipWrapper text={t('Pushback.TT.SetReleaseParkingBrake')}>
                <button
                  type="button"
                  onClick={() => setParkingBrakeEngaged((old: any) => !old)}
                  className={`text-utility-white flex h-20 w-full items-center justify-center rounded-md opacity-60 transition duration-100 hover:opacity-100  ${parkingBrakeEngaged ? 'bg-red-600' : 'bg-green-600'} {${!pushbackUIAvailable && 'pointer-events-none opacity-30'}`}
                >
                  {parkingBrakeEngaged ? (
                    <DashCircleFill className="" size={40} />
                  ) : (
                    <DashCircle className="-rotate-90" size={40} />
                  )}
                </button>
              </TooltipWrapper>
            </div>
          </div>

          <div className={`flex flex-row space-x-4 ${!pushbackActive && 'pointer-events-none opacity-30'}`}>
            {/* Backward Button */}
            <div className="w-full">
              <p className="text-center">{t('Pushback.Backward')}</p>
              <TooltipWrapper text={t('Pushback.TT.DecreaseSpeed')}>
                <button
                  type="button"
                  className="flex h-20 w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-highlight transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
                  onClick={() => handleTugSpeed(tugCmdSpdFactor - 0.1)}
                >
                  <ArrowDown size={40} />
                </button>
              </TooltipWrapper>
            </div>

            {/* Forward Button */}
            <div className="w-full">
              <p className="text-center">{t('Pushback.Forward')}</p>
              <TooltipWrapper text={t('Pushback.TT.IncreaseSpeed')}>
                <button
                  type="button"
                  className="flex h-20 w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-highlight transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
                  onClick={() => handleTugSpeed(tugCmdSpdFactor + 0.1)}
                >
                  <ArrowUp size={40} />
                </button>
              </TooltipWrapper>
            </div>

            {/* Pause/Moving Button */}
            <div className="w-full">
              <p className="text-center">{tugCmdSpdFactor !== 0 ? t('Pushback.Moving') : t('Pushback.Halt')}</p>
              <TooltipWrapper text={t('Pushback.TT.PausePushback')}>
                <button
                  type="button"
                  onClick={stopMovement}
                  className="flex h-20 w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-highlight transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
                >
                  {tugCmdSpdFactor !== 0 ? <PauseCircleFill size={40} /> : <PlayCircleFill size={40} />}
                </button>
              </TooltipWrapper>
            </div>

            {/* Left Button */}
            <div className="w-full">
              <p className="text-center">{t('Pushback.Left')}</p>
              <TooltipWrapper text={t('Pushback.TT.Left')}>
                <button
                  type="button"
                  className="flex h-20 w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-highlight transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
                  onClick={() => handleTugDirection(tugCmdHdgFactor - 0.05)}
                >
                  <ArrowLeft size={40} />
                </button>
              </TooltipWrapper>
            </div>

            {/* Right Button */}
            <div className="w-full">
              <p className="text-center">{t('Pushback.Right')}</p>
              <TooltipWrapper text={t('Pushback.TT.Right')}>
                <button
                  type="button"
                  className="flex h-20 w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-highlight transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
                  onClick={() => handleTugDirection(tugCmdHdgFactor + 0.05)}
                >
                  <ArrowRight size={40} />
                </button>
              </TooltipWrapper>
            </div>
          </div>

          {/* Direction Slider */}
          <div className={`${!pushbackActive && 'pointer-events-none opacity-30'}`}>
            <p className="text-center">{t('Pushback.TugDirection')}</p>
            <TooltipWrapper text={t('Pushback.TT.SliderDirection')}>
              <div className="flex flex-row items-center space-x-4">
                <p className="text-unselected font-bold">
                  <ChevronLeft />
                </p>
                <Slider
                  ref={directionSliderRef}
                  onChange={(value) => handleTugDirection(value)}
                  onAfterChange={() => directionSliderRef.current.blur()}
                  min={-1}
                  step={0.01}
                  max={1}
                  value={tugCmdHdgFactor}
                  startPoint={0}
                />
                <p className="text-unselected font-bold">
                  <ChevronRight />
                </p>
              </div>
            </TooltipWrapper>
          </div>

          {/* Speed Slider */}
          <div className={`${!pushbackActive && 'pointer-events-none opacity-30'}`}>
            <p className="text-center">{t('Pushback.TugSpeed')}</p>
            <TooltipWrapper text={t('Pushback.TT.SliderSpeed')}>
              <div className="flex flex-row items-center space-x-4">
                <p className="text-unselected font-bold">
                  <ChevronDoubleDown />
                </p>
                <Slider
                  ref={speedSliderRef}
                  onChange={(value) => handleTugSpeed(value)}
                  onAfterChange={() => speedSliderRef.current.blur()}
                  min={-1}
                  step={0.01}
                  max={1}
                  value={tugCmdSpdFactor}
                  startPoint={0}
                />
                <p className="text-unselected font-bold">
                  <ChevronDoubleUp />
                </p>
              </div>
            </TooltipWrapper>
          </div>

          <TooltipWrapper text={t('Pushback.TT.UseControllerInput')}>
            <div className={`flex h-10 flex-row items-center ${!pushbackActive && 'pointer-events-none opacity-30'}`}>
              <div className="mr-4">{t('Pushback.UseControllerInput')}</div>
              <Toggle value={!!useControllerInput} onToggle={(value) => setUseControllerInput(value ? 1 : 0)} />
            </div>
          </TooltipWrapper>
        </div>
      </div>
    </>
  );
};
