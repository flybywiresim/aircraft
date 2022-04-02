/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { CheckLg, Link45deg } from 'react-bootstrap-icons';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { toast } from 'react-toastify';
import { useSimVar } from '@instruments/common/simVars';
import { useTranslation } from 'react-i18next';
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
            className={`flex flex-row items-center py-2 space-x-4 ${color}`}
            onClick={handleChecklistItemClick}
        >
            {item.item && (
                <div
                    className="flex flex-shrink-0 justify-center items-center w-8 h-8 text-current border-4 border-current"
                >
                    {!!autoFillChecklists && item.condition && (
                        <Link45deg size={40} className={`${!autoCheckable && 'opacity-40'} ${checklistShake && 'shake text-utility-red'}`} />
                    )}
                    {(isItemCompleted && (!autoFillChecklists || (autoFillChecklists && !item.condition))) && (
                        <CheckLg size={40} />
                    )}
                </div>
            )}
            <div className="flex flex-row items-end w-full text-current">
                <div className="text-current whitespace-nowrap">
                    {item.item}
                    {isItemCompleted && ':'}
                </div>
                <div className={`h-0.5 mb-1.5 text-current bg-current ${isItemCompleted ? 'w-0 mx-2' : 'w-full mx-4'}`} />
                <div className="text-current whitespace-nowrap">
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

    const { t } = useTranslation();

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
                    className="flex justify-center items-center py-2 w-full rounded-md border-2 transition duration-100 text-theme-highlight hover:text-theme-body bg-theme-body hover:bg-theme-highlight border-theme-highlight"
                    onClick={() => {
                        dispatch(setSelectedChecklistIndex(selectedChecklistIndex + 1));
                    }}
                >
                    {t('Checklists.ProceedToNextChecklist')}
                </div>
            );
        }

        return (
            <div className="flex justify-center items-center py-2 w-full rounded-md border-2 text-theme-highlight bg-theme-body border-theme-highlight">
                {t('Checklists.TheLastChecklistIsComplete')}
            </div>
        );
    }

    if (firstIncompleteIdx !== -1) {
        return (
            <div
                className="flex justify-center items-center py-2 w-full font-bold rounded-md border-2 transition duration-100 text-utility-green hover:text-theme-body bg-theme-body hover:bg-utility-green border-utility-green"
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
                className="flex justify-center items-center py-2 w-full rounded-md border-2 transition duration-100 text-utility-green hover:text-theme-body bg-theme-body hover:bg-utility-green border-utility-green"
                onClick={() => {
                    dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: true }));
                }}
            >
                {t('Checklists.MarkChecklistAsComplete')}
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center py-2 w-full rounded-md border-2 text-utility-green bg-theme-body border-utility-green">
            {t('Checklist.ThereAreRemainingAutofillChecklistItemsThatHaveNotYetBeenCompleted')}
        </div>
    );
};

export const ChecklistPage = () => {
    const { selectedChecklistIndex } = useAppSelector((state) => state.trackingChecklists);

    return (
        <div className="flex overflow-visible flex-col justify-between p-8 w-full rounded-lg border-2 border-theme-accent">
            <ScrollableContainer innerClassName="space-y-4" height={46}>
                {CHECKLISTS[selectedChecklistIndex].items.map((it, index) => (
                    <ChecklistItemComponent item={it} index={index} />
                ))}
            </ScrollableContainer>

            <CompletionButton />
        </div>
    );
};
