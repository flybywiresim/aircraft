import { AtaChapterNumber } from '@shared/ata';
import React, { FC } from 'react';
import { ArrowRight } from 'react-bootstrap-icons';
import { useHistory } from 'react-router';
import { useTranslation } from 'react-i18next';
import { RemindersSection } from './RemindersSection';
import { useFailuresOrchestrator } from '../../../failures-orchestrator-provider';
import { findLatestSeenPathname } from '../../../Utils/routing';
import { useAppDispatch } from '../../../Store/store';
import { setSearchQuery } from '../../../Store/features/failuresPage';

interface ActiveFailureCardProps {
    ata?: AtaChapterNumber;
    name: string;
}

const ActiveFailureCard: FC<ActiveFailureCardProps> = ({ ata, name }) => {
    const dispatch = useAppDispatch();
    const history = useHistory();

    return (
        <div
            className="flex flex-col flex-wrap p-2 mt-4 mr-4 rounded-md border-2 bg-theme-accent border-theme-accent hover:border-theme-highlight"
            onClick={() => {
                dispatch(setSearchQuery(name.toUpperCase()));

                const lastFailurePath = findLatestSeenPathname(history, '/failures');

                if (!ata) {
                    history.push('/failures/compact');
                }

                if (!lastFailurePath || lastFailurePath.includes('comfort')) {
                    history.push(`/failures/comfort/${ata}`);
                } else {
                    history.push('/failures/compact');
                }
            }}
        >
            <h3 className="font-bold">Active Failure</h3>
            <span className="mt-2 font-inter">{name}</span>
            <ArrowRight className="ml-auto" />
        </div>
    );
};

export const MaintenanceReminder = () => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();
    const { t } = useTranslation();

    return (
        <RemindersSection title={t('Dashboard.Maintenance')} pageLinkPath="/failures">
            <div className="flex flex-row flex-wrap">
                {Array
                    .from(activeFailures)
                    // Sorts the failures by name length, greatest to least
                    .sort((a, b) => (allFailures.find((f) => f.identifier === b)?.name ?? '').length - (allFailures.find((f) => f.identifier === a)?.name ?? '').length)
                    .map((failureIdentifier) => {
                        const failure = allFailures.find((it) => it.identifier === failureIdentifier);

                        return (
                            <ActiveFailureCard
                                ata={failure?.ata}
                                name={failure?.name ?? '<unknown>'}
                            />
                        );
                    })}

                {!activeFailures.size && (
                    <h1 className="m-auto my-4 font-bold text-center opacity-60">{t('Dashboard.NoActiveFailures')}</h1>
                )}
            </div>
        </RemindersSection>
    );
};
