import React, { FC } from 'react';
import { IconArrowRight } from '@tabler/icons';
import { useFailuresOrchestrator } from "../../failures-orchestrator-provider";
import { A320Failure } from "@flybywiresim/failures";

export const RemindersWidget: FC = () => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();

    return (
        <>
            <h2 className="font-bold">Reminders</h2>

            <RemindersSection title="Pinned Charts"/>
            <RemindersSection title="Maintenance">
                <div className="flex">
                    {Array.from(activeFailures).map((failure) => (
                        <ActiveFailureReminder name={allFailures.find((it) => it.identifier === failure)?.name ?? '<unknown>'} />
                    ))}
                    {activeFailures.size === 0 && (
                        <span className="text-3xl font-manrope font-bold m-auto">No Active Failures</span>
                    )}
                </div>
                <div className="flex mt-4">
                </div>
            </RemindersSection>
            <RemindersSection title="Checklists"/>
        </>
    );
};

interface RemindersSectionProps {
    title: string,
}

const RemindersSection: FC<RemindersSectionProps> = ({ title, children }) => (
    <div className="flex flex-col pb-6 border-b-2 border-gray-700">
        <div className="flex justify-between items-center">
            <h2 className="mt-5 mb-6 font-medium">{title}</h2>

            <span className="flex items-center h-7 text-theme-highlight border-b-2 border-theme-highlight">
                <span className="font-bold text-theme-highlight font-manrope">Go to Page</span>

                <IconArrowRight className="fill-current" />
            </span>
        </div>

        {children}
    </div>
);

interface ActiveFailureReminderProps {
    name: string,
}

const ActiveFailureReminder: FC<ActiveFailureReminderProps> = ({ name }) => (
    <div className="flex flex-col flex-wrap p-2 mr-4 w-60 bg-theme-highlight rounded-md border-2 border-theme-highlight">
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
