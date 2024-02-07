// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

'use strict';

module.exports = {
  extends: '../../../../../../.eslintrc.js',

  // overrides airbnb, use sparingly
  rules: { 'react/react-in-jsx-scope': 'off', 'react/no-unknown-property': 'off', 'react/style-prop-object': 'off' },
};
