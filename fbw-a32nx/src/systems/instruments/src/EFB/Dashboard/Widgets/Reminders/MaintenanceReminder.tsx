// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AtaChapterNumber } from '@flybywiresim/fbw-sdk';
import React, { FC } from 'react';
import { ArrowRight } from 'react-bootstrap-icons';
import { useHistory } from 'react-router';
import { t } from '../../../translation';
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

                const lastFailurePath = findLatestSeenPathname(history, '/failures/failureslist');

                if (!ata) {
                    history.push('/failures/failureslist/compact');
                }

                if (!lastFailurePath || lastFailurePath.includes('comfort')) {
                    history.push(`/failures/failureslist/comfort/${ata}`);
                } else {
                    history.push('/failures/failureslist/compact');
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

    return (
        <RemindersSection title={t('Dashboard.ImportantInformation.Maintenance.Title')} pageLinkPath="/failures/failureslist">
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
                    <h1 className="m-auto my-4 font-bold text-center opacity-60">{t('Dashboard.ImportantInformation.Maintenance.NoActiveFailures')}</h1>
                )}
            </div>
        </RemindersSection>
    );
};
