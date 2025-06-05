import { MFDMessageId, MFDMessageType } from './MFDMessage';

// wildcards need to marked with %
export const MFDMessageTranslation: { id: MFDMessageId; type: MFDMessageType; lines: string[] }[] = [
  {
    id: MFDMessageId.AircraftPositionNotValid,
    type: MFDMessageType.TypeII,
    lines: ['ACFT POSITION NOT VALID'],
  },
  {
    id: MFDMessageId.AdjustDesiredTrackOrHeading,
    type: MFDMessageType.TypeII,
    lines: ['ADJUST DESIRED TRK OR HDG'],
  },
  {
    id: MFDMessageId.AdjustingSpdDueToRta,
    type: MFDMessageType.TypeII,
    lines: ['ADJUST SPD DUE TO RTA'],
  },
  {
    id: MFDMessageId.AirwayWptDisagree,
    type: MFDMessageType.TypeI,
    lines: ['AIRWAY / WPT DISAGREE'],
  },
  {
    id: MFDMessageId.AirwayWptDisagree,
    type: MFDMessageType.TypeI,
    lines: ['AIRWAY / WPT DISAGREE'],
  },
  {
    id: MFDMessageId.AirwaysInsertionInProgress,
    type: MFDMessageType.TypeII,
    lines: ['AIRWAYS INSERTION IN PROGRESS:', 'F-PLN REVISION NOT ALLOWED'],
  },
  {
    id: MFDMessageId.AlignIrs,
    type: MFDMessageType.TypeII,
    lines: ['ALIGN IRS'],
  },
  {
    id: MFDMessageId.AreaRnp,
    type: MFDMessageType.TypeII,
    lines: ['AREA RNP IS %'],
  },
  {
    id: MFDMessageId.GpsPositionDisagree,
    type: MFDMessageType.TypeI,
    lines: ['ARPT REF / GPS POSITION DISAGREE'],
  },
  {
    id: MFDMessageId.LastIrsPositionDisagree,
    type: MFDMessageType.TypeI,
    lines: ['ARPT REF / LAST IRS POSITION', 'DISAGREE'],
  },
  {
    id: MFDMessageId.AtcFlightplanInserted,
    type: MFDMessageType.TypeII,
    lines: ['ACT F-PLN INSERTED IN SEC 3'],
  },
  {
    id: MFDMessageId.AtcFlightplanInserted,
    type: MFDMessageType.TypeII,
    lines: ['ACT F-PLN INSERTED IN SEC 3', 'REJECTED INFO SEE SEC / INDEX'],
  },
  {
    id: MFDMessageId.AtcFlightplanInserted,
    type: MFDMessageType.TypeII,
    lines: ['ACT F-PLN INSERTED IN SEC 3', 'REJECTED INFO SEE SEC / INDEX'],
  },
  {
    id: MFDMessageId.CabinRateExceeded,
    type: MFDMessageType.TypeII,
    lines: ['CABIN RATE EXCEEDED'],
  },
  {
    id: MFDMessageId.CheckAlternateWind,
    type: MFDMessageType.TypeII,
    lines: ['CHECK ALTN WIND'],
  },
  {
    id: MFDMessageId.CheckApproachSelect,
    type: MFDMessageType.TypeII,
    lines: ['CHECK APPR SEL'],
  },
  {
    id: MFDMessageId.CheckCompanyRoute,
    type: MFDMessageType.TypeII,
    lines: ['CHECK CPNY RTE'],
  },
  {
    id: MFDMessageId.CheckDatabaseCycle,
    type: MFDMessageType.TypeII,
    lines: ['CHECK DATABASE CYCLE'],
  },
  {
    id: MFDMessageId.CheckDestinationData,
    type: MFDMessageType.TypeII,
    lines: ['CHECK DEST DATA'],
  },
  {
    id: MFDMessageId.CheckEngineOutSpeed,
    type: MFDMessageType.TypeII,
    lines: ['CHECK EO SPD SETTING'],
  },
  {
    id: MFDMessageId.CheckIrs,
    type: MFDMessageType.TypeII,
    lines: ['CHECK IRS / ARPT POSITION'],
  },
  {
    id: MFDMessageId.CheckFlightnumber,
    type: MFDMessageType.TypeII,
    lines: ['CHECK FLT NUMBER'],
  },
  {
    id: MFDMessageId.CheckIrsPosition,
    type: MFDMessageType.TypeII,
    lines: ['CHECK IRS % / FMS POSITION'],
  },
  {
    id: MFDMessageId.CheckMinimumFuelAtDestination,
    type: MFDMessageType.TypeII,
    lines: ['CHECK MIN FUEL AT DEST'],
  },
  {
    id: MFDMessageId.CheckNorthReference,
    type: MFDMessageType.TypeII,
    lines: ['CHECK NORTH REF'],
  },
  {
    id: MFDMessageId.CheckOnsideFms,
    type: MFDMessageType.TypeII,
    lines: ['CHECK ONSIDE FMS P/N'],
  },
  {
    id: MFDMessageId.CheckSpeedMode,
    type: MFDMessageType.TypeII,
    lines: ['CHECK SPD MODE'],
  },
  {
    id: MFDMessageId.CheckTakeOffData,
    type: MFDMessageType.TypeII,
    lines: ['CHECK T.O DATA'],
  },
  {
    id: MFDMessageId.CheckZeroFuelWeight,
    type: MFDMessageType.TypeII,
    lines: ['CHECK ZFW'],
  },
  {
    id: MFDMessageId.CompanyFlightplanAndLoadReceived,
    type: MFDMessageType.TypeII,
    lines: ['COMPANY F-PLN & LOAD DATA', 'RECEIVED WAITING FOR INSERTION'],
  },
  {
    id: MFDMessageId.CompanyFlightplanReceived,
    type: MFDMessageType.TypeII,
    lines: ['COMPANY F-PLN RECEIVED', 'WAITING FOR INSERTION'],
  },
  {
    id: MFDMessageId.CompanyLoadReceived,
    type: MFDMessageType.TypeII,
    lines: ['COMPANY LOAD DATA RECEIVED WAITING', 'FOR INSERTION'],
  },
  {
    id: MFDMessageId.CompanyMessageInsertion,
    type: MFDMessageType.TypeII,
    lines: ['COMPANY MSG INSERTION IN PROGRESS'],
  },
  {
    id: MFDMessageId.CompanyTakeOffDataReceived,
    type: MFDMessageType.TypeII,
    lines: ['COMPANY T.O DATA RECEIVED WAITING', 'FOR INSERTION'],
  },
  {
    id: MFDMessageId.CompanyWindDataReceived,
    type: MFDMessageType.TypeII,
    lines: ['COMPANY WIND DATA RECEIVED WAITING', 'FOR INSERTION IN ACTIVE'],
  },
  {
    id: MFDMessageId.CompanyWindDataReceivedSecondary,
    type: MFDMessageType.TypeII,
    lines: ['COMPANY WIND DATA RECEIVED WAITING', 'FOR INSERTION IN SEC %'],
  },
  {
    id: MFDMessageId.CompanyWindPending,
    type: MFDMessageType.TypeII,
    lines: ['COMPANY WIND UPLINK PENDING'],
  },
  {
    id: MFDMessageId.ConstraintAboveCruise,
    type: MFDMessageType.TypeII,
    lines: ['CONSTRAINTS ABOVE CRZ FL: DELETED'],
  },
  {
    id: MFDMessageId.ConstraintBefore,
    type: MFDMessageType.TypeII,
    lines: ['CONSTRAINTS BEFORE %: DELETED'],
  },
  {
    id: MFDMessageId.CostIndexInUse,
    type: MFDMessageType.TypeI,
    lines: ['COST INDEX-% IN USE'],
  },
  {
    id: MFDMessageId.CruiseAboveMaxFlightlevel,
    type: MFDMessageType.TypeII,
    lines: ['CRZ FL ABOVE MAX FL'],
  },
  {
    id: MFDMessageId.DestinationCompanyRouteDisagree,
    type: MFDMessageType.TypeI,
    lines: ['DEST / ALTN CPNY RTE DISAGREE'],
  },
  {
    id: MFDMessageId.DestinationEndFuelOnBoardBelowMin,
    type: MFDMessageType.TypeII,
    lines: ['DEST EFOB BELOW MIN'],
  },
  {
    id: MFDMessageId.DraftWind,
    type: MFDMessageType.TypeI,
    lines: ['DRAFT WIND INSERTED'],
  },
  {
    id: MFDMessageId.EnterDestinationData,
    type: MFDMessageType.TypeII,
    lines: ['ENTER DEST DATA'],
  },
  {
    id: MFDMessageId.EntryNotInList,
    type: MFDMessageType.TypeI,
    lines: ['ENTRY NOT IN LIST'],
  },
  {
    id: MFDMessageId.EntryOutOfRange,
    type: MFDMessageType.TypeI,
    lines: ['ENTRY OUT OF RANGE'],
  },
  {
    id: MFDMessageId.ExpectTurnAreaExceedance,
    type: MFDMessageType.TypeII,
    lines: ['EXPECT TURN AREA EXCEEDANCE'],
  },
  {
    id: MFDMessageId.ExtendSpeedBrakes,
    type: MFDMessageType.TypeII,
    lines: ['EXTEND SPD BRK'],
  },
  {
    id: MFDMessageId.GroundspeedBasedOnIsa,
    type: MFDMessageType.TypeII,
    lines: ['F-G/S BASED ON ISA'],
  },
  {
    id: MFDMessageId.FlightNumberReceived,
    type: MFDMessageType.TypeII,
    lines: ['FLT NUMBER RECEIVED'],
  },
  {
    id: MFDMessageId.AircraftStatusDisagree,
    type: MFDMessageType.TypeII,
    lines: ['FMCS ACT STATUS DISAGREE'],
  },
  {
    id: MFDMessageId.AircraftStatusDisagreeIndependent,
    type: MFDMessageType.TypeII,
    lines: ['FMCS ACFT STATUS DISAGREE', 'INDEPENDENT OPERATION'],
  },
  {
    id: MFDMessageId.FmcsPinTypeDisagree,
    type: MFDMessageType.TypeII,
    lines: ['FMCS PIN PROG TYPE DISAGREE'],
  },
  {
    id: MFDMessageId.FmcsPinTypeDisagreeIndependent,
    type: MFDMessageType.TypeII,
    lines: ['FMCS PIN PROG TYPE DISAGREE', 'INDEPENDENT OPERATION'],
  },
  {
    id: MFDMessageId.FmsDatalinkNotAvailable,
    type: MFDMessageType.TypeII,
    lines: ['FMS DATALINK NOT AVAIL'],
  },
  {
    id: MFDMessageId.FmsGrossweightDisagree,
    type: MFDMessageType.TypeII,
    lines: ['FMS1 / FMS2 GW DISAGREE'],
  },
  {
    id: MFDMessageId.FmsPositionDisagree,
    type: MFDMessageType.TypeII,
    lines: ['FMS1 / FMS2 POSITION DISAGREE'],
  },
  {
    id: MFDMessageId.FmsSpeedTargetDisagree,
    type: MFDMessageType.TypeII,
    lines: ['FMS1 / FMS2 SPD TARGET DISAGREE'],
  },
  {
    id: MFDMessageId.FormatError,
    type: MFDMessageType.TypeI,
    lines: ['FORMAT ERROR'],
  },
  {
    id: MFDMessageId.FormatErrorEnterAltBefore,
    type: MFDMessageType.TypeI,
    lines: ['FORMAT ERROR ENTER ALT BEFORE', 'PLACE/DIST'],
  },
  {
    id: MFDMessageId.FlightplanElementRetained,
    type: MFDMessageType.TypeI,
    lines: ['F-PLN ELEMENT RETAINED'],
  },
  {
    id: MFDMessageId.FlightplanFull,
    type: MFDMessageType.TypeII,
    lines: ['F-PLN FULL'],
  },
  {
    id: MFDMessageId.GpsDeselected,
    type: MFDMessageType.TypeII,
    lines: ['GPS DESELECTED'],
  },
  {
    id: MFDMessageId.GpsPrimary,
    type: MFDMessageType.TypeII,
    lines: ['GPS PRIMARY'],
  },
  {
    id: MFDMessageId.GpsPrimaryLost,
    type: MFDMessageType.TypeII,
    lines: ['GPS PRIMARY LOST'],
  },
  {
    id: MFDMessageId.GlideDeselected,
    type: MFDMessageType.TypeII,
    lines: ['GLIDE DESELECTED'],
  },
  {
    id: MFDMessageId.IndependentOperation,
    type: MFDMessageType.TypeII,
    lines: ['INDEPENDENT OPERATION'],
  },
  {
    id: MFDMessageId.InitializeZeroFuelWeight,
    type: MFDMessageType.TypeII,
    lines: ['INITIALIZE ZWF / ZFWCG'],
  },
  {
    id: MFDMessageId.InsertOrEraseTemporaryFlightplan,
    type: MFDMessageType.TypeI,
    lines: ['INSERT OR ERASE TMPY F-PLN', 'FIRST'],
  },
  {
    id: MFDMessageId.LateralDiscontinuityAhead,
    type: MFDMessageType.TypeII,
    lines: ['LATERAL DISCONTINUITY AHEAD'],
  },
  {
    id: MFDMessageId.MachSegmentDeleted,
    type: MFDMessageType.TypeII,
    lines: ['MACH SEGMENT DELETED'],
  },
  {
    id: MFDMessageId.NavAccuracyDowngraded,
    type: MFDMessageType.TypeII,
    lines: ['NAV ACCUR DOWNGRADED'],
  },
  {
    id: MFDMessageId.NavAccuracyUpgraded,
    type: MFDMessageType.TypeII,
    lines: ['NAV ACCUR UPGRADED'],
  },
  {
    id: MFDMessageId.NewAccelerationAltitude,
    type: MFDMessageType.TypeII,
    lines: ['NEW ACCEL ALT: %'],
  },
  {
    id: MFDMessageId.NewCruiseAltitude,
    type: MFDMessageType.TypeII,
    lines: ['NEW CRZ ALT: %'],
  },
  {
    id: MFDMessageId.NewThrustReductionAltitude,
    type: MFDMessageType.TypeII,
    lines: ['NEW THR RED ALT: %'],
  },
  {
    id: MFDMessageId.NoCompanyReply,
    type: MFDMessageType.TypeII,
    lines: ['NO COMPANY REPLY'],
  },
  {
    id: MFDMessageId.NoFlsForApproach,
    type: MFDMessageType.TypeII,
    lines: ['NO FLS FOR THIS APPR'],
  },
  {
    id: MFDMessageId.NoIntersectionFound,
    type: MFDMessageType.TypeI,
    lines: ['NO INTERSECTION FOUND'],
  },
  {
    id: MFDMessageId.NoNavInterception,
    type: MFDMessageType.TypeII,
    lines: ['NO NAV INTERCEPTION'],
  },
  {
    id: MFDMessageId.NotAllowed,
    type: MFDMessageType.TypeI,
    lines: ['NOT ALLOWED'],
  },
  {
    id: MFDMessageId.NotAllowedDatabaseAirport,
    type: MFDMessageType.TypeI,
    lines: ['NOT ALLOWED', 'DATABASE ARPTS ONLY'],
  },
  {
    id: MFDMessageId.NotInDatabase,
    type: MFDMessageType.TypeI,
    lines: ['NOT IN DATABASE'],
  },
  {
    id: MFDMessageId.NotTransmittedToAcr,
    type: MFDMessageType.TypeII,
    lines: ['NOT TRANSMITTED TO ACR'],
  },
  {
    id: MFDMessageId.PilotRoutesListFull,
    type: MFDMessageType.TypeI,
    lines: ['PILOT RTES LIST FULL'],
  },
  {
    id: MFDMessageId.PlaceOrDistanceInTransition,
    type: MFDMessageType.TypeI,
    lines: ['PLACE / DIST IN TRANS'],
  },
  {
    id: MFDMessageId.PlaceOrWaypointDisagree,
    type: MFDMessageType.TypeI,
    lines: ['PLACE / WPT DISAGREE'],
  },
  {
    id: MFDMessageId.PleaseWait,
    type: MFDMessageType.TypeI,
    lines: ['PLEASE WAIT'],
  },
  {
    id: MFDMessageId.PleaseWaitForCompanyFlightplan,
    type: MFDMessageType.TypeI,
    lines: ['PLEASE WAIT FOR COMPANY F-PLN', 'UPLINK'],
  },
  {
    id: MFDMessageId.PleaseWaitForFmsResynch,
    type: MFDMessageType.TypeI,
    lines: ['PLEASE WAIT FOR FMS RESYNCH'],
  },
  {
    id: MFDMessageId.PrinterNotAvailable,
    type: MFDMessageType.TypeII,
    lines: ['PRINTER NOT AVAIL'],
  },
  {
    id: MFDMessageId.ProcedureRnpExceeded,
    type: MFDMessageType.TypeII,
    lines: ['PROC RNP IS %'],
  },
  {
    id: MFDMessageId.ReceivedAtcMessageInvalid,
    type: MFDMessageType.TypeII,
    lines: ['RECEIVED ATC MSG NOT VALID'],
  },
  {
    id: MFDMessageId.ReceivedCompanyFlightplanNotValid,
    type: MFDMessageType.TypeII,
    lines: ['RECEIVED COMPANY F-PLN', 'NOT VALID'],
  },
  {
    id: MFDMessageId.ReceivedCompanyLoadDataNotValid,
    type: MFDMessageType.TypeII,
    lines: ['RECEIVED COMPANY LOAD DATA', 'NOT VALID'],
  },
  {
    id: MFDMessageId.ReceivedCompanyWindDataNotValid,
    type: MFDMessageType.TypeII,
    lines: ['RECEIVED COMPANY WIND DATA', 'NOT VALID'],
  },
  {
    id: MFDMessageId.ReceivedCompanyTakeOfDataNotValid,
    type: MFDMessageType.TypeII,
    lines: ['RECEIVED COMPANY T.O DATA', 'NOT VALID'],
  },
  {
    id: MFDMessageId.ReceivedFlightnumberNotValid,
    type: MFDMessageType.TypeII,
    lines: ['RECEIVED COMPANY T.O DATA', 'NOT VALID'],
  },
  {
    id: MFDMessageId.ReenterZerofuelweight,
    type: MFDMessageType.TypeII,
    lines: ['REENTER ZFW / ZFWCG'],
  },
  {
    id: MFDMessageId.RetractSpeedBrakes,
    type: MFDMessageType.TypeII,
    lines: ['RETRACT SPD BRK'],
  },
  {
    id: MFDMessageId.RtaAlreadyExists,
    type: MFDMessageType.TypeI,
    lines: ['RTA ALREADY EXISTING'],
  },
  {
    id: MFDMessageId.RtaDeleted,
    type: MFDMessageType.TypeII,
    lines: ['RTA DELETED'],
  },
  {
    id: MFDMessageId.RtaNotConsidered,
    type: MFDMessageType.TypeII,
    lines: ['RTA NOT CONSIDERED FOR FUEL', 'PLANNING'],
  },
  {
    id: MFDMessageId.RouteIdentAlreadyUsed,
    type: MFDMessageType.TypeI,
    lines: ['RTE IDENT ALREADY USED'],
  },
  {
    id: MFDMessageId.RunwayDisagree,
    type: MFDMessageType.TypeII,
    lines: ['RUNWAY / LS DISAGREE'],
  },
  {
    id: MFDMessageId.SelectHeadingTrackFirst,
    type: MFDMessageType.TypeI,
    lines: ['SLECT HDG OR TRK FIRST'],
  },
  {
    id: MFDMessageId.SelectTrueNorth,
    type: MFDMessageType.TypeII,
    lines: ['SELECT TRUE NORTH REF'],
  },
  {
    id: MFDMessageId.SetHoldSpeed,
    type: MFDMessageType.TypeII,
    lines: ['SET HOLD SPD'],
  },
  {
    id: MFDMessageId.SomeRevisionNotStored,
    type: MFDMessageType.TypeII,
    lines: ['SOME REVISIONS NOT STORED'],
  },
  {
    id: MFDMessageId.SpeedErrorAt,
    type: MFDMessageType.TypeII,
    lines: ['SPD ERROR AT %'],
  },
  {
    id: MFDMessageId.SpeedLimitExceeded,
    type: MFDMessageType.TypeII,
    lines: ['SPD LIMIT EXCEEDED'],
  },
  {
    id: MFDMessageId.SpecifiedNdbNotAvailable,
    type: MFDMessageType.TypeII,
    lines: ['SPECIF NDB NOT AVAIL'],
  },
  {
    id: MFDMessageId.SpecifiedVorNotAvailable,
    type: MFDMessageType.TypeII,
    lines: ['SPECIF VOR-D NOT AVAIL'],
  },
  {
    id: MFDMessageId.StepAboveMaxFlightlevel,
    type: MFDMessageType.TypeII,
    lines: ['STEP ABOVE MAX FL'],
  },
  {
    id: MFDMessageId.StepAhead,
    type: MFDMessageType.TypeII,
    lines: ['STEP AHEAD'],
  },
  {
    id: MFDMessageId.StepDeleted,
    type: MFDMessageType.TypeII,
    lines: ['STEP DELETED'],
  },
  {
    id: MFDMessageId.TopOfDescendReached,
    type: MFDMessageType.TypeII,
    lines: ['T/D REACHED'],
  },
  {
    id: MFDMessageId.TimeErrorAt,
    type: MFDMessageType.TypeII,
    lines: ['TIME ERROR AT %'],
  },
  {
    id: MFDMessageId.TimeMarkerReached,
    type: MFDMessageType.TypeII,
    lines: ['TIME MARKER REACHED'],
  },
  {
    id: MFDMessageId.TimeToExit,
    type: MFDMessageType.TypeII,
    lines: ['TIME TO EXIT'],
  },
  {
    id: MFDMessageId.TooSteepPathAhead,
    type: MFDMessageType.TypeII,
    lines: ['TOO STEEP PATH AHEAD'],
  },
  {
    id: MFDMessageId.TakeOfSpeedTooLow,
    type: MFDMessageType.TypeII,
    lines: ['T.O SPEED TOO LOW -', 'CHECK TOW & T.O DATA'],
  },
  {
    id: MFDMessageId.TakeOfTimeReached,
    type: MFDMessageType.TypeII,
    lines: ['T.O TIME REACHED'],
  },
  {
    id: MFDMessageId.TrueNorthEntryExpected,
    type: MFDMessageType.TypeI,
    lines: ['TRUE NORTH REFERENCED ENTRY', 'EXPECTED'],
  },
  {
    id: MFDMessageId.TuneNavaid,
    type: MFDMessageType.TypeII,
    lines: ['TUNE % %'],
  },
  {
    id: MFDMessageId.VSpeedDisagree,
    type: MFDMessageType.TypeII,
    lines: ['V1/VR/V2 DISAGREE'],
  },
  {
    id: MFDMessageId.NavaidDeselected,
    type: MFDMessageType.TypeI,
    lines: ['% IS DESELECTED'],
  },
  {
    id: MFDMessageId.RunwaysStorageFull,
    type: MFDMessageType.TypeI,
    lines: ['10 RWYS MAX : ALL IN USE'],
  },
  {
    id: MFDMessageId.WaypointsStorageFull,
    type: MFDMessageType.TypeI,
    lines: ['50 WPTS MAX : ALL IN USE'],
  },
  {
    id: MFDMessageId.NavaidsStorageFull,
    type: MFDMessageType.TypeI,
    lines: ['20 NAVAIDS MAX : ALL IN USE'],
  },
];
