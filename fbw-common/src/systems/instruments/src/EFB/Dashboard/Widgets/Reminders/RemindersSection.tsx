// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC } from 'react';
import { ArrowRight } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { t } from '../../../Localization/translation';

interface RemindersSectionProps {
  title: string;
  pageLinkPath?: string;
  noLink?: boolean;
}

export const RemindersSection: FC<RemindersSectionProps> = ({ title, children, pageLinkPath, noLink }) => (
  <div className="flex flex-col border-b-2 border-gray-700 pb-6">
    <div className="mb-2 flex flex-row items-center justify-between">
      <h2 className="font-medium">{title}</h2>

      {!noLink && (
        <Link
          to={pageLinkPath}
          className="flex items-center border-b-2 border-theme-highlight text-theme-highlight opacity-80 transition duration-100 hover:opacity-100"
        >
          <span className="font-manrope font-bold text-theme-highlight">
            {t('Dashboard.ImportantInformation.GoToPage')}
          </span>

          <ArrowRight className="fill-current" />
        </Link>
      )}
    </div>

    {children}
  </div>
);
