import React from 'react';
import useInterval from '@instruments/common/useInterval';
import { ChecklistPage } from './ChecklistsPage';
import { CHECKLISTS } from './Lists';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import {
    isChecklistCompleted,
    setChecklistItemCompletion,
    setChecklistItems,
    setSelectedChecklistIndex,
} from '../Store/features/checklists';
import { useAppDispatch, store, useAppSelector } from '../Store/store';

CHECKLISTS.forEach((checklist, index) => {
    store.dispatch(setChecklistItems({
        checklistIndex: index,
        itemArr: checklist.items.map((item) => {
            if (item.divider) {
                return { completed: true };
            }
            return { completed: false };
        }),
    }));
});

export interface Checklist {
    name: string;
    items: {
        item: string;
        result: string;
        condition?: () => boolean;
        divider?: boolean;
    }[]
}

export const Checklists = () => {
    const dispatch = useAppDispatch();

    // Checklist conditions have to be evaluated everytime in the same order as the conditions uses useSimVar and this
    // makes use of useState() that always needs to be called in the same order for each redraw
    const setAutomaticItemStates = () => {
        CHECKLISTS.forEach((cl, clIdx) => {
            cl.items.forEach((it, itIdx) => {
                if (it.condition !== undefined) {
                    const condEval = it.condition();
                    if (!isChecklistCompleted(clIdx)) { // do not overwrite status for completed checklists
                        dispatch(setChecklistItemCompletion({ checklistIndex: clIdx, itemIndex: itIdx, completionValue: condEval }));
                    }
                }
            });
        });
    };
    useInterval(setAutomaticItemStates, 3_000);

    const handleClick = (index: number) => {
        dispatch(setSelectedChecklistIndex(index));
    };

    const { selectedChecklistIndex } = useAppSelector((state) => state.checklists);

    const getTabClassName = (index: number) => {
        if (index === selectedChecklistIndex && isChecklistCompleted(index)) {
            return 'bg-colors-lime-400 text-theme-body border-colors-lime-400';
        }
        if (index === selectedChecklistIndex) {
            return 'bg-theme-highlight text-theme-body border-theme-highlight';
        }
        if (isChecklistCompleted(index)) {
            return 'bg-theme-body border-colors-lime-400 text-colors-lime-400';
        }
        return 'bg-theme-accent border-theme-accent text-theme-text hover:bg-theme-highlight hover:text-theme-body';
    };

    return (
        <>
            <h1 className="mb-4 font-bold">Checklists</h1>
            <div className="flex flex-row space-x-6">
                <div className="flex-shrink-0 w-1/4">
                    <ScrollableContainer height={51}>
                        <div className="space-y-4">
                            {CHECKLISTS.map((cl, index) => (
                                <div
                                    className={`flex justify-center items-center w-full h-12 rounded-md border transition duration-100 ${getTabClassName(index)}`}
                                    onClick={() => handleClick(index)}
                                >
                                    {cl.name}
                                </div>
                            ))}
                        </div>
                    </ScrollableContainer>
                </div>
                <ChecklistPage />
            </div>
        </>
    );
};
