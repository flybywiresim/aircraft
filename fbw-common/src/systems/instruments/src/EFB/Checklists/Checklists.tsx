// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { usePersistentNumberProperty } from '@flybywiresim/fbw-sdk';
import { Link45deg } from 'react-bootstrap-icons';
import { PromptModal, ScrollableContainer, t, useModals } from '@flybywiresim/flypad';
import { ChecklistItemType, ChecklistJsonDefinition, ChecklistProvider } from '@flybywiresim/checklists';
import { ChecklistPage } from './ChecklistsPage';
import {
    areAllChecklistItemsCompleted,
    setChecklistCompletion,
    setChecklistItemCompletion,
    setSelectedChecklistIndex,
} from '../Store/features/checklists';
import { RootState, store, useAppDispatch, useAppSelector } from '../Store/store';

const checklistReader = ChecklistProvider.getInstance();

/**
 * @brief Get the relevant checklist indices based on the current flight phase.
 *
 * TODO: make flight phases a part of the checklist data definitions
 */
export const getRelevantChecklistIndices = () => {
    const relevantChecklistIndices: number[] = [];
    const flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');

    // TODO: Check if the flight phases are correct for both aircraft types
    switch (flightPhase) {
    case 1:
    case 2:
        // Cockpit Preparation, Before Start, After Start, Taxi, Line-Up
        relevantChecklistIndices.push(0, 1, 2, 3, 4);
        break;
    case 6:
    case 7:
        // Approach, Landing
        relevantChecklistIndices.push(5, 6);
        break;
    case 8:
        // After Landing
        relevantChecklistIndices.push(7);
        break;
    case 9:
    case 10:
        // After Landing, Parking, Securing Aircraft
        relevantChecklistIndices.push(7, 8, 9);
        break;
    default:
    }

    return relevantChecklistIndices;
};

/**
 * @brief Set the automatic item states based on the checklist item conditions.
 *
 * This is called every 1s from EFB.tsx and every time the selected checklist index changes.
 */
export const setAutomaticItemStates = (aircraftChecklists: ChecklistJsonDefinition[]) => {
    if (aircraftChecklists.length === 0) return;

    const checklists = (store.getState() as RootState).trackingChecklists.checklists;

    // leave completed checklists alone - as otherwise they would be reset everytime an item becomes uncompleted
    // iterate over all non-completed checklists and check all auto-checkable items
    checklists
        .forEach((cl, currentChecklistIdx) => {
            if (cl.markedCompleted) return; // do not use filter as it would mess up the index sync between the two arrays

            // check all items in the current checklist if they are auto completed
            aircraftChecklists[currentChecklistIdx].items.forEach((clItem, itemIdx) => {
                let isCompleted: boolean = false;

                // if the item is a line or subheader, mark it as completed as these do not have a relevant completion state
                if (clItem.type !== undefined && (clItem.type === ChecklistItemType.LINE || clItem.type === ChecklistItemType.SUBLISTHEADER)) {
                    isCompleted = true;
                } else if (clItem.condition && clItem.condition.length > 0) {
                    isCompleted = true;
                    clItem.condition.forEach((c, _) => {
                        // one failing result and the conditions fail
                        if (SimVar.GetSimVarValue(c.varName, 'Number') !== c.result) {
                            isCompleted = false;
                        }
                    });
                } else {
                    // ignore items without a condition
                    return;
                }

                // check if there is a stored tracking item associated with the checklist item
                if (checklists[currentChecklistIdx].items[itemIdx]) {
                    store.dispatch(setChecklistItemCompletion({
                        checklistIndex: currentChecklistIdx,
                        itemIndex: itemIdx,
                        completionValue: isCompleted,
                    }));
                }
            });
        });
};

/**
 * @brief The flyPad's Checklists page component.
 */
