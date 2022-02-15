import React from 'react';
import { CheckLg } from 'react-bootstrap-icons';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { setChecklistItemCompletion } from '../Store/features/checklists';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { CHECKLISTS } from './Lists';

export const ChecklistPage = () => {
    const { checklists, selectedChecklistIndex } = useAppSelector((state) => state.checklists);
    const dispatch = useAppDispatch();

    const isItemCompleted = (itemIndex: number) => checklists[selectedChecklistIndex].items[itemIndex].completed;

    return (
        <div className="p-12 w-full h-efb rounded-lg border-2 border-theme-accent">
            <ScrollableContainer height={51}>
                <div className="space-y-4">
                    {CHECKLISTS[selectedChecklistIndex].items.map((it, index) => (
                        <div
                            className="flex flex-row items-center py-2 space-x-4"
                            onClick={() => {
                                if (it.item) {
                                    dispatch(setChecklistItemCompletion({
                                        checklistIndex: selectedChecklistIndex,
                                        itemIndex: index,
                                        completionValue: !isItemCompleted(index),
                                    }));
                                }
                            }}
                        >
                            {it.item && (
                                <div
                                    className={`flex-shrink-0 flex items-center justify-center border-4 w-8 h-8 ${isItemCompleted(index)
                                        ? 'border-colors-lime-400'
                                        : 'border-white'}`}
                                >
                                    {isItemCompleted(index) && (
                                        <CheckLg size={40} />
                                    )}
                                </div>
                            )}
                            <div className={`flex flex-row items-center w-full ${isItemCompleted(index)
                                ? 'text-colors-lime-400'
                                : 'text-white'}`}
                            >
                                <div className="text-current whitespace-nowrap">
                                    {it.item}
                                </div>
                                <div className={`w-full h-1 ${it.item && 'mx-4'} ${(isItemCompleted(index) && !it.divider)
                                    ? 'bg-colors-lime-400'
                                    : 'bg-white'}`}
                                />
                                <div className="text-current whitespace-nowrap">
                                    {it.result}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollableContainer>
        </div>
    );
};
