// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import classNames from 'classnames';

type CardProps = {
  title?: string;
  childrenContainerClassName?: string;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ title, childrenContainerClassName = '', children, className }) => (
  <div className={className}>
    {!!title && <h1 className="mb-4 text-2xl font-medium">{title}</h1>}

    <div className={classNames(['border-2 border-theme-accent rounded-md p-4', childrenContainerClassName])}>
      {children}
    </div>
  </div>
);

export default Card;
