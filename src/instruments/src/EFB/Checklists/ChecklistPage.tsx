import { IconCheck, IconRepeat } from '@tabler/icons';
import React from 'react';
import {
    ChecklistItem,
    CheckListItem,
    ChecklistItemState,
} from './ChecklistItem';

export type ChecklistState = {
    itemStates: ChecklistItemState[];
};

export type Checklist = {
    name: string;
    items: ChecklistItem[];
};

export type ChecklistPageProps = {
    items: ChecklistItem[];
    itemStates: ChecklistItemState[];
    setItemState: { (itemIndex: number, newItem: ChecklistItemState): void };
    isChecklistComplete: boolean;
    setChecklistComplete: { (): void };
    resetChecklist: { (): void };
};

export const ChecklistPage = (props: ChecklistPageProps) => {
    const {
        items,
        itemStates,
        setItemState,
        isChecklistComplete,
        setChecklistComplete,
        resetChecklist,
    } = props;

    const toggleItemCheckState = (idx: number) => {
        const newState = itemStates[idx];
        newState.checked = !newState.checked;
        setItemState(idx, newState);
    };

    const toggleItemOverwriteState = (idx: number) => {
        const newState = itemStates[idx];
        if (newState.checked === false) {
            newState.overwritten = !newState.overwritten;
            newState.checked = true;
            setItemState(idx, newState);
        }
    };

    const allItemsChecked = itemStates.findIndex((it) => it.checked === false) === -1;

    const itemTags = items.map((it, idx) => (
        <CheckListItem
            isChecklistComplete={isChecklistComplete}
            clItem={it}
            itemState={itemStates[idx]}
            toggleItemCheckStatus={() => toggleItemCheckState(idx)}
            toggleItemOverwriteStatus={() => toggleItemOverwriteState(idx)}
        />
    ));

    return (
        <>
            <div className="w-full h-full">
                <br />
                <ol className="w-full text-2xl text-white">{itemTags}</ol>
                <br />
                <div className="flex justify-center">
                    <span className="endTag">=== END ===</span>
                </div>
                <br />
                {allItemsChecked === true && isChecklistComplete === false && (
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => setChecklistComplete()}
                            className="flex justify-center items-center p-2 mr-1 w-1/3 text-2xl text-white rounded-lg focus:outline-none bg-teal-light"
                        >
                            <IconCheck
                                className="mr-2"
                                size={48}
                                stroke={1.5}
                                strokeLinejoin="miter"
                            />
                            CHECKLIST COMPLETE
                        </button>
                    </div>
                )}
                {isChecklistComplete === true && (
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => resetChecklist()}
                            className="flex justify-center items-center p-2 mr-1 w-1/3 text-2xl text-red-600 rounded-lg focus:outline-none bg-teal-light"
                        >
                            <IconRepeat
                                className="mr-2"
                                size={48}
                                stroke={2}
                                strokeLinejoin="miter"
                            />
                            <strong>RESET CHECKLIST</strong>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
