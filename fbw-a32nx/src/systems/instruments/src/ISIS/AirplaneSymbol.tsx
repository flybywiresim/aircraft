// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

export const AirplaneSymbol = React.memo(() => (
  <g>
    <path
      className="StrokeYellowBig FillBackground"
      d="M 176.032 263.336 h 46.648 v 16.66 h -9.996 v -6.664 h -36.652 z"
    />
    <path className="StrokeYellowBig FillBackground" d="M 249.336 263.336 h 13.328 v 13.328 h -13.328 z" />
    <path
      className="StrokeYellowBig FillBackground"
      d="M 335.968 263.336 h -46.648 v 16.66 h 9.996 v -6.664 h 36.652 z"
    />
  </g>
));
