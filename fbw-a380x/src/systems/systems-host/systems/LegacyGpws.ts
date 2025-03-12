import { Arinc429SignStatusMatrix, Arinc429Word, NXDataStore, UpdateThrottler } from '@flybywiresim/fbw-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { LegacySoundManager, soundList } from 'systems-host/systems/LegacySoundManager';
import { A380X_DEFAULT_RADIO_AUTO_CALL_OUTS, A380XRadioAutoCallOutFlags } from '../../shared/src/AutoCallOuts';
import { EventBus } from '@microsoft/msfs-sdk';
import { FwsSoundManagerControlEvents } from 'systems-host/systems/FlightWarningSystem/FwsSoundManager';

type ModesType = {
  current: number;
  previous: number;
  type: any[];
  onChange?: (arg0: number, arg1: number) => void;
};

/**
 * This 1:1 port from the A32NX's GPWS+FWS serves as temporary replacement, until a more sophisticated system simulation is in place.
 */
export class LegacyGpws {
  private updateThrottler = new UpdateThrottler(125); // has to be > 100 due to pulse nodes

  private pub = this.bus.getPublisher<FwsSoundManagerControlEvents>();

  autoCallOutPins: number;

  minimumsState = 0;

  Mode3MaxBaroAlt: number;

  Mode4MaxRAAlt: number;

  Mode2BoundaryLeaveAlt: number;

  Mode2NumTerrain: number;

  Mode2NumFramesInBoundary: number;

  RadioAltRate: number;

  prevRadioAlt: number;

  prevRadioAlt2: number;

  modes: ModesType[];

  PrevShouldPullUpPlay: boolean;

  AltCallState: LegacyStateMachine;

  RetardState: LegacyStateMachine;

  egpwsAlertDiscreteWord1 = Arinc429Word.empty();

  egpwsAlertDiscreteWord2 = Arinc429Word.empty();

  // eslint-disable-next-line camelcase
  constructor(
    private bus: EventBus,
    private soundManager: LegacySoundManager,
  ) {
    this.autoCallOutPins = A380X_DEFAULT_RADIO_AUTO_CALL_OUTS;

    this.minimumsState = 0;

    this.Mode3MaxBaroAlt = NaN;

    this.Mode4MaxRAAlt = NaN;

    this.Mode2BoundaryLeaveAlt = NaN;
    this.Mode2NumTerrain = 0;
    this.Mode2NumFramesInBoundary = 0;

    this.RadioAltRate = NaN;
    this.prevRadioAlt = NaN;
    this.prevRadioAlt2 = NaN;

    this.modes = [
      // Mode 1
      {
        // 0: no warning, 1: "sink rate", 2 "pull up"
        current: 0,
        previous: 0,
        type: [
          {},
          { sound: soundList.sink_rate, soundPeriod: 1.1, gpwsLight: true },
          { gpwsLight: true, pullUp: true },
        ],
      },
      // Mode 2 is currently inactive.
      {
        // 0: no warning, 1: "terrain", 2: "pull up"
        current: 0,
        previous: 0,
        type: [{}, { gpwsLight: true }, { gpwsLight: true, pullUp: true }],
      },
      // Mode 3
      {
        // 0: no warning, 1: "don't sink"
        current: 0,
        previous: 0,
        type: [{}, { sound: soundList.dont_sink, soundPeriod: 1.1, gpwsLight: true }],
      },
      // Mode 4
      {
        // 0: no warning, 1: "too low gear", 2: "too low flaps", 3: "too low terrain"
        current: 0,
        previous: 0,
        type: [
          {},
          { sound: soundList.too_low_gear, soundPeriod: 1.1, gpwsLight: true },
          { sound: soundList.too_low_flaps, soundPeriod: 1.1, gpwsLight: true },
          { sound: soundList.too_low_terrain, soundPeriod: 1.1, gpwsLight: true },
        ],
      },
      // Mode 5, not all warnings are fully implemented
      {
        // 0: no warning, 1: "glideslope", 2: "hard glideslope" (louder)
        current: 0,
        previous: 0,
        type: [{}, {}, {}],
        onChange: (current) => {
          this.setGlideSlopeWarning(current >= 1);
        },
      },
    ];

    this.PrevShouldPullUpPlay = false;

    this.AltCallState = createStateMachine(AltCallStateMachine);
    this.AltCallState.setState('ground');
    this.RetardState = createStateMachine(RetardStateMachine);
    this.RetardState.setState('landed');
  }

