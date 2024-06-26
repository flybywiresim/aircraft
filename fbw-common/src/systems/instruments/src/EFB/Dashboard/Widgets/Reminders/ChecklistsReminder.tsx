// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { useSimVar } from '@flybywiresim/fbw-sdk';
import React, { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { t } from '@flybywiresim/flypad';
import {
  areAllChecklistItemsCompleted,
  getChecklistCompletion,
  setSelectedChecklistIndex,
  TrackingChecklist,
} from '../../../Store/features/checklists';
import { RemindersSection } from './RemindersSection';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { getRelevantChecklistIndices } from '../../../Checklists/Checklists';

interface ChecklistReminderCardProps {
  checklist: TrackingChecklist;
  checklistIndex: number;
  className?: string;
}

const ChecklistReminderCard = ({ checklist, checklistIndex, className }: ChecklistReminderCardProps) => {
  const dispatch = useAppDispatch();

  let color = 'text-theme-highlight';

  if (areAllChecklistItemsCompleted(checklistIndex)) {
    if (checklist.markedCompleted) {
      color = 'text-colors-lime-400';
    } else {
      color = 'text-colors-orange-400';
    }
  }

  return (
    <Link
      to="/checklists"
      className={`relative mt-4 flex flex-col flex-wrap overflow-hidden rounded-md bg-theme-accent px-2 pb-2 pt-3 ${color} ${className}`}
      onClick={() => {
        dispatch(setSelectedChecklistIndex(checklistIndex));
      }}
    >
      <div className="absolute left-0 top-0 h-1.5 w-full flex-row bg-theme-secondary text-current">
        <div
          className="h-full bg-current text-current"
          style={{
            width: `${getChecklistCompletion(checklistIndex) * 100}%`,
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      <h2 className="font-bold">{checklist.name}</h2>

      {checklist.markedCompleted ? (
        <Check className="text-colors-lime-400 ml-auto mt-auto" size={28} />
      ) : (
        <ArrowRight className="ml-auto mt-auto text-current" />
      )}
    </Link>
  );
};

export const ChecklistsReminder = () => {
  const { checklists } = useAppSelector((state) => state.trackingChecklists);

  const relevantChecklistIndices = getRelevantChecklistIndices();
  const [relevantChecklists, setRelevantChecklists] = useState(
    [...checklists].filter((_, clIndex) => relevantChecklistIndices.includes(clIndex)),
  );

  const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'Enum', 1000);

  useEffect(() => {
    setRelevantChecklists([...checklists].filter((_, clIndex) => relevantChecklistIndices.includes(clIndex)));
  }, [flightPhase]);

  return (
    <RemindersSection title={t('Dashboard.ImportantInformation.Checklists.Title')} pageLinkPath="/checklists">
      {relevantChecklists.length ? (
        <div className="grid grid-cols-2">
          {relevantChecklists.map((checklist, index) => (
            <ChecklistReminderCard
              key={checklist.name}
              checklist={checklist}
              checklistIndex={checklists.findIndex((cl) => cl.name === checklist.name)}
              className={`${index && index % 2 !== 0 && 'ml-4'}`}
            />
          ))}
        </div>
      ) : (
        <h1 className="m-auto my-4 text-center font-bold opacity-60">
          {t('Dashboard.ImportantInformation.Checklists.NoRelevantChecklists')}
        </h1>
      )}
    </RemindersSection>
  );
};
