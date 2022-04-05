/* eslint-disable max-len */
import React, { useEffect } from 'react';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { Link45deg } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import { ChecklistPage } from './ChecklistsPage';
import { CHECKLISTS } from './Lists';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import {
    areAllChecklistItemsCompleted,
    setChecklistCompletion, setChecklistItemCompletion,
    setSelectedChecklistIndex,
} from '../Store/features/checklists';
import { RootState, store, useAppDispatch, useAppSelector } from '../Store/store';
import { PromptModal, useModals } from '../UtilComponents/Modals/Modals';

export interface ChecklistItem {
    item: string;
    result: string;
    condition?: () => boolean;
}

export interface ChecklistDefinition {
    name: string;
    items: ChecklistItem[];
}

export const getRelevantChecklistIndices = () => {
    const relevantChecklistIndices: number[] = [];
    const flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');

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

export const setAutomaticItemStates = () => {
    const checklists = (store.getState() as RootState).trackingChecklists.checklists;
    const relevantChecklistIndices = getRelevantChecklistIndices();
    const firstRelevantUnmarkedIdx = checklists.findIndex((cl, clIndex) => relevantChecklistIndices.includes(clIndex) && !cl.markedCompleted);

    if (firstRelevantUnmarkedIdx === -1) return;

    CHECKLISTS[firstRelevantUnmarkedIdx].items.forEach((clItem, itemIdx) => {
        const associatedTrackingItem = checklists[firstRelevantUnmarkedIdx].items[itemIdx];

        if (!clItem.condition || !associatedTrackingItem) return;

        store.dispatch(setChecklistItemCompletion({
            checklistIndex: firstRelevantUnmarkedIdx,
            itemIndex: itemIdx,
            completionValue: clItem.condition(),
        }));
    });
};

export const Checklists = () => {
    const dispatch = useAppDispatch();

    const handleClick = (index: number) => {
        dispatch(setSelectedChecklistIndex(index));
    };

    const { t } = useTranslation();

    const { selectedChecklistIndex, checklists } = useAppSelector((state) => state.trackingChecklists);

    const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);

    const relevantChecklistIndices = getRelevantChecklistIndices();
    const firstRelevantUnmarkedIdx = checklists.findIndex((cl, clIndex) => relevantChecklistIndices.includes(clIndex) && !cl.markedCompleted);

    const getTabClassName = (index: number) => {
        if (index === selectedChecklistIndex) {
            if (areAllChecklistItemsCompleted(index)) {
                if (checklists[index].markedCompleted) {
                    return 'bg-utility-green font-bold text-theme-body';
                }

                return 'bg-utility-amber font-bold text-theme-body';
            }

            return 'bg-theme-highlight font-bold text-theme-body';
        }

        if (areAllChecklistItemsCompleted(index)) {
            if (checklists[index].markedCompleted) {
                return 'bg-theme-body border-2 border-utility-green font-bold text-utility-green hover:text-theme-body hover:bg-utility-green';
            }

            return 'bg-theme-body border-2 border-utility-amber font-bold text-utility-amber hover:text-theme-body hover:bg-utility-amber';
        }

        return 'bg-theme-accent border-2 border-theme-accent font-bold text-theme-text hover:bg-theme-highlight hover:text-theme-body';
    };

    useEffect(() => {
        if (!autoFillChecklists) return;

        setAutomaticItemStates();
    }, [selectedChecklistIndex]);

    const { showModal } = useModals();

    const handleResetConfirmation = () => {
        showModal(
            <PromptModal
                title={t('Checklists.ChecklistResetWarning')}
                bodyText={t('Checklists.AreYouSureYouWantToResetChecklists')}
                onConfirm={() => {
                    checklists.forEach((cl, clIndex) => {
                        cl.items.forEach((_, itemIdx) => {
                            if (autoFillChecklists && CHECKLISTS[clIndex].items[itemIdx].condition) {
                                return;
                            }
                            dispatch(setChecklistItemCompletion({ checklistIndex: clIndex, itemIndex: itemIdx, completionValue: false }));
                        });
                        dispatch(setChecklistCompletion({ checklistIndex: clIndex, completion: false }));
                    });
                }}
            />,
        );
    };

    const handleResetChecklist = () => {
        checklists[selectedChecklistIndex].items.forEach((_, itemIdx) => {
            if (autoFillChecklists && CHECKLISTS[selectedChecklistIndex].items[itemIdx].condition) {
                return;
            }
            dispatch(setChecklistItemCompletion({ checklistIndex: selectedChecklistIndex, itemIndex: itemIdx, completionValue: false }));
        });
        dispatch(setChecklistCompletion({ checklistIndex: selectedChecklistIndex, completion: false }));
    };

    return (
        <>
            <h1 className="mb-4 font-bold">{t('Checklists.Title')}</h1>
            <div className="flex flex-row space-x-6 h-content-section-reduced">
                <div className="flex flex-col flex-shrink-0 justify-between w-1/4">
                    <ScrollableContainer innerClassName="space-y-4" height={46}>
                        {CHECKLISTS.map((cl, index) => (
                            <div
                                className={`flex justify-center items-center w-full h-12 rounded-md transition duration-100 ${getTabClassName(index)}`}
                                onClick={() => handleClick(index)}
                            >
                                {!!autoFillChecklists && firstRelevantUnmarkedIdx === index && (
                                    <Link45deg size={24} />
                                )}
                                {cl.name}
                            </div>
                        ))}
                    </ScrollableContainer>

                    <button
                        type="button"
                        className="flex justify-center items-center h-12 font-bold rounded-md border-2 transition duration-100 text-utility-red hover:text-theme-body bg-theme-body hover:bg-utility-red border-utility-red"
                        onClick={handleResetConfirmation}
                    >
                        {t('Checklists.ResetAll')}
                    </button>

                    <button
                        type="button"
                        className="flex justify-center items-center h-12 font-bold rounded-md border-2 transition duration-100 text-utility-red hover:text-theme-body bg-theme-body hover:bg-utility-red border-utility-red"
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
