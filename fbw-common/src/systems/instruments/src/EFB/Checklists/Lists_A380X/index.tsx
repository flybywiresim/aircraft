// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
    afterLandingChecklistA380X,
    afterStartChecklistA380X, approachChecklistA380X,
    beforeStartChecklistA380X,
    beforeTakeoffChecklistA380X, landingChecklistA380X, parkingChecklistA380X,
    securingAircraftChecklistA380X, afterTakeoffChecklistA380X,
} from './A380X_Checklists';
import { ChecklistDefinition } from '../Checklists';

export const CHECKLISTS_A380X: ChecklistDefinition[] = [
    beforeStartChecklistA380X,
    afterStartChecklistA380X,
    beforeTakeoffChecklistA380X,
    afterTakeoffChecklistA380X,
    approachChecklistA380X,
    landingChecklistA380X,
    afterLandingChecklistA380X,
    parkingChecklistA380X,
    securingAircraftChecklistA380X,
];
