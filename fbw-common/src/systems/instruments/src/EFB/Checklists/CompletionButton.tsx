// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { t, useAppDispatch, useAppSelector } from '@flybywiresim/flypad';
import { usePersistentNumberProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import React, { useEffect } from 'react';

import {
  areAllChecklistItemsCompleted,
  setChecklistCompletion,
  setChecklistItemCompletion,
  setSelectedChecklistIndex,
} from '../Store/features/checklists';

export const CompletionButton = () => {
  const dispatch = useAppDispatch();

  const { selectedChecklistIndex, checklists, aircraftChecklists } = useAppSelector(
    (state) => state.trackingChecklists,
  );

  const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);

  const firstIncompleteIdx = checklists[selectedChecklistIndex].items.findIndex((item, index) => {
    const checklistItem = aircraftChecklists[selectedChecklistIndex].items[index];
    // skip line items
    if (checklistItem.type !== undefined && checklistItem.type === 'LINE') return false;
    // Let's go ahead and skip checklist items that have a completion-determination function as those can't be manually checked.
    if (autoFillChecklists) {
      return !item.completed && !checklistItem.condition;
    }
    return !item.completed;
  });

  // allows the completion button to be used via LVar - if the LVar is set to true, the button will be clicked,
  // and the LVar will be reset to false. This can be used, for example, to trigger completion from a hardware button.
  const [completeItemVar, setCompleteItemVar] = useSimVar('L:A32NX_EFB_CHECKLIST_COMPLETE_ITEM', 'bool', 200);
  useEffect(() => {
    setCompleteItemVar(false);
  }, []);
  useEffect(() => {
    if (completeItemVar) {
      setCompleteItemVar(false);
      if (checklists[selectedChecklistIndex].markedCompleted && selectedChecklistIndex < checklists.length - 1) {
        dispatch(setSelectedChecklistIndex(selectedChecklistIndex + 1));
      } else if (firstIncompleteIdx !== -1) {
        dispatch(
          setChecklistItemCompletion({
            checklistIndex: selectedChecklistIndex,
            itemIndex: firstIncompleteIdx,
            completionValue: true,
          }),
        );
      } else if (areAllChecklistItemsCompleted(selectedChecklistIndex)) {
        dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: true }));
      }
    }
  }, [completeItemVar]);

  // If the checklist is already marked as completed, show a button to proceed to the next checklist or
  // a message if it's the last checklist.
  if (checklists[selectedChecklistIndex].markedCompleted) {
    if (selectedChecklistIndex < checklists.length - 1) {
      return (
        <div
          className="flex w-full items-center justify-center rounded-md border-2 border-theme-highlight
                               bg-theme-body py-2 text-center font-bold text-theme-highlight transition duration-100
                               hover:bg-theme-highlight hover:text-theme-body"
          onClick={() => {
            dispatch(setSelectedChecklistIndex(selectedChecklistIndex + 1));
          }}
        >
          {t('Checklists.ProceedToNextChecklist')}
        </div>
      );
    }

    return (
      <div
        className="flex w-full items-center justify-center rounded-md border-2 border-theme-highlight
                           bg-theme-body py-2 text-center font-bold text-theme-highlight"
      >
        {t('Checklists.TheLastChecklistIsComplete')}
      </div>
    );
  }

  // If there are incomplete items in the checklist, show a button to mark the first incomplete item as complete.
  if (firstIncompleteIdx !== -1) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-md border-2 border-utility-green
                           bg-theme-body py-2 text-center font-bold text-utility-green transition duration-100
                           hover:bg-utility-green hover:text-theme-body"
        onClick={() => {
          dispatch(
            setChecklistItemCompletion({
              checklistIndex: selectedChecklistIndex,
              itemIndex: firstIncompleteIdx,
              completionValue: true,
            }),
          );
        }}
      >
        {t('Checklists.MarkItemAsComplete')}
      </div>
    );
  }

  // If all items in the checklist are complete, show a button to mark the checklist as complete.
  if (areAllChecklistItemsCompleted(selectedChecklistIndex)) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-md border-2 border-utility-green
                           bg-theme-body py-2 text-center font-bold text-utility-green transition duration-100
                           hover:bg-utility-green hover:text-theme-body"
        onClick={() => {
          dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: true }));
        }}
      >
        {t('Checklists.MarkChecklistAsComplete')}
      </div>
    );
  }

  // If there are remaining autofill checklist items that have not yet been completed, show a message.
  return (
    <div
      className="flex w-full items-center justify-center rounded-md border-2 border-utility-green
                       bg-theme-body py-2 text-center font-bold text-utility-green"
    >
      {t('Checklists.ThereAreRemainingAutofillChecklistItemsThatHaveNotYetBeenCompleted')}
    </div>
  );
};
