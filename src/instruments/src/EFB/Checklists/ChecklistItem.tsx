import { IconCheck, IconRepeat } from "@tabler/icons";
import React, { MouseEventHandler, useEffect } from "react";

export type ChecklistItemState = {
    checked: boolean;
    overwritten: boolean;
};

export type ChecklistItem = {
    item: string;
    result: string;
    condition: { (): boolean } | undefined;
};

export type CheckListItemProps = {
    isChecklistComplete: boolean;
    clItem: ChecklistItem;
    itemState: ChecklistItemState;
    toggleItemCheckStatus: { (): void };
    toggleItemOverwriteStatus: { (): void };
};

export const CheckListItem = (props: CheckListItemProps) => {
    const {
        isChecklistComplete,
        clItem,
        itemState,
        toggleItemCheckStatus,
        toggleItemOverwriteStatus,
    } = props;
    const onClick = () => {
        if (false === isChecklistComplete) toggleItemCheckStatus();
    };

    const onDoubleClick = (e: any) => {
        e.preventDefault();
        toggleItemOverwriteStatus();
    };

    const isConditionItem = () => {
        return clItem.condition !== undefined;
    };

    const itemClassName =
        false === isChecklistComplete &&
        false === isConditionItem() &&
        clItem.item !== ""
            ? "checklistItem"
            : "";

    const itemText = (text: string, conditionPrefix: string) => {
        if (true == isConditionItem())
            return <i>{coloredItemText(text, conditionPrefix)}</i>;
        return <>{coloredItemText(text, conditionPrefix)}</>;
    };

    const coloredItemText = (text: string, conditionPrefix: string) => {
        const theText = isConditionItem() ? conditionPrefix + text : text;
        let color = itemState.checked ? "text-green-500" : "text-white";
        if (itemState.overwritten) {
            color = "text-blue-500";
        }
        return <text className={"text-2xl " + color}>{theText}</text>;
    };

    const dotsClassName = itemState.checked
        ? itemState.overwritten
            ? "dotsCheckedOverwrite"
            : "dotsChecked"
        : "dotsUnchecked";

    return (
        <div
            className={itemClassName}
            onClick={isConditionItem() ? undefined : onClick}
            onDoubleClick={isConditionItem() ? onDoubleClick : undefined}
        >
            {clItem.item === "" && (
                <>
                    <br />
                    <hr className="solid"></hr>
                    <br />
                </>
            )}

            {clItem.item != "" && (
                <>
                    <div className={dotsClassName}></div>
                    <div className="checklistTextDiv">
                        <span className="checklistTextSpan">
                            {itemText(clItem.item, "* ")}
                        </span>
                        <span className="checklistTextSpan pull-right">
                            {itemText(clItem.result, "")}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};
