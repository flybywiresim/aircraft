// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect } from 'react';
import { usePersistentNumberProperty } from '@flybywiresim/fbw-sdk';
import { Link45deg } from 'react-bootstrap-icons';
import { PromptModal, ScrollableContainer, t, useModals } from '@flybywiresim/flypad';
import { ChecklistJsonDefinition } from '@flybywiresim/checklists';
import { ChecklistPage } from './ChecklistsPage';
import {
  areAllChecklistItemsCompleted,
  setChecklistCompletion,
  setChecklistItemCompletion,
  setSelectedChecklistIndex,
} from '../Store/features/checklists';
import { RootState, store, useAppDispatch, useAppSelector } from '../Store/store';

/**
 * @brief Get the relevant checklist indices based on the current flight phase.
 */
export const getRelevantChecklistIndices = () => {
  const { aircraftChecklists } = useAppSelector((state) => state.trackingChecklists);

  // | Value | Flight Phase     |
  // |-------|------------------|
  // | 0     |                  |
  // | 1     | ELEC PWR         |
  // | 2     | 1ST ENG STARTED  |
  // | 3     | 1ST ENG TO PWR   |
  // | 4     | 80 kt            |
  // | 5     | LIFTOFF          |
  // | 6     | 1500ft (in clb)  |
  // | 7     | 800 ft (in desc) |
  // | 8     | TOUCHDOWN        |
  // | 9     | 80 kt            |
  // | 10    | 2nd ENG SHUTDOWN |
  // | => 1  | 5 MIN AFTER      |
  // |--------------------------|
  const flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');

  const relevantChecklistIndices: number[] = [];

  // iterate over all checklists and check if they are relevant for the current flight phase
  aircraftChecklists.forEach((cl, clIndex) => {
    // check if the checklist is relevant for the previous or the current flight phase
    if (cl.flightphase && cl.flightphase <= flightPhase) {
      relevantChecklistIndices.push(clIndex);
    }
  });

  return relevantChecklistIndices;
};

/**
 * @brief Set the automatic item states based on the checklist item conditions.
 *
 * This is called every 1s from EFB.tsx and every time the selected checklist index changes.
 */
export const setAutomaticItemStates = (aircraftChecklists: ChecklistJsonDefinition[]) => {
  const checklists = (store.getState() as RootState).trackingChecklists.checklists;

  checklists.forEach((cl, currentChecklistIdx) => {
    // leave completed checklists alone - as otherwise they would be reset everytime an item becomes uncompleted
    // iterate over all non-completed checklists and check all auto-checkable items
    if (cl.markedCompleted) return;

    // check all items in the current checklist if they are auto completed
    aircraftChecklists[currentChecklistIdx].items.forEach((clItem, itemIdx) => {
      let isCompleted: boolean = false;

      // if the item is a line or subheader, mark it as completed as these do not have a relevant completion state
      if (clItem.type !== undefined && (clItem.type === 'LINE' || clItem.type === 'SUBLISTHEADER')) {
        isCompleted = true;
        // if the item has a condition, check if it is fulfilled
      } else if (clItem.condition && clItem.condition.length > 0) {
        isCompleted = clItem.condition.every((c) => {
          let comp: string = c.comp;
          if (comp === undefined) comp = 'EQ';
          switch (comp) {
            case 'NE':
              return SimVar.GetSimVarValue(c.varName, 'Number') !== c.result;
            case 'LT':
              return SimVar.GetSimVarValue(c.varName, 'Number') < c.result;
            case 'LE':
              return SimVar.GetSimVarValue(c.varName, 'Number') <= c.result;
            case 'EQ':
              return SimVar.GetSimVarValue(c.varName, 'Number') === c.result;
            case 'GE':
              return SimVar.GetSimVarValue(c.varName, 'Number') >= c.result;
            case 'GT':
              return SimVar.GetSimVarValue(c.varName, 'Number') > c.result;
            default:
              console.warn('Unknown EqualityType: ', comp);
              return false;
          }
        });
        // ignore items and subitems without a condition
      } else {
        return;
      }

      // check if there is a stored tracking item associated with the checklist item
      if (checklists[currentChecklistIdx].items[itemIdx]) {
        store.dispatch(
          setChecklistItemCompletion({
            checklistIndex: currentChecklistIdx,
            itemIndex: itemIdx,
            completionValue: isCompleted,
          }),
        );
      }
    });
  });
};

/**
 * @brief The flyPad's Checklists page component.
 */
