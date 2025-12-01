// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AbnormalNonSensedList } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPublisher';

/** All normal procedures (checklists, via ECL) should be here.
 * Display is ordered by ID, ascending. That's why keys need to be numbers. */
export const AbnormalNonSensedProceduresOverview: AbnormalNonSensedList[] = [
  { id: 260900097, category: null },
  { id: 990900006, category: null },
  { id: 990900005, category: null },
  { id: 990900004, category: null },
  { id: 990900007, category: null },
  { id: 340900003, category: null },
  { id: 700900001, category: 'ENG' },
  { id: 700900002, category: 'ENG' },
  { id: 270900001, category: 'F/CTL' },
  { id: 270900004, category: 'F/CTL' },
  { id: 270900005, category: 'F/CTL' },
  { id: 270900002, category: 'F/CTL' },
  { id: 270900003, category: 'F/CTL' },
  { id: 280900001, category: 'FUEL' },
  { id: 280900002, category: 'FUEL' },
  { id: 280900003, category: 'FUEL' },
  { id: 320900001, category: 'L/G' },
  { id: 320900002, category: 'L/G' },
  { id: 320900003, category: 'L/G' },
  { id: 320900004, category: 'L/G' },
  { id: 320900005, category: 'L/G' },
  { id: 320900006, category: 'L/G' },
  { id: 340900001, category: 'NAV' },
  { id: 340900002, category: 'NAV' },
  { id: 990900011, category: 'MISCELLANEOUS' },
  { id: 990900009, category: 'MISCELLANEOUS' },
  { id: 990900002, category: 'MISCELLANEOUS' },
  { id: 990900003, category: 'MISCELLANEOUS' },
  { id: 990900001, category: 'MISCELLANEOUS' },
  { id: 990900010, category: 'MISCELLANEOUS' },
  { id: 990900008, category: 'MISCELLANEOUS' },
];
