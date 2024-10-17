// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useContext, useRef } from 'react';

import { usePersistentNumberProperty } from '@flybywiresim/fbw-sdk';
import Slider from 'rc-slider';
import { t } from '../../Localization/translation';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SettingItem, SettingsPage } from '../Settings';
import { AircraftContext } from '@flybywiresim/flypad';

export const AudioPage = () => {
  const aircraftContext = useContext(AircraftContext);
  const [ptuAudible, setPtuAudible] = usePersistentNumberProperty('SOUND_PTU_AUDIBLE_COCKPIT', 0);
  const [exteriorVolume, setExteriorVolume] = usePersistentNumberProperty('SOUND_EXTERIOR_MASTER', 0);
  const [engineVolume, setEngineVolume] = usePersistentNumberProperty('SOUND_INTERIOR_ENGINE', 0);
  const [windVolume, setWindVolume] = usePersistentNumberProperty('SOUND_INTERIOR_WIND', 0);
  const [passengerAmbienceEnabled, setPassengerAmbienceEnabled] = usePersistentNumberProperty(
    'SOUND_PASSENGER_AMBIENCE_ENABLED',
    1,
  );
  const [announcementsEnabled, setAnnouncementsEnabled] = usePersistentNumberProperty('SOUND_ANNOUNCEMENTS_ENABLED', 1);
  const [boardingMusicEnabled, setBoardingMusicEnabled] = usePersistentNumberProperty(
    'SOUND_BOARDING_MUSIC_ENABLED',
    1,
  );

  // To prevent keyboard input (esp. END key for external view) to change
  // the slider position. This is accomplished by a
  // onAfterChange={() => sliderRef.current.blur()}
  // in the Slider component props.
  const exteriorSliderRef = useRef<any>(null);
  const engineSliderRef = useRef<any>(null);
  const windSliderRef = useRef<any>(null);

  return (
    <SettingsPage name={t('Settings.Audio.Title')}>
      {aircraftContext.settingsPages.audio.masterVolume && (
        <SettingItem name={t('Settings.Audio.ExteriorMasterVolume')}>
          <div className="flex flex-row items-center space-x-8">
            <Slider
              ref={exteriorSliderRef}
              style={{ width: '24rem' }}
              value={exteriorVolume + 50}
              onChange={(value) => setExteriorVolume(value - 50)}
              onAfterChange={() => exteriorSliderRef.current.blur()}
            />
            <SimpleInput
              min={1}
              max={100}
              value={exteriorVolume + 50}
              className="w-20 text-center"
              onChange={(value) => setExteriorVolume(Number.parseInt(value) - 50)}
              number
            />
          </div>
        </SettingItem>
      )}

      {aircraftContext.settingsPages.audio.engineVolume && (
        <SettingItem name={t('Settings.Audio.EngineInteriorVolume')}>
          <div className="flex flex-row items-center space-x-8">
            <Slider
              ref={engineSliderRef}
              style={{ width: '24rem' }}
              value={engineVolume + 50}
              onChange={(value) => setEngineVolume(value - 50)}
              onAfterChange={() => engineSliderRef.current.blur()}
            />
            <SimpleInput
              min={1}
              max={100}
              value={engineVolume + 50}
              className="w-20 text-center"
              onChange={(value) => setEngineVolume(Number.parseInt(value) - 50)}
              number
            />
          </div>
        </SettingItem>
      )}

      {aircraftContext.settingsPages.audio.windVolume && (
        <SettingItem name={t('Settings.Audio.WindInteriorVolume')}>
          <div className="flex flex-row items-center space-x-8">
            <Slider
              ref={windSliderRef}
              style={{ width: '24rem' }}
              value={windVolume + 50}
              onChange={(value) => setWindVolume(value - 50)}
              onAfterChange={() => windSliderRef.current.blur()}
            />
            <SimpleInput
              min={1}
              max={100}
              value={windVolume + 50}
              className="w-20 text-center"
              onChange={(value) => setWindVolume(Number.parseInt(value) - 50)}
              number
            />
          </div>
        </SettingItem>
      )}

      {aircraftContext.settingsPages.audio.ptuCockpit && (
        <SettingItem name={t('Settings.Audio.PtuAudibleInCockpit')} unrealistic>
          <Toggle value={!!ptuAudible} onToggle={(value) => setPtuAudible(value ? 1 : 0)} />
        </SettingItem>
      )}

      {aircraftContext.settingsPages.audio.paxAmbience && (
        <SettingItem name={t('Settings.Audio.PassengerAmbience')}>
          <Toggle value={!!passengerAmbienceEnabled} onToggle={(value) => setPassengerAmbienceEnabled(value ? 1 : 0)} />
        </SettingItem>
      )}

      {aircraftContext.settingsPages.audio.announcements && (
        <SettingItem name={t('Settings.Audio.Announcements')}>
          <Toggle value={!!announcementsEnabled} onToggle={(value) => setAnnouncementsEnabled(value ? 1 : 0)} />
        </SettingItem>
      )}

      {aircraftContext.settingsPages.audio.boardingMusic && (
        <SettingItem name={t('Settings.Audio.BoardingMusic')}>
          <Toggle value={!!boardingMusicEnabled} onToggle={(value) => setBoardingMusicEnabled(value ? 1 : 0)} />
        </SettingItem>
      )}
    </SettingsPage>
  );
};
