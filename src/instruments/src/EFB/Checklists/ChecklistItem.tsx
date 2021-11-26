import { IconCheck, IconRepeat } from "@tabler/icons";
import React, { useEffect } from "react";
import { ChecklistItem } from "./ChecklistPage";

export type CheckListItemProps = {
    isChecklistComplete: boolean;
    clItem: ChecklistItem;
    isItemChecked: boolean;
    toggleItem: { (): void };
};

export const CheckListItem = (props: CheckListItemProps) => {
    const { isChecklistComplete, clItem, isItemChecked, toggleItem } = props;
    const onClick = () => {
        if (false === isChecklistComplete) toggleItem();
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
        const color = isItemChecked ? "text-green-500" : "text-white";
        return <text className={"text-2xl " + color}>{theText}</text>;
    };

    return (
        <div className={itemClassName} onClick={onClick}>
            {clItem.item === "" && (
                <>
                    <br />
                    <hr className="solid"></hr>
                    <br />
                </>
            )}

            {clItem.item != "" && (
                <>
                    <div
                        className={
                            isItemChecked ? "dotsChecked" : "dotsUnchecked"
                        }
                    ></div>
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