  gpwsUpdateDiscreteWords() {
    this.egpwsAlertDiscreteWord1.ssm = Arinc429SignStatusMatrix.NormalOperation;
    this.egpwsAlertDiscreteWord1.setBitValue(11, this.modes[0].current === 1);
    this.egpwsAlertDiscreteWord1.setBitValue(12, this.modes[0].current === 2);
    this.egpwsAlertDiscreteWord1.setBitValue(13, this.modes[1].current === 1);
    this.egpwsAlertDiscreteWord1.setBitValue(12, this.modes[1].current === 2);
    this.egpwsAlertDiscreteWord1.setBitValue(14, this.modes[2].current === 1);
    this.egpwsAlertDiscreteWord1.setBitValue(15, this.modes[3].current === 1);
    this.egpwsAlertDiscreteWord1.setBitValue(16, this.modes[3].current === 2);
    this.egpwsAlertDiscreteWord1.setBitValue(17, this.modes[3].current === 3);
    this.egpwsAlertDiscreteWord1.setBitValue(18, this.modes[4].current === 1);
    Arinc429Word.toSimVarValue(
      'L:A32NX_EGPWS_ALERT_1_DISCRETE_WORD_1',
      this.egpwsAlertDiscreteWord1.value,
      this.egpwsAlertDiscreteWord1.ssm,
    );
    Arinc429Word.toSimVarValue(
      'L:A32NX_EGPWS_ALERT_2_DISCRETE_WORD_1',
      this.egpwsAlertDiscreteWord1.value,
      this.egpwsAlertDiscreteWord1.ssm,
    );

    this.egpwsAlertDiscreteWord2.ssm = Arinc429SignStatusMatrix.NormalOperation;
    this.egpwsAlertDiscreteWord2.setBitValue(14, false);
    Arinc429Word.toSimVarValue(
      'L:A32NX_EGPWS_ALERT_1_DISCRETE_WORD_2',
      this.egpwsAlertDiscreteWord2.value,
      this.egpwsAlertDiscreteWord2.ssm,
    );
    Arinc429Word.toSimVarValue(
      'L:A32NX_EGPWS_ALERT_2_DISCRETE_WORD_2',
      this.egpwsAlertDiscreteWord2.value,
      this.egpwsAlertDiscreteWord2.ssm,
    );
  }

  setGlideSlopeWarning(state: boolean) {
    SimVar.SetSimVarValue('L:A32NX_GPWS_GS_Warning_Active', 'Bool', state ? 1 : 0); // Still need this for XML
    this.egpwsAlertDiscreteWord2.setBitValue(11, state);
    Arinc429Word.toSimVarValue(
      'L:A32NX_EGPWS_ALERT_1_DISCRETE_WORD_2',
      this.egpwsAlertDiscreteWord2.value,
      this.egpwsAlertDiscreteWord2.ssm,
    );
    Arinc429Word.toSimVarValue(
      'L:A32NX_EGPWS_ALERT_2_DISCRETE_WORD_2',
      this.egpwsAlertDiscreteWord2.value,
      this.egpwsAlertDiscreteWord2.ssm,
    );
  }