export const Checklists = () => {
  const { selectedChecklistIndex, checklists, aircraftChecklists } = useAppSelector(
    (state) => state.trackingChecklists,
  );

  const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);

  const dispatch = useAppDispatch();
  const { showModal } = useModals();

  useEffect(() => {
    if (!autoFillChecklists) return;
    setAutomaticItemStates(aircraftChecklists);
  }, [selectedChecklistIndex, autoFillChecklists]);

  const relevantChecklistIndices = getRelevantChecklistIndices();
  const firstRelevantUnmarkedIdx = checklists.findIndex(
    (cl, clIndex) => relevantChecklistIndices.includes(clIndex) && !cl.markedCompleted,
  );

  /**
   * @brief Handles the click event for a checklist item.
   * @param index - The index of the checklist item being clicked.
   */
  const handleClick = (index: number) => {
    dispatch(setSelectedChecklistIndex(index));
  };

  /**
   * @brief Get the css/tailwind class name for the checklist tab-button
   * @param index - The index of the checklist tab.
   */
  const getTabClassName = (index: number) => {
    const isChecklistCompleted = areAllChecklistItemsCompleted(index);
    const isMarkedCompleted = checklists[index].markedCompleted;
    const isSelected = index === selectedChecklistIndex;
    const isIndexRelevant = relevantChecklistIndices.includes(index);
    if (isSelected && isChecklistCompleted && isIndexRelevant) {
      return isMarkedCompleted
        ? 'bg-utility-green font-bold text-theme-body'
        : 'bg-utility-amber font-bold text-theme-body';
    }
    if (isSelected) {
      return 'bg-theme-highlight font-bold text-theme-body';
    }
    if (isChecklistCompleted && isIndexRelevant) {
      return isMarkedCompleted
        ? 'bg-theme-body border-2 border-utility-green font-bold text-utility-green ' +
            'hover:text-theme-body hover:bg-utility-green'
        : 'bg-theme-body border-2 border-utility-amber ' +
            'font-bold text-utility-amber hover:text-theme-body hover:bg-utility-amber';
    }
    return 'bg-theme-accent border-2 border-theme-accent font-bold text-theme-text hover:bg-theme-highlight hover:text-theme-body';
  };

  /**
   * @brief Function to handle the confirmation to reset all checklists.
   * This function displays a confirmation modal with a warning message and a confirmation button.
   * If the user confirms the reset, it will set the completion value for all checklist items and checklists
   * to false.
   */
  const handleResetAllConfirmation = () => {
    showModal(
      <PromptModal
        title={t('Checklists.ChecklistResetWarning')}
        bodyText={t('Checklists.AreYouSureYouWantToResetChecklists')}
        onConfirm={() => {
          checklists.forEach((cl, clIndex) => {
            cl.items.forEach((_, itemIdx) => {
              if (autoFillChecklists && aircraftChecklists[clIndex].items[itemIdx].condition) {
                return;
              }
              dispatch(
                setChecklistItemCompletion({
                  checklistIndex: clIndex,
                  itemIndex: itemIdx,
                  completionValue: false,
                }),
              );
            });
            dispatch(setChecklistCompletion({ checklistIndex: clIndex, completion: false }));
          });
        }}
      />,
    );
  };

  /**
   * @brief Handles the reset of a single checklist.
   *
   * This function sets the completion of each checklist item to false and the completion
   * of the entire checklist to false.
   */
  const handleResetChecklist = () => {
    checklists[selectedChecklistIndex].items.forEach((_, itemIdx) => {
      if (autoFillChecklists && aircraftChecklists[selectedChecklistIndex].items[itemIdx].condition) {
        return;
      }
      dispatch(
        setChecklistItemCompletion({
          checklistIndex: selectedChecklistIndex,
          itemIndex: itemIdx,
          completionValue: false,
        }),
      );
    });
    dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: false }));
  };

  return (
    <>
      <h1 className="mb-4 font-bold">{t('Checklists.Title')}</h1>
      <div className="flex h-content-section-reduced flex-row space-x-6">
        <div className="flex w-1/4 shrink-0 flex-col justify-between">
          <ScrollableContainer innerClassName="space-y-4" height={46}>
            {aircraftChecklists.map((cl, index) => (
              <div
                key={cl.name}
                className={`flex h-12 w-full items-center justify-center rounded-md transition duration-100 ${getTabClassName(index)}`}
                onClick={() => handleClick(index)}
              >
                {!!autoFillChecklists && firstRelevantUnmarkedIdx === index && <Link45deg size={24} />} {cl.name}
              </div>
            ))}
          </ScrollableContainer>

          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-md border-2 border-utility-red
                                   bg-theme-body font-bold text-utility-red transition duration-100
                                   hover:bg-utility-red hover:text-theme-body"
            onClick={handleResetAllConfirmation}
          >
            {t('Checklists.ResetAll')}
          </button>

          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-md border-2 border-utility-red
                                   bg-theme-body font-bold text-utility-red transition duration-100
                                   hover:bg-utility-red hover:text-theme-body"
            onClick={handleResetChecklist}
          >
            {t('Checklists.ResetChecklist')}
          </button>
        </div>

        <ChecklistPage />
      </div>
    </>
  );
};
