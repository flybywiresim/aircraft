// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AtaChapterNumber } from '@flybywiresim/fbw-sdk';
import React, { FC } from 'react';
import { ArrowRight } from 'react-bootstrap-icons';
import { useHistory } from 'react-router';
import { t } from '../../../Localization/translation';
import { RemindersSection } from './RemindersSection';
import { useFailuresOrchestrator } from '../../../failures-orchestrator-provider';
import { findLatestSeenPathname } from '../../../Utils/routing';
import { useAppDispatch } from '../../../Store/store';
import { setSearchQuery } from '../../../Store/features/failuresPage';

interface ActiveFailureCardProps {
  ata?: AtaChapterNumber;
  name: string;
}

const ActiveFailureCard: FC<ActiveFailureCardProps> = ({ ata, name }) => {
  const dispatch = useAppDispatch();
  const history = useHistory();

  return (
    <div
      className="mr-4 mt-4 flex flex-col flex-wrap rounded-md border-2 border-theme-accent bg-theme-accent p-2 hover:border-theme-highlight"
      onClick={() => {
        dispatch(setSearchQuery(name.toUpperCase()));

        const lastFailurePath = findLatestSeenPathname(history, '/failures');

        if (!ata) {
          history.push('/failures/compact');
        }

        if (!lastFailurePath || lastFailurePath.includes('comfort')) {
          history.push(`/failures/comfort/${ata}`);
        } else {
          history.push('/failures/compact');
        }
      }}
    >
      <h3 className="font-bold">Active Failure</h3>
      <span className="font-inter mt-2">{name}</span>
      <ArrowRight className="ml-auto" />
    </div>
  );
};

export const MaintenanceReminder = () => {
  const { allFailures, activeFailures } = useFailuresOrchestrator();

  return (
    <RemindersSection title={t('Dashboard.ImportantInformation.Maintenance.Title')} pageLinkPath="/failures">
      <div className="flex flex-row flex-wrap">
        {Array.from(activeFailures)
          // Sorts the failures by name length, greatest to least
          .sort(
            (a, b) =>
              (allFailures.find((f) => f.identifier === b)?.name ?? '').length -
              (allFailures.find((f) => f.identifier === a)?.name ?? '').length,
          )
          .map((failureIdentifier) => {
            const failure = allFailures.find((it) => it.identifier === failureIdentifier);

            return <ActiveFailureCard ata={failure?.ata} name={failure?.name ?? '<unknown>'} />;
          })}

        {!activeFailures.size && (
          <h1 className="m-auto my-4 text-center font-bold opacity-60">
            {t('Dashboard.ImportantInformation.Maintenance.NoActiveFailures')}
          </h1>
        )}
      </div>
    </RemindersSection>
  );
};
