// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { t } from '@flybywiresim/flypad';
import { SettingsPage } from '../Settings';
// @ts-ignore
import { useTroubleshooting } from '../../TroubleshootingContext';
import { AiracCycleFormatter, FacilityLoader } from '@microsoft/msfs-sdk';
import { AircraftGithubVersionChecker, BuildInfo } from 'shared/src';

// TODO merge navdata PR and use the proper function
function isMsfs2024() {
  return (window.InputBar.MENU_BUTTON_A as any) === 'KEY_MENU_SR_VALID';
}

export const TroubleshootingPage = () => {
  const errorLog = useTroubleshooting();
  const [navDates, setNavDates] = useState('');
  const [naviInstalled, setNaviInstalled] = useState(false);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | undefined>(undefined);

  useEffect(() => {
    fetch('/VFS/scenery/fs-base-jep/scenery/world/airaccycle.bgl', { method: 'HEAD' }).then((r) =>
      setNaviInstalled(r.ok),
    );

    const formatter = AiracCycleFormatter.create('{eff({dd}{MON}{YY})}-{exp({dd}{MON}{YY})}({YYCC})');
    setNavDates(formatter(FacilityLoader.getDatabaseCycles().current));

    AircraftGithubVersionChecker.getBuildInfo(process.env.AIRCRAFT_PROJECT_PREFIX).then((info) => setBuildInfo(info));
  }, []);

  return (
    <SettingsPage name={t('Settings.Troubleshooting.Title')}>
      <pre className="w-full font-mono text-base">
        Aircraft Version: {buildInfo?.version}
        {'\n'}
        MSFS2024: {isMsfs2024() ? 'True\n' : 'False\n'}
        NavData Dates: {navDates + '\n'}
        Navigraph NavData: {naviInstalled ? 'True\n' : 'False\n'}
        {'\n'}
        {errorLog.map((msg) => msg + '\n')}
      </pre>
    </SettingsPage>
  );
};
