// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import './PageTitle.scss';

type PageTitleProps = {
  x: number;
  y: number;
  text: string;
};

export const PageTitle = ({ x, y, text }: PageTitleProps) => (
  <text id="pageTitle" className="PageTitle" x={x} y={y} alignmentBaseline="central">
    {text}
  </text>
);
