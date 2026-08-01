// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

'use strict';

module.exports = {
  extends: '../../../../../../.eslintrc.js',

  // overrides airbnb, use sparingly
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/no-unknown-property': 'off',
    'react/style-prop-object': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@fmgc/flightplanning/plans/FlightPlan',
            message: 'MFD code must use ReadonlyFlightPlan or FlightPlanInterface instead.',
          },
          {
            name: '@fmgc/flightplanning/plans/AlternateFlightPlan',
            message: 'MFD code must use ReadonlyFlightPlan instead.',
          },
          {
            name: '@fmgc/flightplanning/plans/BaseFlightPlan',
            message: 'MFD code must use ReadonlyFlightPlan or FlightPlanInterface instead.',
          },
          {
            name: '@fmgc/flightplanning/legs/FlightPlanLeg',
            importNames: ['FlightPlanLeg'],
            message: 'MFD code must use ReadonlyFlightPlanLeg and isLeg instead.',
          },
        ],
      },
    ],
  },
};
