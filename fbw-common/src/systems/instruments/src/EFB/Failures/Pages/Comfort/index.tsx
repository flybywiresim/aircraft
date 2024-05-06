// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AtaChapterNumber, AtaChaptersTitle, AtaChaptersDescription, Failure } from '@flybywiresim/fbw-sdk';
import React from 'react';
import { Route } from 'react-router';
import { Link } from 'react-router-dom';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
import { t } from '../../../Localization/translation';
import { pathify } from '../../../Utils/routing';
import { AtaChapterPage } from './AtaChapterPage';
import { useFailuresOrchestrator } from '../../../failures-orchestrator-provider';

interface ATAChapterCardProps {
  ataNumber: AtaChapterNumber;
  title: string;
  description: string;
}

const ATAChapterCard = ({ ataNumber, description, title }: ATAChapterCardProps) => {
  const { activeFailures, allFailures } = useFailuresOrchestrator();

  const hasActiveFailure = allFailures
    .filter((it) => it.ata === ataNumber)
    .some((it) => activeFailures.has(it.identifier));

  return (
    <Link
      to={`/failures/comfort/${pathify(ataNumber.toString())}`}
      className="hover:border-theme-highlight flex flex-row space-x-4 rounded-md border-2 border-transparent p-2 transition duration-100"
    >
      <div className="bg-theme-accent font-title flex w-1/5 items-center justify-center rounded-md text-5xl font-bold">
        {`ATA ${ataNumber}`}

        <div className="text-utility-red relative -right-7 bottom-16 inline-block h-0 w-0 fill-current">
          {hasActiveFailure && (
            <svg style={{ width: '30px', height: '30px' }} viewBox="0 0 20 20">
              <circle cx={10} cy={10} r={5} />
            </svg>
          )}
        </div>
      </div>

      <div className="w-3/4 space-y-2">
        <h1 className="font-bold">{title}</h1>
        <p>{description}</p>
      </div>
    </Link>
  );
};

interface ComfortUIProps {
  filteredChapters: AtaChapterNumber[];
  allChapters: AtaChapterNumber[];
  failures: Failure[];
}

export const ComfortUI = ({ filteredChapters, allChapters, failures }: ComfortUIProps) => (
  <>
    <Route exact path="/failures/comfort">
      <ScrollableContainer height={48}>
        {filteredChapters.map((chapter) => (
          <ATAChapterCard
            key={chapter}
            ataNumber={chapter}
            title={AtaChaptersTitle[chapter]}
            description={AtaChaptersDescription[chapter]}
          />
        ))}
      </ScrollableContainer>
      {filteredChapters.length === 0 && (
        <div
          className="border-theme-accent mt-4 flex items-center justify-center rounded-md border-2"
          style={{ height: '48rem' }}
        >
          <p>{t('Failures.NoItemsFound')}</p>
        </div>
      )}
    </Route>

    {allChapters.map((chapter) => (
      <Route key={chapter} path={`/failures/comfort/${chapter.toString()}`}>
        <AtaChapterPage chapter={chapter} failures={failures} />
      </Route>
    ))}
  </>
);
