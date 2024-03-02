import { EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import {
    AdirsSimVarDefinitions,
    AdirsSimVars,
    SwitchingPanelSimVarsDefinitions,
    SwitchingPanelVSimVars,
} from '../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export type NDSimvars = AdirsSimVars & SwitchingPanelVSimVars & {
    elec: boolean;
    elecFo: boolean;
    potentiometerCaptain: number;
    potentiometerFo: number;
    ilsCourse: number;
    selectedWaypointLat: Degrees;
    selectedWaypointLong: Degrees;
    selectedHeading: Degrees;
    showSelectedHeading: boolean;
    pposLat: Degrees;
    pposLong: Degrees;
    absoluteTime: Seconds;
    fmgcFlightPhase: number;
  }

export enum NDVars {
    elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
    potentiometerCaptain = 'LIGHT POTENTIOMETER:89',
    potentiometerFo = 'LIGHT POTENTIOMETER:91',
    ilsCourse = 'L:A32NX_FM_LS_COURSE',
    selectedWaypointLat = 'L:A32NX_SELECTED_WAYPOINT_LAT',
    selectedWaypointLong = 'L:A32NX_SELECTED_WAYPOINT_LONG',
    selectedHeading = 'L:A32NX_FCU_HEADING_SELECTED',
    showSelectedHeading = 'L:A320_FCU_SHOW_SELECTED_HEADING',
    pposLat = 'PLANE LATITUDE', // TODO replace with fm position
    pposLong = 'PLANE LONGITUDE', // TODO replace with fm position
    absoluteTime = 'E:ABSOLUTE TIME',
    fmgcFlightPhase = 'L:A32NX_FMGC_FLIGHT_PHASE',
}

/** A publisher to poll and publish nav/com simvars. */
export class NDSimvarPublisher extends UpdatableSimVarPublisher<NDSimvars> {
    private static simvars = new Map<keyof NDSimvars, SimVarDefinition>([
        ...AdirsSimVarDefinitions,
        ...SwitchingPanelSimVarsDefinitions,
        ['elec', { name: NDVars.elec, type: SimVarValueType.Bool }],
        ['elecFo', { name: NDVars.elecFo, type: SimVarValueType.Bool }],
        ['potentiometerCaptain', { name: NDVars.potentiometerCaptain, type: SimVarValueType.Number }],
        ['potentiometerFo', { name: NDVars.potentiometerFo, type: SimVarValueType.Number }],
        ['ilsCourse', { name: NDVars.ilsCourse, type: SimVarValueType.Number }],
        ['selectedWaypointLat', { name: NDVars.selectedWaypointLat, type: SimVarValueType.Degree }],
        ['selectedWaypointLong', { name: NDVars.selectedWaypointLong, type: SimVarValueType.Degree }],
        ['selectedHeading', { name: NDVars.selectedHeading, type: SimVarValueType.Degree }],
        ['showSelectedHeading', { name: NDVars.showSelectedHeading, type: SimVarValueType.Bool }],
        ['pposLat', { name: NDVars.pposLat, type: SimVarValueType.Degree }],
        ['pposLong', { name: NDVars.pposLong, type: SimVarValueType.Degree }],
        ['absoluteTime', { name: NDVars.absoluteTime, type: SimVarValueType.Seconds }],
        ['fmgcFlightPhase', { name: NDVars.fmgcFlightPhase, type: SimVarValueType.Enum }],
    ])

    public constructor(bus: EventBus) {
        super(NDSimvarPublisher.simvars, bus);
    }
}
