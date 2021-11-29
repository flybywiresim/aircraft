import { IconCheck, IconRepeat } from "@tabler/icons";
import React from "react";
import {
    ChecklistItem,
    CheckListItem,
    ChecklistItemState,
} from "./ChecklistItem";

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
        let newState = itemStates[idx];
        newState.checked = !newState.checked;
        setItemState(idx, newState);
    };

    const toggleItemOverwriteState = (idx: number) => {
        let newState = itemStates[idx];
        if (false === newState.checked) {
            newState.overwritten = !newState.overwritten;
            newState.checked = true;
            setItemState(idx, newState);
        }
    };

    const allItemsChecked =
        itemStates.findIndex((it) => false === it.checked) == -1;

    const itemTags = items.map((it, idx) => {
        return (
            <CheckListItem
                isChecklistComplete={isChecklistComplete}
                clItem={it}
                itemState={itemStates[idx]}
                toggleItemCheckStatus={() => toggleItemCheckState(idx)}
                toggleItemOverwriteStatus={() => toggleItemOverwriteState(idx)}
            />
        );
    });

    return (
        <>
            <div className="w-full h-full">
                <br />
                <ol className="w-full text-white text-2xl">{itemTags}</ol>
                <br />
                {true === allItemsChecked && false === isChecklistComplete && (
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => setChecklistComplete()}
                            className="mr-1 w-1/3 text-white bg-teal-light p-2 flex items-center justify-center rounded-lg focus:outline-none text-2xl"
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
                {true === isChecklistComplete && (
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => resetChecklist()}
                            className="mr-1 w-1/3 text-red-600 bg-teal-light p-2 flex items-center justify-center rounded-lg focus:outline-none text-2xl"
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
