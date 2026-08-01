// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

'use strict';

module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[property.name='performanceData']",
        message: 'MFD pages must access flight-plan performance data through readonlyPerformanceData.',
      },
    ],
  },
};