  setGpwsWarning(state: boolean) {
    SimVar.SetSimVarValue('L:A32NX_GPWS_Warning_Active', 'Bool', state ? 1 : 0); // Still need this for XML
    this.egpwsAlertDiscreteWord2.setBitValue(12, state);
    this.egpwsAlertDiscreteWord2.setBitValue(13, state);
    Arinc429Word.toSimVarValue(
      'L:A32NX_EGPWS_ALERT_1_DISCRETE_WORD_2',
      this.egpwsAlertDiscreteWord2.value,
      this.egpwsAlertDiscreteWord2.ssm,
    );
    Arinc429Word.toSimVarValue(
      'L:A32NX_EGPWS_ALERT_2_DISCRETE_WORD_2',
      this.egpwsAlertDiscreteWord2.value,
      this.egpwsAlertDiscreteWord2.ssm,
    );
  }

  init() {
    console.log('A32NX_GPWS init');

    this.setGlideSlopeWarning(false);
    this.setGpwsWarning(false);
    this.egpwsAlertDiscreteWord1.ssm = Arinc429SignStatusMatrix.NormalOperation;
    this.egpwsAlertDiscreteWord1.setBitValue(12, false);

    // eslint-disable-next-line max-len
    NXDataStore.getAndSubscribe(
      'CONFIG_A380X_FWC_RADIO_AUTO_CALL_OUT_PINS',
      (k, v) => k === 'CONFIG_A380X_FWC_RADIO_AUTO_CALL_OUT_PINS' && (this.autoCallOutPins = Number(v)),
      A380X_DEFAULT_RADIO_AUTO_CALL_OUTS.toString(),
    );
  }

  update(deltaTime: number) {
    const throttledT = this.updateThrottler.canUpdate(deltaTime);

    if (throttledT > 0) {
      this.gpws(throttledT);
    }
  }

  gpws(deltaTime) {
    // EGPWS receives ADR1 only
    const baroAlt = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_BARO_CORRECTED_ALTITUDE_1');
    const radioAlt1 = Arinc429Word.fromSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE');
    const radioAlt2 = Arinc429Word.fromSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE');
    const radioAlt = radioAlt1.isFailureWarning() || radioAlt1.isNoComputedData() ? radioAlt2 : radioAlt1;
    const radioAltValid = radioAlt.isNormalOperation();
    const onGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');

    this.UpdateAltState(radioAltValid ? radioAlt.value : NaN);
    this.differentiateRadioalt(radioAltValid ? radioAlt.value : NaN, deltaTime);

    const mda = SimVar.GetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet');
    const dh = SimVar.GetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet');
    const phase = SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum');

    if (
      radioAltValid &&
      radioAlt.value >= 10 &&
      radioAlt.value <= 2450 &&
      !SimVar.GetSimVarValue('L:A32NX_GPWS_SYS_OFF', 'Bool')
    ) {
      // Activate between 10 - 2450 radio alt unless SYS is off
      const flapsThreeSelected = SimVar.GetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'Bool');
      const FlapPosition = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number');
      const FlapsInLandingConfig = flapsThreeSelected ? FlapPosition === 3 : FlapPosition === 4; // fixme should be actual flap angle
      const vSpeed = Simplane.getVerticalSpeed();
      const Airspeed = SimVar.GetSimVarValue('AIRSPEED INDICATED', 'Knots');
      const gearExtended = SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'Percent') > 0.9;

      this.updateMaxRA(radioAlt.value, onGround, phase);

