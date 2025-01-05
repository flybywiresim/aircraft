// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useRef, useState } from 'react';
import { FastForwardFill, Wifi, WifiOff } from 'react-bootstrap-icons';
import {
  useSimVar,
  usePersistentNumberProperty,
  usePersistentProperty,
  ClientState,
  useGlobalVar,
} from '@flybywiresim/fbw-sdk';
import { useInterval } from '@flybywiresim/react-components';
import { t, TooltipWrapper, initialState } from '@flybywiresim/flypad';
import { BatteryStatus } from './BatteryStatus';
import { useAppSelector } from '../Store/store';
import { QuickControls } from './QuickControls';

interface StatusBarProps {
  batteryLevel: number;
  isCharging: boolean;
}

export const StatusBar = ({ batteryLevel, isCharging }: StatusBarProps) => {
  const [currentUTC] = useSimVar('E:ZULU TIME', 'seconds');
  const [currentLocalTime] = useSimVar('E:LOCAL TIME', 'seconds');
  const [dayOfWeek] = useSimVar('E:ZULU DAY OF WEEK', 'number');
  const [monthOfYear] = useSimVar('E:ZULU MONTH OF YEAR', 'number');
  const [dayOfMonth] = useSimVar('E:ZULU DAY OF MONTH', 'number');
  const [showStatusBarFlightProgress] = usePersistentNumberProperty('EFB_SHOW_STATUSBAR_FLIGHTPROGRESS', 1);

  const [timeDisplayed] = usePersistentProperty('EFB_TIME_DISPLAYED', 'utc');
  const [timeFormat] = usePersistentProperty('EFB_TIME_FORMAT', '24');

  const [outdatedVersionFlag] = useSimVar('L:A32NX_OUTDATED_VERSION', 'boolean', 500);

  const simRate = useGlobalVar('SIMULATION RATE', 'number', 500);

  const dayName = [
    t('StatusBar.Sun'),
    t('StatusBar.Mon'),
    t('StatusBar.Tue'),
    t('StatusBar.Wed'),
    t('StatusBar.Thu'),
    t('StatusBar.Fri'),
    t('StatusBar.Sat'),
  ][dayOfWeek];

  const monthName = [
    t('StatusBar.Jan'),
    t('StatusBar.Feb'),
    t('StatusBar.Mar'),
    t('StatusBar.Apr'),
    t('StatusBar.May'),
    t('StatusBar.Jun'),
    t('StatusBar.Jul'),
    t('StatusBar.Aug'),
    t('StatusBar.Sep'),
    t('StatusBar.Oct'),
    t('StatusBar.Nov'),
    t('StatusBar.Dec'),
  ][monthOfYear - 1];

  const getZuluFormattedTime = (seconds: number) =>
    `${Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0')}${Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0')}Z`;
  const getLocalFormattedTime = (seconds: number) => {
    if (timeFormat === '24') {
      return `${Math.floor(seconds / 3600)
        .toString()
        .padStart(2, '0')}:${Math.floor((seconds % 3600) / 60)
        .toString()
        .padStart(2, '0')}`;
    }
    const hours = Math.floor(seconds / 3600) % 12;
    const minutes = Math.floor((seconds % 3600) / 60);
    const ampm = Math.floor(seconds / 3600) >= 12 ? 'pm' : 'am';
    return `${hours === 0 ? 12 : hours}:${minutes.toString().padStart(2, '0')}${ampm}`;
  };

  const { flightPlanProgress } = useAppSelector((state) => state.flightProgress);
  const { departingAirport, arrivingAirport, schedIn, schedOut } = useAppSelector((state) => state.simbrief.data);
  const { data } = useAppSelector((state) => state.simbrief);

  const [showSchedTimes, setShowSchedTimes] = useState(false);

  let schedInParsed = '';
  let schedOutParsed = '';

  if (!schedInParsed) {
    const sta = new Date(parseInt(schedIn) * 1000);
    schedInParsed = `${sta.getUTCHours().toString().padStart(2, '0')}${sta.getUTCMinutes().toString().padStart(2, '0')}Z`;
  }

  if (!schedOutParsed) {
    const std = new Date(parseInt(schedOut) * 1000);
    schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}${std.getUTCMinutes().toString().padStart(2, '0')}Z`;
  }
  const shutoffTimerRef = useRef<number | null>(null);

  const [simBridgeConnected, setSimBridgeConnected] = useState(false);

  useInterval(() => {
    setSimBridgeConnected(ClientState.getInstance().isConnected());
  }, 1_000);

  useEffect(() => {
    setSimBridgeConnected(ClientState.getInstance().isConnected());

    const interval = setInterval(() => {
      setShowSchedTimes((old) => !old);

      setTimeout(() => {
        setShowSchedTimes((old) => !old);
      }, 5_000);
    }, 30_000);

    return () => {
      clearInterval(interval);
      if (shutoffTimerRef.current) {
        clearInterval(shutoffTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed z-30 flex h-10 w-full items-center justify-between bg-theme-statusbar px-6 text-lg font-medium leading-none text-theme-text">
      <p>{`${dayName} ${monthName} ${dayOfMonth}`}</p>

      {outdatedVersionFlag ? (
        <div className="absolute left-48 flex h-10 w-96 items-center justify-center overflow-hidden ">
          <TooltipWrapper text={t('VersionCheck.TT.StatusBarWarning')}>
            <span className="text-utility-red">{t('VersionCheck.StatusBarWarning').toUpperCase()}</span>
          </TooltipWrapper>
        </div>
      ) : (
        ''
      )}

      <div className="absolute inset-x-0 mx-auto flex w-min flex-row items-center justify-center space-x-4">
        {(timeDisplayed === 'utc' || timeDisplayed === 'both') && <p>{getZuluFormattedTime(currentUTC)}</p>}
        {timeDisplayed === 'both' && <p>/</p>}
        {(timeDisplayed === 'local' || timeDisplayed === 'both') && <p>{getLocalFormattedTime(currentLocalTime)}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {!!showStatusBarFlightProgress && data !== initialState.data && (
          <div
            className="flex h-10 flex-row items-center space-x-4 overflow-hidden pr-10"
            onClick={() => setShowSchedTimes((old) => !old)}
          >
            <div
              className={`${showSchedTimes ? '-translate-y-1/4' : 'translate-y-1/4'} flex flex-col space-y-1 text-right transition duration-100`}
            >
              <p>{departingAirport}</p>
              <p>{schedOutParsed}</p>
            </div>
            <div className="flex w-32 flex-row">
              <div className="h-1 bg-theme-highlight" style={{ width: `${flightPlanProgress}%` }} />
              <div className="h-1 bg-theme-text" style={{ width: `${100 - flightPlanProgress}%` }} />
            </div>
            <div
              className={`${showSchedTimes ? '-translate-y-1/4' : 'translate-y-1/4'} flex flex-col space-y-1 transition duration-100`}
            >
              <p>{arrivingAirport}</p>
              <p>{schedInParsed}</p>
            </div>
          </div>
        )}

        {simRate !== 1 && (
          <TooltipWrapper text={`Simulation Rate is currently ${simRate}x`}>
            <div className="flex items-center space-x-2">
              <p>{`${simRate > 1 ? simRate.toFixed(0) : simRate.toFixed(2)}x`}</p>
              <FastForwardFill size={26} />
            </div>
          </TooltipWrapper>
        )}

        <QuickControls />

        <TooltipWrapper
          text={simBridgeConnected ? t('StatusBar.TT.ConnectedToLocalApi') : t('StatusBar.TT.DisconnectedFromLocalApi')}
        >
          {simBridgeConnected ? <Wifi size={26} /> : <WifiOff size={26} />}
        </TooltipWrapper>

        <BatteryStatus batteryLevel={batteryLevel} isCharging={isCharging} />
      </div>
    </div>
  );
};
