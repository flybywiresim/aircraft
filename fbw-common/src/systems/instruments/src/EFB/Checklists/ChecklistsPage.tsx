// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { ScrollableContainer } from '@flybywiresim/flypad';
import { useAppSelector } from '../Store/store';
import { ChecklistItemComponent } from './ChecklistItemComponent';
import { CompletionButton } from './CompletionButton';

export const ChecklistPage = () => {
  const { selectedChecklistIndex, aircraftChecklists } = useAppSelector((state) => state.trackingChecklists);
  return (
    <div className="flex w-full flex-col justify-between overflow-visible rounded-lg border-2 border-theme-accent p-8">
      <ScrollableContainer innerClassName="space-y-4" height={46}>
        {aircraftChecklists[selectedChecklistIndex].items.map((it, index) => (
          <ChecklistItemComponent key={it.item} item={it} index={index} />
        ))}
      </ScrollableContainer>

      <CompletionButton />
    </div>
  );
};
