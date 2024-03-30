// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';
import { ScrollableContainer } from '@flybywiresim/flypad';
import { ChecklistDefinition, getAircraftChecklists } from '@flybywiresim/checklists';
import { useAppSelector } from '../Store/store';
import { ChecklistItemComponent } from './ChecklistItemComponent';
import { CompletionButton } from './CompletionButton';

const CHECKLISTS:ChecklistDefinition[] = getAircraftChecklists();

export const ChecklistPage = () => {
    const { selectedChecklistIndex } = useAppSelector((state) => state.trackingChecklists);

    return (
        <div className="flex w-full flex-col justify-between overflow-visible rounded-lg border-2 border-theme-accent p-8">
            <ScrollableContainer innerClassName="space-y-4" height={46}>
                {CHECKLISTS[selectedChecklistIndex].items.map((it, index) => (
                    <ChecklistItemComponent
                        key={it.item}
                        item={it}
                        index={index}
                    />
                ))}
            </ScrollableContainer>

            <CompletionButton />
        </div>
    );
};
