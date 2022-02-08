import React, { FC } from 'react';
import { IconArrowRight } from '@tabler/icons';
import { A320Failure } from '@flybywiresim/failures';
import { Link } from 'react-router-dom';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';

export const RemindersWidget: FC = () => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();

    return (
        <>
            <h2 className="font-bold">Reminders</h2>

            <RemindersSection title="Pinned Charts" pageLinkPath="/navigation" />
            <RemindersSection title="Maintenance" pageLinkPath="/failures">
                <div className="flex flex-row flex-wrap">
                    {Array
                        .from(activeFailures)
                        // Sorts the failures by name length, greatest to least
                        .sort((a, b) => (allFailures.find((f) => f.identifier === b)?.name ?? '').length - (allFailures.find((f) => f.identifier === a)?.name ?? '').length)
                        .map((failure) => (
                            <ActiveFailureReminder name={allFailures.find((it) => it.identifier === failure)?.name ?? '<unknown>'} />
                        ))}
                    {activeFailures.size === 0 && (
                        <h1 className="m-auto my-4 font-bold opacity-60">No Active Failures</h1>
                    )}
                </div>
            </RemindersSection>
            <RemindersSection title="Checklists" pageLinkPath="/checklists" />
        </>
    );
};

interface RemindersSectionProps {
    title: string,
    pageLinkPath: string,
}

const RemindersSection: FC<RemindersSectionProps> = ({ title, children, pageLinkPath }) => (
    <div className="flex flex-col pb-6 border-b-2 border-gray-700">
        <div className="flex flex-row justify-between items-center mt-5 mb-2">
            <h2 className="font-medium">{title}</h2>

            <Link to={pageLinkPath} className="flex items-center border-b-2 opacity-80 hover:opacity-100 transition duration-100 text-theme-highlight border-theme-highlight">
                <span className="font-bold text-theme-highlight font-manrope">Go to Page</span>

                <IconArrowRight className="fill-current" />
            </Link>
        </div>

        {children}
    </div>
);

interface ActiveFailureReminderProps {
    name: string,
}

const ActiveFailureReminder: FC<ActiveFailureReminderProps> = ({ name }) => (
    <div className="flex flex-col flex-wrap p-2 mt-4 mr-4 rounded-md border-2 bg-theme-highlight border-theme-highlight">
        <h3 className="font-bold text-black">Active Failure</h3>
        <span className="mt-2 text-black font-inter">{name}</span>
        <span className="ml-auto text-black">
            <IconArrowRight />
        </span>
    </div>
);

const InopEquipmentReminder: FC = () => (
    <div className="flex flex-col flex-wrap p-2 mr-4 w-48 rounded-md border-2 border-theme-highlight">
        <h3 className="font-bold text-theme-highlight">INOP Equipment</h3>
        <span className="mt-2 text-theme-highlight font-inter">FD 2</span>
        <span className="ml-auto text-theme-highlight">
            <IconArrowRight />
        </span>
    </div>
);
