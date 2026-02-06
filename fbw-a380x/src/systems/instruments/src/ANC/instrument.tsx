import { EventBus, FSComponent, HEventPublisher } from '@microsoft/msfs-sdk';

var flightphase = {
  "WelcomeOnboard": 0,
  "SafetyBriefing": 0,
  "CrewSeatsTakeoff": 0,
  "SeatbeltSignOff": 0,
  "StartingDecent": 0,
  "CrewPrepareLanding": 0,
  "ArrivalDeboarding": 0
};
/**
 * Resetting the flightphase to simulate turnaround or new flight
 */




/**
 * 
 * @param varCat - Category if either L Var or A var 
 * @param variableName - Name of the SimVar to be executed
 * @param type - Type of SimVar
 * @param value - Value of the SimVar, for L Vars consider only Numbers
 */


function setSimvarTrigger(varCat, variableName, type, value) {
  if (varCat === "L") {
    SimVar.SetSimVarValue(`L:${variableName}`, `${type}`, value);
  } else if (varCat === "A") {
    SimVar.SetSimVarValue(`${variableName}`, `${type}`, value);
  }
  setTimeout(function() {
    SimVar.SetSimVarValue(`L:${variableName}`, `${type}`, 0);
  }, 1e4);
}
class A380X_ANC extends BaseInstrument {

  private readonly hEventPublisher: HEventPublisher;

  constructor() {
    super();
  this.bus = new EventBus();
  
  this.airspeedPublisher = new SimVarPublisher(new Map([
      ["indicated_airspeed", { name: "AIRSPEED INDICATED", type: "knots" }],
      ["true_airspeed", { name: "AIRSPEED TRUE", type: "knots" }],
      ["mach", { name: "AIRSPEED MACH", type: "number" }],
      ["pressure_altitude", { name: "PRESSURE ALTITUDE", type: "feet" }],
      ["vertical_speed", { name: "VERTICAL SPEED", type: "feet per minute" }],
      ["total_air_temperature", { name: "TOTAL AIR TEMPERATURE", type: "celsius" }],
      ["static_air_temperature", { name: "AMBIENT TEMPERATURE", type: "celsius" }]
    ]), this.bus);

    this.onGroundPublisher = new SimVarPublisher(new Map([
      ["is_on_ground", { name: "SIM ON GROUND", type: "number" }]
    ]), this.bus);

    this.LVarPublisher = new SimVarPublisher( new Map([
      ["seatbelt_sign_on", { name: "L:XMLVAR_SWITCH_OVHD_INTLT_SEATBELT_Position", type: "number" }],
      ["passengers_boarding", { name: "L:A32NX_SOUND_PAX_BOARDING", type: "number" }],
      ["passengers_deboarding", { name: "L:A32NX_SOUND_PAX_DEBOARDING", type: "number" }]
    ]), this.bus);
    this.isOnGround = 0;
    this.indicatedAirspeed = 0;
    this.pressureAltitude = 0;
    this.verticalSpeed = 0;
    this.leftParkingGate = 0;
    this.seatbeltsignState = 0;
    this.passengerboarding = 0;
    this.passengerdeboarding = 0;
  }

  get templateID(): string {
    return 'A380X_ANC';
  }
  
 public connectedCallback(): void {
    super.connectedCallback();
    this.airspeedPublisher.startPublish();
    this.onGroundPublisher.startPublish();
    this.LVarPublisher.startPublish();

    const airDataSubscriber = this.bus.getSubscriber();
    const onGroundSubscriber = this.bus.getSubscriber();
    const LVarSubscriber = this.bus.getSubscriber();

    airDataSubscriber.on("indicated_airspeed").handle((value) => this.indicatedAirspeed = value);
    airDataSubscriber.on("pressure_altitude").handle((value) => this.pressureAltitude = value);
    airDataSubscriber.on("vertical_speed").handle((value) => this.verticalSpeed = value);
    onGroundSubscriber.on("is_on_ground").handle((value) => this.isOnGround = value);
    LVarSubscriber.on("seatbelt_sign_on").whenChanged().handle((value) => this.seatbeltsignState = value);
    LVarSubscriber.on("passengers_boarding").whenChanged().handle((value) => this.passengerboarding = value);
    LVarSubscriber.on("passengers_deboarding").whenChanged().handle((value) => this.passengerdeboarding = value);
    window.setInterval(() => this.checkAnnouncementCondition(), 30000);
  }
  public Update(): void {
    super.Update();
    this.airspeedPublisher.onUpdate();
    this.onGroundPublisher.onUpdate();
    this.LVarPublisher.onUpdate();
  }
  checkAnnouncementCondition() {
    console.log("ANC_FUNCTION_TRIGGERED");
    console.log(this.passengerboarding);
    console.log(flightphase);
    if (this.isOnGround && this.passengerboarding === 1 && flightphase["WelcomeOnboard"] !== 1) {
      console.log("ANC_1");
      setSimvarTrigger("L", "A380X_WELCOME_ANC", "boolean", 1);
      flightphase["WelcomeOnboard"] = 1;
    } else if (this.isOnGround && this.seatbeltsignState < 2 && flightphase["SafetyBriefing"] !== 1) {
      setSimvarTrigger("L", "A380X_SAFETY_ANC", "boolean", 1);
      flightphase["SafetyBriefing"] = 1;
    } else if (this.isOnGround && this.indicatedAirspeed > 10 && flightphase["CrewSeatsTakeoff"] !== 1) {
      console.log("ANC_2");
      setTimeout(function() {
        setSimvarTrigger("L", "A380X_PREPARE_TAKEOFF_ANC", "boolean", 1);
      }, 3e4);
      flightphase["CrewSeatsTakeoff"] = 1;
    } else if (this.pressureAltitude >= 7e3 && this.pressureAltitude <= 12e3 && this.verticalSpeed >= 500 && flightphase["SeatbeltSignOff"] !== 1) {
      console.log("ANC_3");
      setSimvarTrigger("L", "A380X_SERVICE_START_ANC", "boolean", 1);
      flightphase["SeatbeltSignOff"] = 1;
    } else if (this.pressureAltitude >= 2e4 && this.pressureAltitude <= 45e3 && this.verticalSpeed <= -500 && flightphase["StartingDecent"] !== 1) {
      console.log("ANC_4");
      setSimvarTrigger("L", "A380X_START_DECENT_ANC", "boolean", 1);
      flightphase["StartingDecent"] = 1;
    } else if (this.pressureAltitude >= 2500 && this.pressureAltitude <= 1e4 && this.verticalSpeed <= -500 && flightphase["CrewPrepareLanding"] !== 1) {
      console.log("ANC_4");
      setSimvarTrigger("L", "A380X_PREPARE_LANDING_ANC", "boolean", 1);
      flightphase["CrewPrepareLanding"] = 1;
    } else if (this.isOnGround && this.indicatedAirspeed < 10 && flightphase["CrewPrepareLanding"] === 1 && flightphase["ArrivalDeboarding"] !== 1) {
      console.log("ANC_4");
      setSimvarTrigger("L", "A380X_ARRIVAL_ANC", "boolean", 1);
      flightphase["ArrivalDeboarding"] = 1;
      resetAnnouncements();
    }
  }
};
registerInstrument("a380x-anc", A380X_ANC)