import React from 'react';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { setChecklistItemCompletion } from '../Store/features/checklists';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { CHECKLISTS } from './Lists';

export const ChecklistPage = () => {
    const { checklists, selectedChecklistIndex } = useAppSelector((state) => state.checklists);
    const dispatch = useAppDispatch();

    return (
        <div className="p-12 w-full h-efb rounded-lg border-2 border-theme-accent">
            <ScrollableContainer height={51}>
                <div className="space-y-6">
                    {CHECKLISTS[selectedChecklistIndex].items.map((it, index) => (
                        <div
                            className="flex flex-row items-center space-x-4"
                            onClick={() => {
                                if (it.item) {
                                    dispatch(setChecklistItemCompletion({
                                        checklistIndex: selectedChecklistIndex,
                                        itemIndex: index,
                                        completionValue: !checklists[selectedChecklistIndex].items[index].completed,
                                    }));
                                }
                            }}
                        >
                            {it.item && (
                                <div
                                    className={`flex-shrink-0 border-4 w-8 h-8 ${checklists[selectedChecklistIndex].items[index].completed
                                        ? 'border-colors-lime-400'
                                        : 'border-white'}`}
                                />
                            )}
                            <div className={`flex flex-row items-center w-full ${checklists[selectedChecklistIndex].items[index].completed
                                ? 'text-colors-lime-400'
                                : 'text-white'}`}
                            >
                                <div className="text-current whitespace-nowrap">
                                    {it.item}
                                </div>
                                <div className={`w-full h-1 ${it.item && 'mx-4'} ${(checklists[selectedChecklistIndex].items[index].completed && !it.divider)
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
