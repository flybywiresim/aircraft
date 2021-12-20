import { usePersistentProperty } from '@instruments/common/persistence';
import React, { useEffect } from 'react';

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
    const { isChecklistComplete, clItem, itemState, toggleItemCheckStatus, toggleItemOverwriteStatus } = props;
    const [automaticChecklistChecks] = usePersistentProperty('EFB_CHECKLISTS_AUTOMATIC', 'ENABLED');

    const onClick = () => {
        if (isChecklistComplete === false) toggleItemCheckStatus();
    };

    const onDoubleClick = (e: any) => {
        e.preventDefault();
        toggleItemOverwriteStatus();
    };

    const isConditionItem = () => clItem.condition !== undefined && automaticChecklistChecks === 'ENABLED';

    const itemClassName = isChecklistComplete === false && isConditionItem() === false && clItem.item !== '' ? 'checklistItem' : '';

    const itemText = (text: string, conditionPrefix: string) => {
        if (isConditionItem() === true) return <i>{coloredItemText(text, conditionPrefix)}</i>;
        return <>{coloredItemText(text, conditionPrefix)}</>;
    };

    const coloredItemText = (text: string, conditionPrefix: string) => {
        const theText = isConditionItem() ? conditionPrefix + text : text;
        let color = itemState.checked ? 'itemChecked' : 'itemUnchecked';
        if (itemState.overwritten) {
            color = 'itemOverwritten';
        }
        return <text className={`text-2xl ${color}`}>{theText}</text>;
    };

    let dotsClassName = 'dotsUnchecked';
    if (itemState.checked === true) {
        dotsClassName = itemState.overwritten ? 'dotsCheckedOverwrite' : 'dotsChecked';
    }

    return (
        <div
            className={itemClassName}
            onClick={isConditionItem() ? undefined : onClick}
            onDoubleClick={isConditionItem() ? onDoubleClick : undefined}
        >
            {clItem.item === '' && (
                <>
                    <br />
                    <hr className="solid" />
                    <br />
                </>
            )}

            {clItem.item !== '' && (
                <>
                    <div className={dotsClassName} />
                    <div className="checklistTextDiv">
                        <span className="checklistTextSpan">{itemText(clItem.item, '* ')}</span>
                        <span className="checklistTextSpan pull-right">{itemText(clItem.result, '')}</span>
                    </div>
                </>
            )}
        </div>
    );
};