export const Checklists = () => {
    // As ChecklistProvider.readChecklist() uses fetch to read a json from the VFS it is asynchronous and therefore
    // a result cannot be provided right away.
    // TODO:Is there no better way to get the lists into React??
    const [aircraftChecklists, setAircraftChecklists] = useState<ChecklistJsonDefinition[]>([]);
    useEffect(() => {
        checklistReader.readChecklist().then((result) => {
            setAircraftChecklists(result);
        });
    }, [aircraftChecklists.length === 0]);

    const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);

    const dispatch = useAppDispatch();
    const { showModal } = useModals();

    const { selectedChecklistIndex, checklists } = useAppSelector((state) => state.trackingChecklists);
    useEffect(() => {
        if (!autoFillChecklists) return;
        setAutomaticItemStates(aircraftChecklists);
    }, [selectedChecklistIndex]);

    const relevantChecklistIndices = getRelevantChecklistIndices();
    const firstRelevantUnmarkedIdx = checklists.findIndex((cl, clIndex) => relevantChecklistIndices.includes(clIndex) && !cl.markedCompleted);

    /**
     * Handles the click event for a checklist item.
     *
     * @param {number} index - The index of the checklist item being clicked.
     * @returns {void}
     */
    const handleClick = (index: number): void => {
        dispatch(setSelectedChecklistIndex(index));
    };

    /**
     * @brief Get the css/tailwind class name for the checklist tab-button
     * @param index
     */
    const getTabClassName = (index: number) => {
        const isChecklistCompleted = areAllChecklistItemsCompleted(index);
        const isMarkedCompleted = checklists[index].markedCompleted;
        const isSelected = index === selectedChecklistIndex;
        if (isSelected && isChecklistCompleted) {
            return isMarkedCompleted ? 'bg-utility-green font-bold text-theme-body' : 'bg-utility-amber font-bold text-theme-body';
        }
        if (isSelected) {
            return 'bg-theme-highlight font-bold text-theme-body';
        }
        if (isChecklistCompleted) {
            return isMarkedCompleted ? 'bg-theme-body border-2 border-utility-green font-bold text-utility-green hover:text-theme-body hover:bg-utility-green' : 'bg-theme-body border-2 border-utility-amber font-bold text-utility-amber hover:text-theme-body hover:bg-utility-amber';
        }
        return 'bg-theme-accent border-2 border-theme-accent font-bold text-theme-text hover:bg-theme-highlight hover:text-theme-body';
    };

    const handleResetConfirmation = () => {
        if (aircraftChecklists.length === 0) return;
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
                            dispatch(setChecklistItemCompletion({
                                checklistIndex: clIndex,
                                itemIndex: itemIdx,
                                completionValue: false,
                            }));
                        });
                        dispatch(setChecklistCompletion({ checklistIndex: clIndex, completion: false }));
                    });
                }}
            />,
        );
    };

    const handleResetChecklist = () => {
        if (aircraftChecklists.length === 0) return;
        checklists[selectedChecklistIndex].items.forEach((_, itemIdx) => {
            if (autoFillChecklists && aircraftChecklists[selectedChecklistIndex].items[itemIdx].condition) {
                return;
            }
            dispatch(setChecklistItemCompletion({
                checklistIndex: selectedChecklistIndex,
                itemIndex: itemIdx,
                completionValue: false,
            }));
        });
        dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: false }));
    };

    // aircraftChecklists are retrieved asynchronous there it is possible for aircraftChecklists to be empty. No point
    // in rendering then.
    if (aircraftChecklists.length === 0) {
        return (
            <></>
        );
    }

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
                                {!!autoFillChecklists && firstRelevantUnmarkedIdx === index && (
                                    <Link45deg size={24} />
                                )}
                                {' '}
                                {cl.name}
                            </div>
                        ))}
                    </ScrollableContainer>

                    <button
                        type="button"
                        className="flex h-12 items-center justify-center rounded-md border-2 border-utility-red bg-theme-body font-bold text-utility-red transition duration-100 hover:bg-utility-red hover:text-theme-body"
                        onClick={handleResetConfirmation}
                    >
                        {t('Checklists.ResetAll')}
                    </button>

                    <button
                        type="button"
                        className="flex h-12 items-center justify-center rounded-md border-2 border-utility-red bg-theme-body font-bold text-utility-red transition duration-100 hover:bg-utility-red hover:text-theme-body"
                        onClick={handleResetChecklist}
                    >
                        {t('Checklists.ResetChecklist')}
                    </button>
                </div>

                <ChecklistPage acl={aircraftChecklists} />
            </div>
        </>
    );
};
