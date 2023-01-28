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
    <div className="flex flex-col pb-6 border-b-2 border-gray-700">
        <div className="flex flex-row justify-between items-center mb-2">
            <h2 className="font-medium">{title}</h2>

            {!noLink && (
                <Link to={pageLinkPath} className="flex items-center text-theme-highlight border-b-2 border-theme-highlight opacity-80 hover:opacity-100 transition duration-100">
                    <span className="font-bold text-theme-highlight font-manrope">{t('Dashboard.ImportantInformation.GoToPage')}</span>

                    <ArrowRight className="fill-current" />
                </Link>
            )}
        </div>

        {children}
    </div>
);
