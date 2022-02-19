import React, { useState } from 'react';
import { CheckLg, LockFill } from 'react-bootstrap-icons';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import {
    areAllChecklistItemsCompleted,
    setChecklistCompletion,
    setChecklistItemCompletion,
    setSelectedChecklistIndex,
} from '../Store/features/checklists';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { CHECKLISTS } from './Lists';
import { ChecklistItem } from './Checklists';

interface ChecklistItemProps {
    item: ChecklistItem;
    index: number;
}

const ChecklistItemComponent = ({ item, index }: ChecklistItemProps) => {
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
        .some((item) => item.completed && !item.divider && (autoFillChecklists ? !item.hasCondition : true));

    const itemImproperlyUnchecked = index === firstIncompleteIdx && itemCheckedAfterIncomplete;

    let color = 'text-white';

    if (isItemCompleted) {
        color = 'text-colors-lime-400';
    }

    if (itemImproperlyUnchecked) {
        color = 'text-red-500';
    }

    return (
        <div
            className={`flex flex-row items-center py-2 space-x-4 ${color}`}
            onClick={() => {
                if (item.condition && autoFillChecklists) {
                    setChecklistShake(true);
                    setTimeout(() => {
                        setChecklistShake(false);
                    }, 1000);
                    return;
                }

                if (!item.divider) {
                    dispatch(setChecklistItemCompletion({
                        checklistIndex: selectedChecklistIndex,
                        itemIndex: index,
                        completionValue: !isItemCompleted,
                    }));

                    if (isItemCompleted) {
                        dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: false }));
                    }
                }
            }}
        >
            {item.item && (
                <div
                    className="flex flex-shrink-0 justify-center items-center w-8 h-8 text-current border-4 border-current"
                >
                    {(!!autoFillChecklists && item.condition) && (
                        <LockFill size={40} className={`${checklistShake && 'shake text-red-500'}`} />
                    )}
                    {(isItemCompleted && (!autoFillChecklists || (autoFillChecklists && !item.condition))) && (
                        <CheckLg size={40} />
                    )}
                </div>
            )}
            <div className="flex flex-row items-center w-full text-current">
                <div className="text-current whitespace-nowrap">
                    {item.item}
                </div>
                <div className={`w-full h-1 text-current ${item.item && 'mx-4'} ${(item.divider) ? 'bg-white' : 'bg-current'}`} />
                <div className="text-current whitespace-nowrap">
                    {item.result}
                </div>
            </div>
        </div>
    );
};

const CompletionButton = () => {
    const { selectedChecklistIndex, checklists } = useAppSelector((state) => state.trackingChecklists);
    const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);

    const firstIncompleteIdx = checklists[selectedChecklistIndex].items.findIndex((item, index) => {
        // Let's go ahead and skip checklist items that have a completion-determination function as those can't be manually checked.
        if (autoFillChecklists) {
            return !item.completed && !CHECKLISTS[selectedChecklistIndex].items[index].condition;
        }

        return !item.completed;
    });

    const dispatch = useAppDispatch();

    if (checklists[selectedChecklistIndex].markedCompleted) {
        if (selectedChecklistIndex < checklists.length - 1) {
            return (
                <div
                    className="flex justify-center items-center py-2 w-full text-theme-highlight hover:text-theme-body bg-theme-body hover:bg-theme-highlight rounded-md border-2 border-theme-highlight transition duration-100"
                    onClick={() => {
                        dispatch(setSelectedChecklistIndex(selectedChecklistIndex + 1));
                    }}
                >
                    Proceed to next checklist
                </div>
            );
        }

        return (
            <div className="flex justify-center items-center py-2 w-full text-theme-highlight bg-theme-body rounded-md border-2 border-theme-highlight">
                The last checklist is complete
            </div>
        );
    }

    if (firstIncompleteIdx !== -1) {
        return (
            <div
                className="flex justify-center items-center py-2 w-full hover:text-theme-body bg-theme-body rounded-md border-2 transition duration-100 border-colors-lime-400 hover:bg-colors-lime-400 text-colors-lime-400"
                onClick={() => {
                    dispatch(setChecklistItemCompletion({
                        checklistIndex: selectedChecklistIndex,
                        itemIndex: firstIncompleteIdx,
                        completionValue: true,
                    }));
                }}
            >
                Mark item as complete
            </div>
        );
    }

    if (areAllChecklistItemsCompleted(selectedChecklistIndex)) {
        return (
            <div
                className="flex justify-center items-center py-2 w-full hover:text-theme-body bg-theme-body rounded-md border-2 transition duration-100 border-colors-lime-400 hover:bg-colors-lime-400 text-colors-lime-400"
                onClick={() => {
                    dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: true }));
                }}
            >
                Mark checklist as complete
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center py-2 w-full bg-theme-body rounded-md border-2 border-colors-lime-400 text-colors-lime-400">
            There are remaining autofill checklist items that have not yet been completed
        </div>
    );
};

export const ChecklistPage = () => {
    const { selectedChecklistIndex } = useAppSelector((state) => state.trackingChecklists);

    return (
        <div className="flex overflow-visible flex-col justify-between p-8 w-full h-efb rounded-lg border-2 border-theme-accent">
            <ScrollableContainer height={46}>
                <div className="space-y-4">
                    {CHECKLISTS[selectedChecklistIndex].items.map((it, index) => (
                        <ChecklistItemComponent item={it} index={index} />
                    ))}
                </div>
            </ScrollableContainer>

            <CompletionButton />
        </div>
    );
};
