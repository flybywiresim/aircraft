// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { CheckLg, Link45deg } from 'react-bootstrap-icons';
import { usePersistentNumberProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import { toast } from 'react-toastify';
import { t } from '../Localization/translation';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import {
    areAllChecklistItemsCompleted,
    setChecklistCompletion,
    setChecklistItemCompletion,
    setSelectedChecklistIndex,
} from '../Store/features/checklists';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { CHECKLISTS } from './Lists';
import { ChecklistItem, getRelevantChecklistIndices } from './Checklists';

interface ChecklistItemComponentProps {
    item: ChecklistItem;
    index: number;
}

const ChecklistItemComponent = ({ item, index }: ChecklistItemComponentProps) => {
    const dispatch = useAppDispatch();
    const [checklistShake, setChecklistShake] = useState(false);
    const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);
    const { selectedChecklistIndex, checklists } = useAppSelector((state) => state.trackingChecklists);
    const isItemCompleted = checklists[selectedChecklistIndex].items[index]?.completed;

    const firstIncompleteIdx = checklists[selectedChecklistIndex].items.findIndex((item) => {
        if (autoFillChecklists) {
            return !item.completed && !item.hasCondition;
        }

        return !item.completed;
    });

    const itemCheckedAfterIncomplete = checklists[selectedChecklistIndex].items
        .slice(firstIncompleteIdx)
        .some((item) => item.completed && (autoFillChecklists ? !item.hasCondition : true));

    const itemImproperlyUnchecked = index === firstIncompleteIdx && itemCheckedAfterIncomplete;

    let color = 'text-theme-text';

    if (isItemCompleted) {
        color = 'text-utility-green';
    }

    if (itemImproperlyUnchecked) {
        color = 'text-utility-red';
    }

    const [autoItemTouches, setAutoItemTouches] = useState(0);

    useEffect(() => {
        if (autoItemTouches === 5) {
            toast.info('You cannot interact with this item because you have enabled the autofill checklist option in the Realism settings page.');
            setAutoItemTouches(0);
        }
    }, [autoItemTouches]);

    const relevantChecklistIndices = getRelevantChecklistIndices();
    const firstRelevantUnmarkedIdx = checklists.findIndex((cl, clIndex) => relevantChecklistIndices.includes(clIndex) && !cl.markedCompleted);
    const autoCheckable = selectedChecklistIndex >= firstRelevantUnmarkedIdx && autoFillChecklists;

    const handleChecklistItemClick = () => {
        if (item.condition && autoCheckable) {
            setAutoItemTouches((old) => old + 1);
            setChecklistShake(true);
            setTimeout(() => {
                setChecklistShake(false);
            }, 1000);
            return;
        }

        dispatch(setChecklistItemCompletion({
            checklistIndex: selectedChecklistIndex,
            itemIndex: index,
            completionValue: !isItemCompleted,
        }));

        if (isItemCompleted) {
            dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: false }));
        }
    };

    return (
        <div
            className={`flex flex-row items-center space-x-4 py-2 ${color}`}
            onClick={handleChecklistItemClick}
        >
            {item.item && (
                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center border-4 border-current text-current"
                >
                    {!!autoFillChecklists && item.condition && (
                        <Link45deg size={40} className={`${!autoCheckable && 'opacity-40'} ${checklistShake && 'shake text-utility-red'}`} />
                    )}
                    {(isItemCompleted && (!autoFillChecklists || (autoFillChecklists && !item.condition))) && (
                        <CheckLg size={40} />
                    )}
                </div>
            )}
            <div className="flex w-full flex-row items-end text-current">
                <div className="whitespace-nowrap text-current">
                    {item.item}
                    {isItemCompleted && ':'}
                </div>
                <div className={`mb-1.5 h-0.5 bg-current text-current ${isItemCompleted ? 'mx-2 w-0' : 'mx-4 w-full'}`} />
                <div className="whitespace-nowrap text-current">
                    {item.result}
                </div>
            </div>
        </div>
    );
};

const CompletionButton = () => {
    const dispatch = useAppDispatch();

    const { selectedChecklistIndex, checklists } = useAppSelector((state) => state.trackingChecklists);
    const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);
    const [completeItemVar, setCompleteItemVar] = useSimVar('L:A32NX_EFB_CHECKLIST_COMPLETE_ITEM', 'bool', 200);

    const firstIncompleteIdx = checklists[selectedChecklistIndex].items.findIndex((item, index) => {
        // Let's go ahead and skip checklist items that have a completion-determination function as those can't be manually checked.
        if (autoFillChecklists) {
            return !item.completed && !CHECKLISTS[selectedChecklistIndex].items[index].condition;
        }

        return !item.completed;
    });

    useEffect(() => {
        setCompleteItemVar(false);
    }, []);

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
                    className="flex w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-body py-2 text-center font-bold text-theme-highlight transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                    onClick={() => {
                        dispatch(setSelectedChecklistIndex(selectedChecklistIndex + 1));
                    }}
                >
                    {t('Checklists.ProceedToNextChecklist')}
                </div>
            );
        }

        return (
            <div className="flex w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-body py-2 text-center font-bold text-theme-highlight">
                {t('Checklists.TheLastChecklistIsComplete')}
            </div>
        );
    }

    if (firstIncompleteIdx !== -1) {
        return (
            <div
                className="flex w-full items-center justify-center rounded-md border-2 border-utility-green bg-theme-body py-2 text-center font-bold text-utility-green transition duration-100 hover:bg-utility-green hover:text-theme-body"
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
                className="flex w-full items-center justify-center rounded-md border-2 border-utility-green bg-theme-body py-2 text-center font-bold text-utility-green transition duration-100 hover:bg-utility-green hover:text-theme-body"
                onClick={() => {
                    dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: true }));
                }}
            >
                {t('Checklists.MarkChecklistAsComplete')}
            </div>
        );
    }

    return (
        <div className="flex w-full items-center justify-center rounded-md border-2 border-utility-green bg-theme-body py-2 text-center font-bold text-utility-green">
            {t('Checklists.ThereAreRemainingAutofillChecklistItemsThatHaveNotYetBeenCompleted')}
        </div>
    );
};

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
