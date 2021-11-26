import { IconCheck, IconRepeat } from "@tabler/icons";
import React, { useEffect } from "react";
import { CheckListItem } from "./ChecklistItem";
// import "./Checklist.css";

export type ChecklistState = {
    itemStates: ChecklistItemState[];
};

export type ChecklistItemState = {
    itemState: boolean;
};

export type ChecklistItem = {
    item: string;
    result: string;
    condition: { (): boolean } | undefined;
};

export type Checklist = {
    name: string;
    items: ChecklistItem[];
};

export type ChecklistPageProps = {
    items: ChecklistItem[];
    itemStates: ChecklistItemState[];
    setItemState: { (itemIndex: number, checked: boolean): void };
    isChecklistComplete: boolean;
    setChecklistComplete: { (complete: boolean): void };
};

export const ChecklistPage = (props: ChecklistPageProps) => {
    const {
        items,
        itemStates,
        setItemState,
        isChecklistComplete,
        setChecklistComplete,
    } = props;

    useEffect(() => {
        console.log(`Page: isChecklistComplete=${isChecklistComplete}`);
    },[items, isChecklistComplete])

    const toggleItemState = (idx: number) => {
        console.log(`toggle ${idx} --> ${!itemStates[idx].itemState}`)
        setItemState(idx, !itemStates[idx].itemState);
    };

    const allItemsChecked = itemStates.findIndex(it => it.itemState == false) == -1;

    const itemTags = items.map((it, idx) => {
        return (
            <CheckListItem
                isChecklistComplete={isChecklistComplete}
                clItem={it}
                isItemChecked={itemStates[idx].itemState}
                toggleItem={() => toggleItemState(idx)}
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
                            onClick={() => setChecklistComplete(true)}
                            className="mr-1 w-1/3 text-white bg-teal-light p-2 flex items-center justify-center rounded-lg focus:outline-none text-3xl"
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
                            onClick={() => setChecklistComplete(false)}
                            className="mr-1 w-1/3 text-red-600 bg-teal-light p-2 flex items-center justify-center rounded-lg focus:outline-none text-3xl"
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