      this.GPWSMode1(this.modes[0], radioAlt.value, vSpeed);
      // Mode 2 is disabled because of an issue with the terrain height simvar which causes false warnings very frequently. See PR#1742 for more info
      // this.GPWSMode2(this.modes[1], radioAlt, Airspeed, FlapsInLandingConfig, gearExtended);
      this.GPWSMode3(this.modes[2], radioAlt.value, phase);
      this.GPWSMode4(this.modes[3], radioAlt.value, Airspeed, FlapsInLandingConfig, gearExtended, phase);
      this.GPWSMode5(this.modes[4], radioAlt.value);
    } else {
      this.modes.forEach((mode) => {
        mode.current = 0;
      });

      this.Mode3MaxBaroAlt = NaN;
      if (onGround || (radioAltValid && radioAlt.value < 10)) {
        this.Mode4MaxRAAlt = NaN;
      }

      this.setGlideSlopeWarning(false);
      this.setGpwsWarning(false);
    }

    this.GPWSComputeLightsAndCallouts();
    this.gpwsUpdateDiscreteWords();

    if (mda !== 0 || (dh !== -1 && dh !== -2 && dh !== -3 && phase === FmgcFlightPhase.Approach)) {
      let minimumsDA; // MDA or DH
      let minimumsIA; // radio or baro altitude
      if (dh >= 0) {
        minimumsDA = dh;
        minimumsIA = radioAlt.isNormalOperation() || radioAlt.isFunctionalTest() ? radioAlt.value : NaN;
      } else {
        minimumsDA = mda;
        minimumsIA = baroAlt.isNormalOperation() || baroAlt.isFunctionalTest() ? baroAlt.value : NaN;
      }
      if (Number.isFinite(minimumsDA) && Number.isFinite(minimumsIA)) {
        this.gpwsMinimums(minimumsDA, minimumsIA);
      }
    }
  }

  /**
   * Takes the derivative of the radio altimeter. Using central difference, to prevent high frequency noise
   * @param radioAlt - in feet
   * @param deltaTime - in milliseconds
   */
  differentiateRadioalt(radioAlt, deltaTime) {
    if (!Number.isNaN(this.prevRadioAlt2) && !Number.isNaN(radioAlt)) {
      this.RadioAltRate = (radioAlt - this.prevRadioAlt2) / (deltaTime / 1000 / 60) / 2;
      this.prevRadioAlt2 = this.prevRadioAlt;
      this.prevRadioAlt = radioAlt;
    } else if (!Number.isNaN(this.prevRadioAlt) && !Number.isNaN(radioAlt)) {
      this.prevRadioAlt2 = this.prevRadioAlt;
      this.prevRadioAlt = radioAlt;
    } else {
      this.prevRadioAlt2 = radioAlt;
    }
  }

  updateMaxRA(radioAlt, onGround, phase) {
    // on ground check is to get around the fact that radio alt is set to around 300 while loading
    if (onGround || phase === FmgcFlightPhase.GoAround) {
      this.Mode4MaxRAAlt = NaN;
    } else if (this.Mode4MaxRAAlt < radioAlt || Number.isNaN(this.Mode4MaxRAAlt)) {
      this.Mode4MaxRAAlt = radioAlt;
    }
  }

  gpwsMinimums(minimumsDA, minimumsIA) {
    let over100Above = false;
    let overMinimums = false;

    if (minimumsDA <= 90) {
      overMinimums = minimumsIA >= minimumsDA + 15;
      over100Above = minimumsIA >= minimumsDA + 115;
    } else {
      overMinimums = minimumsIA >= minimumsDA + 5;
      over100Above = minimumsIA >= minimumsDA + 105;
    }
    if (this.minimumsState === 0 && overMinimums) {
      this.minimumsState = 1;
    } else if (this.minimumsState === 1 && over100Above) {
      this.minimumsState = 2;
    } else if (this.minimumsState === 2 && !over100Above) {
      this.pub.pub('enqueueSound', 'hundred_above');
      this.minimumsState = 1;
    } else if (this.minimumsState === 1 && !overMinimums) {
      this.pub.pub('enqueueSound', 'minimums');
      this.minimumsState = 0;
    }
  }

  GPWSComputeLightsAndCallouts() {
    this.modes.forEach((mode) => {
      if (mode.current === mode.previous) {
        return;
      }

      const previousType = mode.type[mode.previous];
      this.soundManager.removePeriodicSound(previousType.sound);

      const currentType = mode.type[mode.current];
      this.soundManager.addPeriodicSound(currentType.sound, currentType.soundPeriod);

      if (mode.onChange) {
        mode.onChange(mode.current, mode.previous);
      }

      mode.previous = mode.current;
    });

    const activeTypes = this.modes.map((mode) => mode.type[mode.current]);

    const shouldPullUpPlay = activeTypes.some((type) => type.pullUp);
    if (shouldPullUpPlay !== this.PrevShouldPullUpPlay) {
      if (shouldPullUpPlay) {
        this.soundManager.addPeriodicSound(soundList.pull_up, 1.1);
      } else {
        this.soundManager.removePeriodicSound(soundList.pull_up);
      }
      this.PrevShouldPullUpPlay = shouldPullUpPlay;
    }

    const illuminateGpwsLight = activeTypes.some((type) => type.gpwsLight);
    this.setGpwsWarning(illuminateGpwsLight);
  }

  /**
   * Compute the GPWS Mode 1 state.
   * @param mode - The mode object which stores the state.
   * @param radioAlt - Radio altitude in feet
   * @param vSpeed - Vertical speed, in feet/min, should be inertial vertical speed, not sure if simconnect provides that
   */
  GPWSMode1(mode, radioAlt, vSpeed) {
    const sinkrate = -vSpeed;

    if (sinkrate <= 1000) {
      mode.current = 0;
      return;
    }

    const maxSinkrateAlt = 0.61 * sinkrate - 600;
    const maxPullUpAlt = sinkrate < 1700 ? 1.3 * sinkrate - 1940 : 0.4 * sinkrate - 410;

    if (radioAlt <= maxPullUpAlt) {
      mode.current = 2;
    } else if (radioAlt <= maxSinkrateAlt) {
      mode.current = 1;
    } else {
      mode.current = 0;
    }
  }

  /**
   * Compute the GPWS Mode 2 state.
   * @param mode - The mode object which stores the state.
   * @param radioAlt - Radio altitude in feet
   * @param speed - Airspeed in knots.
   * @param FlapsInLandingConfig - If flaps is in landing config
   * @param gearExtended - If the gear is deployed
   */
  GPWSMode2(mode, radioAlt, speed, FlapsInLandingConfig, gearExtended) {
    let IsInBoundary = false;
    const UpperBoundaryRate =
      -this.RadioAltRate < 3500 ? 0.7937 * -this.RadioAltRate - 1557.5 : 0.19166 * -this.RadioAltRate + 610;
    const UpperBoundarySpeed = Math.max(1650, Math.min(2450, 8.8888 * speed - 305.555));

    if (!FlapsInLandingConfig && -this.RadioAltRate > 2000) {
      if (radioAlt < UpperBoundarySpeed && radioAlt < UpperBoundaryRate) {
        this.Mode2NumFramesInBoundary += 1;
      } else {
        this.Mode2NumFramesInBoundary = 0;
      }
    } else if (FlapsInLandingConfig && -this.RadioAltRate > 2000) {
      if (radioAlt < 775 && radioAlt < UpperBoundaryRate && -this.RadioAltRate < 10000) {
        this.Mode2NumFramesInBoundary += 1;
      } else {
        this.Mode2NumFramesInBoundary = 0;
      }
    }
    // This is to prevent very quick changes in radio alt rate triggering the alarm. The derivative is sadly pretty jittery.
    if (this.Mode2NumFramesInBoundary > 5) {
      IsInBoundary = true;
    }

    if (IsInBoundary) {
      this.Mode2BoundaryLeaveAlt = -1;
      if (this.Mode2NumTerrain < 2 || gearExtended) {
        if (this.soundManager.tryPlaySound(soundList.too_low_terrain)) {
          // too low terrain is not correct, but no "terrain" call yet
          this.Mode2NumTerrain += 1;
        }
        mode.current = 1;
      } else if (!gearExtended) {
        mode.current = 2;
      }
    } else if (this.Mode2BoundaryLeaveAlt === -1) {
      this.Mode2BoundaryLeaveAlt = radioAlt;
    } else if (this.Mode2BoundaryLeaveAlt + 300 > radioAlt) {
      mode.current = 1;
      this.soundManager.tryPlaySound(soundList.too_low_terrain);
    } else if (this.Mode2BoundaryLeaveAlt + 300 <= radioAlt) {
      mode.current = 0;
      this.Mode2NumTerrain = 0;
      this.Mode2BoundaryLeaveAlt = NaN;
    }
  }

  /**
   * Compute the GPWS Mode 3 state.
   * @param mode - The mode object which stores the state.
   * @param radioAlt - Radio altitude in feet
   * @param phase - Flight phase index
   * @param FlapsInLandingConfig - If flaps is in landing config
   * @constructor
   */
  GPWSMode3(mode, radioAlt, phase) {
    if (
      !(phase === FmgcFlightPhase.Takeoff || phase === FmgcFlightPhase.GoAround) ||
      radioAlt > 1500 ||
      radioAlt < 10
    ) {
      this.Mode3MaxBaroAlt = NaN;
      mode.current = 0;
      return;
    }

    const baroAlt = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');

    const maxAltLoss = 0.09 * radioAlt + 7.1;

    if (baroAlt > this.Mode3MaxBaroAlt || Number.isNaN(this.Mode3MaxBaroAlt)) {
      this.Mode3MaxBaroAlt = baroAlt;
      mode.current = 0;
    } else if (this.Mode3MaxBaroAlt - baroAlt > maxAltLoss) {
      mode.current = 1;
    } else {
      mode.current = 0;
    }
  }

  /**
   * Compute the GPWS Mode 4 state.
   * @param mode - The mode object which stores the state.
   * @param radioAlt - Radio altitude in feet
   * @param speed - Airspeed in knots.
   * @param FlapsInLandingConfig - If flaps is in landing config
   * @param gearExtended - If the gear is extended
   * @param phase - Flight phase index
   * @constructor
   */
  GPWSMode4(mode, radioAlt, speed, FlapsInLandingConfig, gearExtended, phase) {
    if (radioAlt < 30 || radioAlt > 1000) {
      mode.current = 0;
      return;
    }
    const FlapModeOff = SimVar.GetSimVarValue('L:A32NX_GPWS_FLAP_OFF', 'Bool');

    // Mode 4 A and B logic
    if (!gearExtended && phase === FmgcFlightPhase.Approach) {
      if (speed < 190 && radioAlt < 500) {
        mode.current = 1;
      } else if (speed >= 190) {
        const maxWarnAlt = 8.333 * speed - 1083.333;
        mode.current = radioAlt < maxWarnAlt ? 3 : 0;
      }
    } else if (!FlapsInLandingConfig && !FlapModeOff && phase === FmgcFlightPhase.Approach) {
      if (speed < 159 && radioAlt < 245) {
        mode.current = 2;
      } else if (speed >= 159) {
        const maxWarnAlt = 8.2967 * speed - 1074.18;
        mode.current = radioAlt < maxWarnAlt ? 3 : 0;
      }
    } else {
      mode.current = 0;
    }
    if (!FlapsInLandingConfig || !gearExtended) {
      const maxWarnAltSpeed = Math.max(Math.min(8.3333 * speed - 1083.33, 1000), 500);
      const maxWarnAlt = 0.750751 * this.Mode4MaxRAAlt - 0.750751;

      if (this.Mode4MaxRAAlt > 100 && radioAlt < maxWarnAltSpeed && radioAlt < maxWarnAlt) {
        mode.current = 3;
      }
    }
  }

  /**
   * Compute the GPWS Mode 5 state.
   * @param mode - The mode object which stores the state.
   * @param - radioAlt Radio altitude in feet
   * @constructor
   */
  GPWSMode5(mode, radioAlt) {
    if (radioAlt > 1000 || radioAlt < 30 || SimVar.GetSimVarValue('L:A32NX_GPWS_GS_OFF', 'Bool')) {
      mode.current = 0;
      return;
    }
    if (!SimVar.GetSimVarValue('L:A32NX_RADIO_RECEIVER_GS_IS_VALID', 'number')) {
      mode.current = 0;
      return;
    }
    const error = SimVar.GetSimVarValue('L:A32NX_RADIO_RECEIVER_GS_DEVIATION', 'number');
    const dots = -error * 2.5; // According to the FCOM, one dot is approx. 0.4 degrees. 1/0.4 = 2.5

    const minAltForWarning = dots < 2.9 ? -75 * dots + 247.5 : 30;
    const minAltForHardWarning = dots < 3.8 ? -66.66 * dots + 283.33 : 30;

    if (dots > 2 && radioAlt > minAltForHardWarning && radioAlt < 350) {
      mode.current = 2;
    } else if (dots > 1.3 && radioAlt > minAltForWarning) {
      mode.current = 1;
    } else {
      mode.current = 0;
    }
  }

  UpdateAltState(radioAlt) {
    if (Number.isNaN(radioAlt)) {
      return;
    }
    switch (this.AltCallState.value) {
      case 'ground':
        if (radioAlt > 6) {
          this.AltCallState.action('up');
        }
        break;
      case 'over5':
        if (radioAlt > 12) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 6) {
          if (this.RetardState.value !== 'retardPlaying' && this.autoCallOutPins & A380XRadioAutoCallOutFlags.Five) {
            this.pub.pub('enqueueSound', 'alt_5');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over10':
        if (radioAlt > 22) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 12) {
          if (this.RetardState.value !== 'retardPlaying' && this.autoCallOutPins & A380XRadioAutoCallOutFlags.Ten) {
            this.pub.pub('enqueueSound', 'alt_10');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over20':
        if (radioAlt > 32) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 22) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.Twenty) {
            this.pub.pub('enqueueSound', 'alt_20');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over30':
        if (radioAlt > 42) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 32) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.Thirty) {
            this.pub.pub('enqueueSound', 'alt_30');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over40':
        if (radioAlt > 53) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 42) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.Forty) {
            this.pub.pub('enqueueSound', 'alt_40');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over50':
        if (radioAlt > 65) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 53) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.Fifty) {
            this.pub.pub('enqueueSound', 'alt_50');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over60':
        if (radioAlt > 75) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 63) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.Sixty) {
            this.pub.pub('enqueueSound', 'alt_60');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over70':
        if (radioAlt > 85) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 73) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.Seventy) {
            this.pub.pub('enqueueSound', 'alt_70');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over80':
        if (radioAlt > 95) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 83) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.Eighty) {
            this.pub.pub('enqueueSound', 'alt_80');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over90':
        if (radioAlt > 110) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 93) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.Ninety) {
            this.pub.pub('enqueueSound', 'alt_90');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over100':
        if (radioAlt > 210) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 110) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.OneHundred) {
            this.pub.pub('enqueueSound', 'alt_100');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over200':
        if (radioAlt > 310) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 210) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.TwoHundred) {
            this.pub.pub('enqueueSound', 'alt_200');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over300':
        if (radioAlt > 410) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 310) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.ThreeHundred) {
            this.pub.pub('enqueueSound', 'alt_300');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over400':
        if (radioAlt > 513) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 410) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.FourHundred) {
            this.pub.pub('enqueueSound', 'alt_400');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over500':
        if (radioAlt > 1020) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 513) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.FiveHundred) {
            this.pub.pub('enqueueSound', 'alt_500');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over1000':
        if (radioAlt > 2020) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 1020) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.OneThousand) {
            this.pub.pub('enqueueSound', 'alt_1000');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over2000':
        if (radioAlt > 2530) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 2020) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.TwoThousand) {
            this.pub.pub('enqueueSound', 'alt_2000');
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over2500':
        if (radioAlt <= 2530) {
          if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.TwoThousandFiveHundred) {
            this.pub.pub('enqueueSound', 'alt_2500');
          } else if (this.autoCallOutPins & A380XRadioAutoCallOutFlags.TwentyFiveHundred) {
            this.pub.pub('enqueueSound', 'alt_2500b');
          }
          this.AltCallState.action('down');
        }
        break;
      default:
        break;
    }

    switch (this.RetardState.value) {
      case 'overRetard':
        if (radioAlt < 20) {
          if (!SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_ACTIVE', 'Bool')) {
            this.RetardState.action('play');
            this.pub.pub('enqueueSound', 'retard');
          } else if (radioAlt < 10) {
            this.RetardState.action('play');
            this.pub.pub('enqueueSound', 'retard');
          }
        }
        break;
      case 'retardPlaying':
        if (
          SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number') < 2.6 ||
          SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number') < 2.6 ||
          SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:3', 'number') < 2.6 ||
          SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:4', 'number') < 2.6
        ) {
          this.RetardState.action('land');
          this.pub.pub('dequeueSound', 'retard');
        } else if (
          SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum') === FmgcFlightPhase.GoAround ||
          radioAlt > 20
        ) {
          this.RetardState.action('go_around');
          this.pub.pub('dequeueSound', 'retard');
        }
        break;
      case 'landed':
        if (radioAlt > 20) {
          this.RetardState.action('up');
        }
        break;
      default:
        break;
    }
  }
}

