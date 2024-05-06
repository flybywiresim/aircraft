// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import {
  usePersistentProperty,
  useSessionStorage,
  AircraftGithubVersionChecker,
  BuildInfo,
  SentryConsentState,
  SENTRY_CONSENT_KEY,
  useSimVar,
} from '@flybywiresim/fbw-sdk';
import { t } from '@flybywiresim/flypad';
import { SettingsPage } from '../Settings';
// @ts-ignore
import FbwTail from '../../Assets/FBW-Tail.svg';
import { useViewListenerEvent } from '../../Utils/listener';

interface BuildInfoEntryProps {
  title: string;
  value?: string;
  underline?: number;
}

interface CommunityPanelPlayerData {
  bCanSignOut: boolean;
  bDisable: boolean;
  sAvatar: string;
  sBuildVersion: string;
  sMoney: string;
  sCurrency: string;
  sName: string;
  sRichPresence: string;
  sStatus: string;
}

const SPACE_BETWEEN = 28;

const BuildInfoEntry = ({ title, value, underline = 0 }: BuildInfoEntryProps) => {
  const first = value?.substring(0, underline);
  const last = value?.substring(underline);

  return (
    <div className="mt-2 flex flex-row font-mono">
      <p>{title + '\u00A0'.repeat(Math.abs(SPACE_BETWEEN - title.length))}</p>
      <p className="ml-4">
        <span className="text-theme-highlight underline">{first}</span>
        {last}
      </p>
    </div>
  );
};

export const AboutPage = () => {
  const [title] = useSimVar('TITLE', 'string');
  const [buildInfo, setBuildInfo] = useState<BuildInfo | undefined>(undefined);
  const [sessionId] = usePersistentProperty('A32NX_SENTRY_SESSION_ID');
  const [version, setVersion] = useSessionStorage('SIM_VERSION', '');
  const [sentryEnabled] = usePersistentProperty(SENTRY_CONSENT_KEY, SentryConsentState.Refused);

  // Callback function to set sBuildVersion from the community panel
  const onSetPlayerData = (data: CommunityPanelPlayerData) => {
    setVersion(data.sBuildVersion);
  };

  // Register the callback function to receive the build version from the community panel
  useViewListenerEvent('JS_LISTENER_COMMUNITY', 'SetGamercardInfo', onSetPlayerData);

  useEffect(() => {
    AircraftGithubVersionChecker.getBuildInfo(process.env.AIRCRAFT_PROJECT_PREFIX).then((info) => setBuildInfo(info));
  }, [process.env.AIRCRAFT_PROJECT_PREFIX]);

  return (
    <SettingsPage name={t('Settings.About.Title')}>
      <div className="pointer-events-none absolute inset-y-0 flex flex-col justify-center px-16">
        <div className="flex flex-row items-center">
          <div className="flex flex-col">
            <div className="flex flex-row items-center">
              <img className="w-[36px]" src={FbwTail} alt="" />
              <h1 className="font-manrope ml-4 text-4xl font-bold">flyPadOS 3</h1>
            </div>

            <p className="mt-3 text-2xl">
              Made with love by contributors in Québec, Germany, the United States, Singapore, Indonesia, New Zealand,
              Australia, Spain, the United Kingdom, France, the Netherlands, Sweden, and Switzerland!
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-center">
          <p>&copy; 2020-2024 FlyByWire Simulations and its contributors, all rights reserved.</p>
          <p>Licensed under the GNU General Public License Version 3</p>
        </div>

        <div className="mt-16">
          <h1 className="font-bold">Build Info</h1>
          <div className="mt-4">
            <BuildInfoEntry title="Sim Version" value={version} />
            <BuildInfoEntry title="Aircraft Version" value={buildInfo?.version} />
            <BuildInfoEntry title="Livery Title" value={title} />
            <BuildInfoEntry title="Built" value={buildInfo?.built} />
            <BuildInfoEntry title="Ref" value={buildInfo?.ref} />
            <BuildInfoEntry title="SHA" value={buildInfo?.sha} underline={7} />
            <BuildInfoEntry title="Event Name" value={buildInfo?.eventName} />
            <BuildInfoEntry title="Pretty Release Name" value={buildInfo?.prettyReleaseName} />
            {sentryEnabled === SentryConsentState.Given && (
              <BuildInfoEntry title="Sentry Session ID" value={sessionId} />
            )}
          </div>
        </div>
      </div>
    </SettingsPage>
  );
};
