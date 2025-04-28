import { TurnDirection, WaypointDescriptor } from '@flybywiresim/fbw-sdk';
import { HoldType } from '@fmgc/flightplanning/data/flightplan';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { MfdFmsFpln } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFpln';
import { ContextMenuElement } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/ContextMenu';
import { BitFlags } from '@microsoft/msfs-sdk';
import { FlightPlanLegFlags } from '@fmgc/flightplanning/legs/FlightPlanLeg';

export enum FplnRevisionsMenuType {
  Waypoint,
  PseudoWaypoint,
  Discontinuity,
  Runway,
  Departure,
  Arrival,
  TooSteepPath,
}

export function getRevisionsMenu(fpln: MfdFmsFpln, type: FplnRevisionsMenuType): ContextMenuElement[] {
  const legIndex = fpln.props.fmcService.master?.revisedLegIndex.get();
  const planIndex = fpln.props.fmcService.master?.revisedLegPlanIndex.get();
  const altnFlightPlan = fpln.props.fmcService.master?.revisedLegIsAltn.get();

  if (legIndex == null || planIndex == null || altnFlightPlan == null) {
    return [];
  }

  const previousLeg = fpln.loadedFlightPlan?.maybeElementAt(legIndex - 1);
  const revisedLeg = fpln.loadedFlightPlan?.elementAt(legIndex);

  const isFromLeg = legIndex === fpln.loadedFlightPlan?.fromLegIndex;
  const isLegTerminatingAtDatabaseFix =
    revisedLeg &&
    !revisedLeg.isDiscontinuity &&
    revisedLeg.isXF() &&
    !BitFlags.isAny(revisedLeg.flags, FlightPlanLegFlags.DirectToTurningPoint);

  return [
    {
      name: 'FROM P.POS DIR TO',
      disabled:
        altnFlightPlan ||
        legIndex >= (fpln.loadedFlightPlan?.firstMissedApproachLegIndex ?? Infinity) ||
        planIndex === FlightPlanIndex.Temporary ||
        [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type) ||
        isFromLeg ||
        !isLegTerminatingAtDatabaseFix,
      onPressed: () => {
        const ppos = fpln.props.fmcService.master?.navigation.getPpos();
        if (ppos) {
          fpln.props.fmcService.master?.flightPlanService.directToLeg(
            ppos,
            SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree'),
            legIndex,
            true,
            planIndex,
          );
          fpln.props.mfd.uiService.navigateTo(
            `fms/${fpln.props.mfd.uiService.activeUri.get().category}/f-pln-direct-to`,
          );
        }
      },
    },
    {
      name: 'INSERT NEXT WPT',
      disabled: false, // always enabled?
      onPressed: () => fpln.openInsertNextWptFromWindow(),
    },
    {
      name: 'DELETE *',
      disabled:
        [FplnRevisionsMenuType.Runway || FplnRevisionsMenuType.TooSteepPath].includes(type) ||
        (revisedLeg?.isDiscontinuity && !previousLeg?.isDiscontinuity && previousLeg?.isVectors()) ||
        isFromLeg || // TODO allow in HDG/TRK
        planIndex === FlightPlanIndex.Temporary,
      onPressed: () => {
        fpln.props.fmcService.master?.flightPlanService.deleteElementAt(legIndex, false, planIndex, altnFlightPlan);
      },
    },
    {
      name: 'DEPARTURE',
      disabled: type !== FplnRevisionsMenuType.Departure && type !== FplnRevisionsMenuType.Runway,
      onPressed: () =>
        fpln.props.mfd.uiService.navigateTo(`fms/${fpln.props.mfd.uiService.activeUri.get().category}/f-pln-departure`),
    },
    {
      name: 'ARRIVAL',
      disabled: type !== FplnRevisionsMenuType.Arrival && type !== FplnRevisionsMenuType.Runway,
      onPressed: () =>
        fpln.props.mfd.uiService.navigateTo(`fms/${fpln.props.mfd.uiService.activeUri.get().category}/f-pln-arrival`),
    },
    {
      name: 'OFFSET',
      disabled: !fpln.loadedFlightPlan?.legElementAt(legIndex).isXF,
      onPressed: () =>
        fpln.props.mfd.uiService.navigateTo(`fms/${fpln.props.mfd.uiService.activeUri.get().category}/f-pln-offset`),
    },
    {
      name: 'HOLD',
      disabled:
        [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type) ||
        isFromLeg ||
        !isLegTerminatingAtDatabaseFix,
      onPressed: async () => {
        if (revisedLeg && !revisedLeg.isDiscontinuity && !revisedLeg.isHX()) {
          const alt = revisedLeg.definition.altitude1
            ? revisedLeg.definition.altitude1
            : SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');

          const previousLeg = fpln.props.fmcService.master?.flightPlanService.active.maybeElementAt(legIndex - 1);

          let inboundMagneticCourse = 100;
          const prevTerm = previousLeg?.isDiscontinuity === false && previousLeg?.terminationWaypoint();
          const wptTerm = revisedLeg.terminationWaypoint();
          if (previousLeg && !previousLeg.isDiscontinuity && previousLeg.isXF() && prevTerm && wptTerm) {
            inboundMagneticCourse = Avionics.Utils.computeGreatCircleHeading(prevTerm.location, wptTerm.location);
          }

          const defaultHold = {
            inboundMagneticCourse,
            turnDirection: TurnDirection.Right,
            time: alt <= 14000 ? 1 : 1.5,
            type: HoldType.Computed,
          };
          await fpln.props.fmcService.master?.flightPlanService.addOrEditManualHold(
            legIndex,
            Object.assign({}, defaultHold),
            undefined,
            defaultHold,
            planIndex,
            altnFlightPlan,
          );

          fpln.props.fmcService.master?.revisedLegIndex.set(legIndex + 1); // We just inserted a new HOLD leg
        }
        fpln.props.mfd.uiService.navigateTo(`fms/${fpln.props.mfd.uiService.activeUri.get().category}/f-pln-hold`);
      },
    },
    {
      name: 'AIRWAYS',
      disabled:
        [
          FplnRevisionsMenuType.Runway || FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath,
        ].includes(type) ||
        isFromLeg ||
        !isLegTerminatingAtDatabaseFix ||
        revisedLeg.waypointDescriptor === WaypointDescriptor.Airport ||
        revisedLeg.waypointDescriptor === WaypointDescriptor.Runway,
      onPressed: () => {
        fpln.props.fmcService.master?.flightPlanService.startAirwayEntry(legIndex);
        fpln.props.mfd.uiService.navigateTo(`fms/${fpln.props.mfd.uiService.activeUri.get().category}/f-pln-airways`);
      },
    },
    {
      name:
        !altnFlightPlan &&
        ![FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type) &&
        !revisedLeg?.isDiscontinuity &&
        revisedLeg?.definition.overfly
          ? 'DELETE OVERFLY *'
          : 'OVERFLY *',
      disabled:
        altnFlightPlan ||
        [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type) ||
        isFromLeg ||
        !isLegTerminatingAtDatabaseFix,
      onPressed: () =>
        fpln.props.fmcService.master?.flightPlanService.toggleOverfly(legIndex, planIndex, altnFlightPlan),
    },
    {
      name: 'ENABLE ALTN *',
      disabled: !revisedLeg || revisedLeg.isDiscontinuity,
      onPressed: () => {
        fpln.props.fmcService.master?.flightPlanService.enableAltn(legIndex, planIndex);
        fpln.props.fmcService.master?.acInterface.updateFmsData();
      },
    },
    {
      name: 'NEW DEST',
      disabled: isFromLeg || !isLegTerminatingAtDatabaseFix,
      onPressed: () => fpln.openNewDestWindow(),
    },
    {
      name: 'CONSTRAINTS',
      disabled:
        altnFlightPlan ||
        !isLegTerminatingAtDatabaseFix ||
        [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
      onPressed: () =>
        fpln.props.mfd.uiService.navigateTo(
          `fms/${fpln.props.mfd.uiService.activeUri.get().category}/f-pln-vert-rev/alt`,
        ),
    },
    {
      name: '(N/A) CMS',
      disabled:
        true ||
        altnFlightPlan ||
        [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
      onPressed: () =>
        fpln.props.mfd.uiService.navigateTo(
          `fms/${fpln.props.mfd.uiService.activeUri.get().category}/f-pln-vert-rev/cms`,
        ),
    },
    {
      name: 'STEP ALTs',
      disabled:
        altnFlightPlan ||
        !isLegTerminatingAtDatabaseFix ||
        [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
      onPressed: () =>
        fpln.props.mfd.uiService.navigateTo(
          `fms/${fpln.props.mfd.uiService.activeUri.get().category}/f-pln-vert-rev/step-alts`,
        ),
    },
    {
      name: '(N/A) WIND',
      disabled: true,
      onPressed: () => {
        if (!revisedLeg || revisedLeg.isDiscontinuity) {
          return;
        }

        // Find out whether waypoint is CLB, CRZ or DES waypoint and direct to appropriate WIND sub-page
        if (revisedLeg?.segment?.class === SegmentClass.Arrival) {
          fpln.props.mfd.uiService.navigateTo(`fms/${fpln.props.mfd.uiService.activeUri.get().category}/wind/des`);
        } else if (revisedLeg?.segment?.class === SegmentClass.Enroute) {
          fpln.props.mfd.uiService.navigateTo(`fms/${fpln.props.mfd.uiService.activeUri.get().category}/wind/crz`);
        } else {
          fpln.props.mfd.uiService.navigateTo(`fms/${fpln.props.mfd.uiService.activeUri.get().category}/wind/clb`);
        }
      },
    },
  ];
}