const RetardStateMachine = {
  overRetard: { transitions: { play: { target: 'retardPlaying' } } },
  retardPlaying: {
    transitions: {
      land: { target: 'landed' },
      go_around: { target: 'overRetard' },
    },
  },
  landed: { transitions: { up: { target: 'overRetard' } } },
};

const AltCallStateMachine = {
  init: 'ground',
  over2500: { transitions: { down: { target: 'over2000' } } },
  over2000: {
    transitions: {
      down: { target: 'over1000' },
      up: { target: 'over2500' },
    },
  },
  over1000: {
    transitions: {
      down: { target: 'over500' },
      up: { target: 'over2000' },
    },
  },
  over500: {
    transitions: {
      down: { target: 'over400' },
      up: { target: 'over1000' },
    },
  },
  over400: {
    transitions: {
      down: { target: 'over300' },
      up: { target: 'over500' },
    },
  },
  over300: {
    transitions: {
      down: { target: 'over200' },
      up: { target: 'over400' },
    },
  },
  over200: {
    transitions: {
      down: { target: 'over100' },
      up: { target: 'over300' },
    },
  },
  over100: {
    transitions: {
      down: { target: 'over90' },
      up: { target: 'over200' },
    },
  },
  over90: {
    transitions: {
      down: { target: 'over80' },
      up: { target: 'over100' },
    },
  },
  over80: {
    transitions: {
      down: { target: 'over70' },
      up: { target: 'over90' },
    },
  },
  over70: {
    transitions: {
      down: { target: 'over60' },
      up: { target: 'over80' },
    },
  },
  over60: {
    transitions: {
      down: { target: 'over50' },
      up: { target: 'over70' },
    },
  },
  over50: {
    transitions: {
      down: { target: 'over40' },
      up: { target: 'over60' },
    },
  },
  over40: {
    transitions: {
      down: { target: 'over30' },
      up: { target: 'over50' },
    },
  },
  over30: {
    transitions: {
      down: { target: 'over20' },
      up: { target: 'over40' },
    },
  },
  over20: {
    transitions: {
      down: { target: 'over10' },
      up: { target: 'over30' },
    },
  },
  over10: {
    transitions: {
      down: { target: 'over5' },
      up: { target: 'over20' },
    },
  },
  over5: {
    transitions: {
      down: { target: 'ground' },
      up: { target: 'over10' },
    },
  },
  ground: { transitions: { up: { target: 'over5' } } },
};

type LegacyStateMachine = {
  value: string;
  action(event: string): void;
  setState(newState: string): void;
};

const createStateMachine = (machineDef: any): LegacyStateMachine => {
  const machine = {
    value: machineDef.init,
    action(event: string) {
      const currStateDef = machineDef[machine.value];
      const destTransition = currStateDef.transitions[event];
      if (!destTransition) {
        return;
      }
      const destState = destTransition.target;

      machine.value = destState;
    },
    setState(newState: string) {
      const valid = machineDef[newState];
      if (valid) {
        machine.value = newState;
      }
    },
  };
  return machine;
};
