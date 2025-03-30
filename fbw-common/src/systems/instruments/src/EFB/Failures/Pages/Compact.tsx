// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AtaChapterNumber, AtaChaptersTitle, Failure } from '@flybywiresim/fbw-sdk';
import React from 'react';
import { t } from '../../Localization/translation';
import { FailureButton } from '../FailureButton';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useAppSelector } from '../../Store/store';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

interface FailureGroupProps {
  title: string;
  failures: Failure[];
}

const FailureGroup = ({ title, failures }: FailureGroupProps) => {
  const { activeFailures, activate, deactivate } = useFailuresOrchestrator();
  const { searchQuery } = useAppSelector((state) => state.failuresPage);

  const getHighlightedTerm = (failureName: string) => {
    const searchQueryIdx = failureName.toUpperCase().indexOf(searchQuery);

    if (searchQuery === '' || searchQueryIdx === -1) return undefined;

    return failureName.substring(searchQueryIdx, searchQueryIdx + searchQuery.length);
  };

  const handleFailureButtonClick = (failureIdentifier: number) => {
    if (!activeFailures.has(failureIdentifier)) {
      activate(failureIdentifier);
    } else {
      deactivate(failureIdentifier);
    }
  };

  return (
    <div className="space-y-2">
      <h2>{title}</h2>

      <div className="grid auto-rows-auto grid-cols-4">
        {failures.map((failure, index) => (
          <FailureButton
            key={failure.identifier}
            name={failure.name}
            isActive={activeFailures.has(failure.identifier)}
            highlightedTerm={getHighlightedTerm(failure.name)}
            onClick={() => handleFailureButtonClick(failure.identifier)}
            className={`${index && index % 4 !== 0 && 'ml-4'} ${index >= 4 && 'mt-4'} h-36`}
          />
        ))}
      </div>
    </div>
  );
};

interface CompactUIProps {
  chapters: AtaChapterNumber[];
  failures: Failure[];
}

export const CompactUI = ({ chapters, failures }: CompactUIProps) => {
  const { allFailures, activeFailures } = useFailuresOrchestrator();
  const { searchQuery } = useAppSelector((state) => state.failuresPage);

  return (
    <ScrollableContainer height={48}>
      <div className="space-y-8">
        {searchQuery.length === 0 && activeFailures.size !== 0 && (
          <FailureGroup
            title="Active Failures"
            failures={allFailures.filter((failure) => activeFailures.has(failure.identifier))}
          />
        )}
        {chapters.map((chapter) => (
          <FailureGroup
            key={chapter}
            title={AtaChaptersTitle[chapter]}
            failures={failures.filter((failure) => failure.ata === chapter)}
          />
        ))}
        {failures.length === 0 && (
          <div
            className="flex items-center justify-center rounded-md border-2 border-theme-accent"
            style={{ height: '48rem' }}
          >
            <p>{t('Failures.NoItemsFound')}</p>
          </div>
        )}
      </div>
    </ScrollableContainer>
  );
};
