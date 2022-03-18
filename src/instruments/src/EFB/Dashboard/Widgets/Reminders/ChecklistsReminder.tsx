import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { areAllChecklistItemsCompleted, getChecklistCompletion, setSelectedChecklistIndex, TrackingChecklist } from '../../../Store/features/checklists';
import { RemindersSection } from './RemindersSection';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { getRelevantChecklistIndices } from '../../../Checklists/Checklists';

interface ChecklistReminderCardProps {
    checklist: TrackingChecklist;
    checklistIndex: number;
    className?: string;
}

const ChecklistReminderCard = ({ checklist, checklistIndex, className }: ChecklistReminderCardProps) => {
    const dispatch = useAppDispatch();

    let color = 'text-theme-highlight';

    if (areAllChecklistItemsCompleted(checklistIndex)) {
        if (checklist.markedCompleted) {
            color = 'text-colors-lime-400';
        } else {
            color = 'text-colors-orange-400';
        }
    }

    return (
        <Link
            to="/checklists"
            className={`relative overflow-hidden flex flex-col flex-wrap px-2 pt-3 pb-2 mt-4 bg-theme-accent rounded-md ${color} ${className}`}
            onClick={() => {
                dispatch(setSelectedChecklistIndex(checklistIndex));
            }}
        >
            <div className="absolute top-0 left-0 flex-row w-full h-1.5 text-current bg-theme-secondary">
                <div
                    className="h-full text-current bg-current"
                    style={{
                        width: `${getChecklistCompletion(checklistIndex) * 100}%`,
                        transition: 'width 0.5s ease',
                    }}
                />
            </div>

            <h2 className="font-bold">{checklist.name}</h2>

            {checklist.markedCompleted ? (
                <Check className="mt-auto ml-auto text-colors-lime-400" size={28} />
            ) : (
                <ArrowRight className="mt-auto ml-auto text-current" />
            )}
        </Link>
    );
};

export const ChecklistsReminder = () => {
    const { checklists } = useAppSelector((state) => state.trackingChecklists);

    const relevantChecklistIndices = getRelevantChecklistIndices();
    const [relevantChecklists, setRelevantChecklists] = useState([...checklists].filter((_, clIndex) => relevantChecklistIndices.includes(clIndex)));

    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'Enum', 1000);

    useEffect(() => {
        setRelevantChecklists([...checklists].filter((_, clIndex) => relevantChecklistIndices.includes(clIndex)));
    }, [flightPhase]);

    return (
        <RemindersSection title="Checklists" pageLinkPath="/checklists">
            {relevantChecklists.length ? (
                <div className="grid grid-cols-2">
                    {relevantChecklists.map((checklist, index) => (
                        <ChecklistReminderCard
                            checklist={checklist}
                            checklistIndex={checklists.findIndex((cl) => cl.name === checklist.name)}
                            className={`${index && index % 2 !== 0 && 'ml-4'}`}
                        />
                    ))}
                </div>
            ) : (
                <h1 className="m-auto my-4 font-bold opacity-60">No Relevant Checklists</h1>
            )}
        </RemindersSection>
    );
};
