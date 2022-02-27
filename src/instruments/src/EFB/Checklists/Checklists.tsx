/* eslint-disable max-len */
import React, { useEffect } from 'react';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { ChecklistPage } from './ChecklistsPage';
import { CHECKLISTS } from './Lists';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import {
    areAllChecklistItemsCompleted,
    setChecklistCompletion, setChecklistItemCompletion,
    setSelectedChecklistIndex,
} from '../Store/features/checklists';
import { RootState, store, useAppDispatch, useAppSelector } from '../Store/store';
import { PromptModal, useModals } from '../UtilComponents/Modals/Modals';

export interface ChecklistItem {
    item: string;
    result: string;
    condition?: () => boolean;
}

export interface ChecklistDefinition {
    name: string;
    items: ChecklistItem[]
}

export const setAutomaticItemStates = () => {
    const checklists = (store.getState() as RootState).trackingChecklists.checklists;
    const firstUnmarkedIdx = checklists.findIndex((cl) => !cl.markedCompleted);

    if (firstUnmarkedIdx === -1) return;

    CHECKLISTS[firstUnmarkedIdx].items.forEach((clItem, itemIdx) => {
        const associatedTrackingItem = checklists[firstUnmarkedIdx].items[itemIdx];

        if (!clItem.condition || !associatedTrackingItem) return;

        store.dispatch(setChecklistItemCompletion({
            checklistIndex: firstUnmarkedIdx,
            itemIndex: itemIdx,
            completionValue: clItem.condition(),
        }));
    });
};

export const Checklists = () => {
    const dispatch = useAppDispatch();

    const handleClick = (index: number) => {
        dispatch(setSelectedChecklistIndex(index));
    };

    const { selectedChecklistIndex, checklists } = useAppSelector((state) => state.trackingChecklists);

    const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);

    const getTabClassName = (index: number) => {
        if (index === selectedChecklistIndex) {
            if (areAllChecklistItemsCompleted(index)) {
                if (checklists[index].markedCompleted) {
                    return 'bg-colors-lime-400 text-theme-body';
                }

                return 'bg-colors-orange-400 text-theme-body';
            }

            return 'bg-theme-highlight text-theme-body';
        }

        if (areAllChecklistItemsCompleted(index)) {
            if (checklists[index].markedCompleted) {
                return 'bg-theme-body border-2 border-colors-lime-400 text-colors-lime-400 hover:text-theme-body hover:bg-colors-lime-400';
            }

            return 'bg-theme-body border-2 border-colors-orange-400 text-colors-orange-400 hover:text-theme-body hover:bg-colors-orange-400';
        }

        return 'bg-theme-accent border-2 border-theme-accent text-theme-text hover:bg-theme-highlight hover:text-theme-body';
    };

    useEffect(() => {
        if (!autoFillChecklists) return;

        setAutomaticItemStates();
    }, [selectedChecklistIndex]);

    const modals = useModals();

    return (
        <>
            <h1 className="mb-4 font-bold">Checklists</h1>
            <div className="flex flex-row space-x-6 h-content-section-reduced">
                <div className="flex flex-col flex-shrink-0 justify-between w-1/4">
                    <ScrollableContainer height={46}>
                        <div className="space-y-4">
                            {CHECKLISTS.map((cl, index) => (
                                <div
                                    className={`flex justify-center items-center w-full h-12 rounded-md transition duration-100 ${getTabClassName(index)}`}
                                    onClick={() => handleClick(index)}
                                >
                                    {cl.name}
                                </div>
                            ))}
                        </div>
                    </ScrollableContainer>

                    <div
                        className="flex justify-center items-center h-12 text-red-500 hover:text-theme-body bg-theme-body hover:bg-red-500 rounded-md border-2 border-red-500 transition duration-100"
                        onClick={() => {
                            modals.showModal(
                                <PromptModal
                                    title="Checklist Reset Warning"
                                    bodyText="Are you sure to reset all checklists?"
                                    onConfirm={() => {
                                        checklists.forEach((cl, clIndex) => {
                                            cl.items.forEach((_, itemIdx) => {
                                                if (autoFillChecklists && CHECKLISTS[clIndex].items[itemIdx].condition) {
                                                    return;
                                                }
                                                dispatch(setChecklistItemCompletion({ checklistIndex: clIndex, itemIndex: itemIdx, completionValue: false }));
                                            });
                                            dispatch(setChecklistCompletion({ checklistIndex: clIndex, completion: false }));
                                        });
                                    }}
                                />,
                            );
                        }}
                    >
                        Reset All
                    </div>

                    <div
                        className="flex justify-center items-center h-12 text-red-500 hover:text-theme-body bg-theme-body hover:bg-red-500 rounded-md border-2 border-red-500 transition duration-100"
                        onClick={() => {
                            checklists[selectedChecklistIndex].items.forEach((_, itemIdx) => {
                                if (autoFillChecklists && CHECKLISTS[selectedChecklistIndex].items[itemIdx].condition) {
                                    return;
                                }
                                dispatch(setChecklistItemCompletion({ checklistIndex: selectedChecklistIndex, itemIndex: itemIdx, completionValue: false }));
                            });
                            dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: false }));
                        }}
                    >
                        Reset Checklist
                    </div>
                </div>

                <ChecklistPage />
            </div>
        </>
    );
};
