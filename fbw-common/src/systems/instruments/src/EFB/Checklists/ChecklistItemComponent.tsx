// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { useAppDispatch, useAppSelector } from '@flybywiresim/flypad';
import React, { useEffect, useState } from 'react';
import { usePersistentNumberProperty } from '@flybywiresim/fbw-sdk';
import { toast } from 'react-toastify';
import { CheckLg, Link45deg } from 'react-bootstrap-icons';
import { ChecklistItem } from '@flybywiresim/checklists';
import { getRelevantChecklistIndices } from './Checklists';
import { setChecklistCompletion, setChecklistItemCompletion } from '../Store/features/checklists';

interface ChecklistItemComponentProps {
    item: ChecklistItem;
    index: number;
}

export const ChecklistItemComponent = ({ item, index }: ChecklistItemComponentProps) => {
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

    // convenience variables to make the JSX more readable
    const isLine = item.type !== undefined && item.type === 'LINE';
    const isListItem = item.type === undefined || item.type === 'ITEM';
    const isSublistItem = item.type !== undefined && item.type === 'SUBLISTITEM';
    const isAnyItemType = isListItem || isSublistItem;
    const isSubListHeader = item.type !== undefined && item.type === 'SUBLISTHEADER';

    let color = 'text-theme-text';
    if (isItemCompleted && !isLine) {
        color = 'text-utility-green';
    } else if (itemImproperlyUnchecked && !isLine) {
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
        if (isLine) return; // lines are not clickable

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

    let actionResultString = item.result;
    if (!isItemCompleted && item.action !== undefined) {
        actionResultString = item.action;
    }

    return (
        <div
            className={`flex flex-row items-center space-x-4 py-2 ${isSublistItem ? 'px-12' : 'px-0'} ${color}`}
            onClick={handleChecklistItemClick}
        >
            {item.item && isAnyItemType && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border-4 border-current text-current">
                    {(!!autoFillChecklists && item.condition) && (
                        <Link45deg size={40} className={`${!autoCheckable && 'opacity-40'} ${checklistShake && 'shake text-utility-red'}`} />
                    )}
                    {' '}
                    {(isItemCompleted && (!autoFillChecklists || (autoFillChecklists && !item.condition))) && (
                        <CheckLg size={40} />
                    )}
                </div>
            )}
            {isLine && (
                <div className="flex w-full flex-row items-end text-current">
                    <div className="mx-0 mb-1.5 h-1.5 w-full bg-current text-current" />
                </div>
            )}
            {isSubListHeader && (
                <div className="flex w-full flex-row items-end text-current">
                    <div className="whitespace-nowrap text-2xl">
                        {item.item}
                    </div>
                </div>
            )}
            {!isLine && !isSubListHeader && (
                <div className="flex w-full flex-row items-end text-current">
                    <div className="whitespace-nowrap text-current">
                        {item.item}
                        {' '}
                        {isItemCompleted && ':'}
                    </div>
                    <div className={`mb-1.5 h-0.5 bg-current text-current ${isItemCompleted ? 'mx-2 w-0' : 'mx-4 w-full'}`} />
                    <div className="whitespace-nowrap text-current">
                        {actionResultString}
                    </div>
                </div>
            )}
        </div>
    );
};
