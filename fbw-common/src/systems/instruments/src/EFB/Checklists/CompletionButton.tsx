// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { t, useAppDispatch, useAppSelector } from '@flybywiresim/flypad';
import { usePersistentNumberProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import React, { useEffect } from 'react';
import { ChecklistJsonDefinition } from '@flybywiresim/checklists';

import {
    areAllChecklistItemsCompleted,
    setChecklistCompletion,
    setChecklistItemCompletion,
    setSelectedChecklistIndex,
} from '../Store/features/checklists';

interface CompletionButtonProps {
    acl: ChecklistJsonDefinition[];
}

export const CompletionButton = ({ acl }: CompletionButtonProps) => {
    const dispatch = useAppDispatch();

    const { selectedChecklistIndex, checklists } = useAppSelector((state) => state.trackingChecklists);
    const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);
    const [completeItemVar, setCompleteItemVar] = useSimVar('L:A32NX_EFB_CHECKLIST_COMPLETE_ITEM', 'bool', 200);

    const firstIncompleteIdx = checklists[selectedChecklistIndex].items.findIndex((item, index) => {
        const checklistItem = acl[selectedChecklistIndex].items[index];
        // skip line items
        if (checklistItem.type !== undefined && checklistItem.type === 'LINE') {
            return false;
        }
        // Let's go ahead and skip checklist items that have a completion-determination function as those can't be manually checked.
        if (autoFillChecklists) {
            return !item.completed && !checklistItem.condition;
        }
        return !item.completed;
    });

    useEffect(() => {
        setCompleteItemVar(false);
    }, []);

    // allows the completion button to be used via LVar - if the LVar is set to true, the button will be clicked,
    // and the LVar will be reset to false
    useEffect(() => {
        if (completeItemVar) {
            setCompleteItemVar(false);

            if (checklists[selectedChecklistIndex].markedCompleted && selectedChecklistIndex < checklists.length - 1) {
                dispatch(setSelectedChecklistIndex(selectedChecklistIndex + 1));
            } else if (firstIncompleteIdx !== -1) {
                dispatch(setChecklistItemCompletion({
                    checklistIndex: selectedChecklistIndex,
                    itemIndex: firstIncompleteIdx,
                    completionValue: true,
                }));
            } else if (areAllChecklistItemsCompleted(selectedChecklistIndex)) {
                dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: true }));
            }
        }
    }, [completeItemVar]);

    if (checklists[selectedChecklistIndex].markedCompleted) {
        if (selectedChecklistIndex < checklists.length - 1) {
            return (
                <div
                    className="flex w-full items-center justify-center rounded-md border-2 border-theme-highlight
                               bg-theme-body py-2 text-center font-bold text-theme-highlight transition duration-100
                               hover:bg-theme-highlight hover:text-theme-body"
                    onClick={() => {
                        dispatch(setSelectedChecklistIndex(selectedChecklistIndex + 1));
                    }}
                >
                    {t('Checklists.ProceedToNextChecklist')}
                </div>
            );
        }

        return (
            <div
                className="flex w-full items-center justify-center rounded-md border-2 border-theme-highlight
                           bg-theme-body py-2 text-center font-bold text-theme-highlight"
            >
                {t('Checklists.TheLastChecklistIsComplete')}
            </div>
        );
    }

    if (firstIncompleteIdx !== -1) {
        return (
            <div
                className="flex w-full items-center justify-center rounded-md border-2 border-utility-green
                           bg-theme-body py-2 text-center font-bold text-utility-green transition duration-100
                           hover:bg-utility-green hover:text-theme-body"
                onClick={() => {
                    dispatch(setChecklistItemCompletion({
                        checklistIndex: selectedChecklistIndex,
                        itemIndex: firstIncompleteIdx,
                        completionValue: true,
                    }));
                }}
            >
                {t('Checklists.MarkItemAsComplete')}
            </div>
        );
    }

    if (areAllChecklistItemsCompleted(selectedChecklistIndex)) {
        return (
            <div
                className="flex w-full items-center justify-center rounded-md border-2 border-utility-green
                           bg-theme-body py-2 text-center font-bold text-utility-green transition duration-100
                           hover:bg-utility-green hover:text-theme-body"
                onClick={() => {
                    dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: true }));
                }}
            >
                {t('Checklists.MarkChecklistAsComplete')}
            </div>
        );
    }

    return (
        <div
            className="flex w-full items-center justify-center rounded-md border-2 border-utility-green
                       bg-theme-body py-2 text-center font-bold text-utility-green"
        >
            {t('Checklists.ThereAreRemainingAutofillChecklistItemsThatHaveNotYetBeenCompleted')}
        </div>
    );
};
