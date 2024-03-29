// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
    afterLandingChecklistA32NX,
    afterStartChecklistA32NX, approachChecklistA32NX,
    beforeStartChecklistA32NX,
    cockpitPreparationChecklistA32NX, landingChecklistA32NX, lineUpChecklistA32NX, parkingChecklistA32NX, securingAircraftChecklistA32NX,
    taxiChecklistA32NX,
} from './A32NX_Checklists';
import { ChecklistDefinition } from '../Checklists';

export const CHECKLISTS_A32NX: ChecklistDefinition[] = [
    cockpitPreparationChecklistA32NX,
    beforeStartChecklistA32NX,
    afterStartChecklistA32NX,
    taxiChecklistA32NX,
    lineUpChecklistA32NX,
    approachChecklistA32NX,
    landingChecklistA32NX,
    afterLandingChecklistA32NX,
    parkingChecklistA32NX,
    securingAircraftChecklistA32NX,
];
