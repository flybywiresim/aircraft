// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC } from 'react';
import { ArrowRight } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { t } from '../../../translation';

interface RemindersSectionProps {
    title: string,
    pageLinkPath?: string,
    noLink?: boolean
}

export const RemindersSection: FC<RemindersSectionProps> = ({ title, children, pageLinkPath, noLink }) => (
    <div className="flex flex-col border-b-2 border-gray-700 pb-6">
        <div className="mb-2 flex flex-row items-center justify-between">
            <h2 className="font-medium">{title}</h2>

            {!noLink && (
                <Link to={pageLinkPath} className="text-theme-highlight border-theme-highlight flex items-center border-b-2 opacity-80 transition duration-100 hover:opacity-100">
                    <span className="text-theme-highlight font-manrope font-bold">{t('Dashboard.ImportantInformation.GoToPage')}</span>

                    <ArrowRight className="fill-current" />
                </Link>
            )}
        </div>

        {children}
    </div>
);
