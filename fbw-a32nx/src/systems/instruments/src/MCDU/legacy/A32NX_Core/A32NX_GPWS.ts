// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

// @ts-strict-ignore
import { Arinc429Word, NXDataStore, NXLogicConfirmNode, NXLogicTriggeredMonostableNode } from '@flybywiresim/fbw-sdk';
import { A32NX_Util } from '../../../../../shared/src/A32NX_Util';
import { A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS, A32NXRadioAutoCallOutFlags } from '@shared/AutoCallOuts';
import { soundList } from './A32NX_SoundManager';
import { FmgcFlightPhase } from '@shared/flightphase';

// FIXME move GPWS logic to systems host, and ACOs to PseudoFWC
export class A32NX_GPWS {
  private autoCallOutPins = A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS;

  private minimumsState = 0;

  private Mode4MaxRAAlt = 0;

  private RadioAltRate = NaN;
  private prevRadioAlt = NaN;
  private prevRadioAlt2 = NaN;

  private AltCallState = A32NX_Util.createMachine(AltCallStateMachine);

  private RetardState = A32NX_Util.createMachine(RetardStateMachine);

  private isAirVsGroundMode = SimVar.GetSimVarValue('L:A32NX_GPWS_GROUND_STATE', 'Bool') !== 1;
  private airborneFor5s = new NXLogicConfirmNode(5);
  private airborneFor10s = new NXLogicConfirmNode(10);

  private isApproachVsTakeoffState = SimVar.GetSimVarValue('L:A32NX_GPWS_APPROACH_STATE', 'Bool') === 1;

  private isOverflightDetected = new NXLogicTriggeredMonostableNode(60, false);
  // Only relevant if alternate mode 4b is enabled
  private isMode4aInhibited = false;

  private prevAuralWarning = 0;

  // PIN PROGs
  private isAudioDeclutterEnabled = false;
  private isAlternateMode4bEnabled = false;
  private isTerrainClearanceFloorEnabled = false;
  private isTerrainAwarenessEnabled = false;

  constructor(private core) {
    console.log('A32NX_GPWS constructed');

    this.AltCallState.setState('ground');
    this.RetardState.setState('landed');
  }

  init() {
    console.log('A32NX_GPWS init');

    NXDataStore.getAndSubscribeLegacy(
      'CONFIG_A32NX_FWC_RADIO_AUTO_CALL_OUT_PINS',
      (k, v) => k === 'CONFIG_A32NX_FWC_RADIO_AUTO_CALL_OUT_PINS' && (this.autoCallOutPins = Number(v)),
      A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS.toString(),
    );
  }

  update(deltaTime, _core) {
    this.gpws(deltaTime);
  }

  gpws(deltaTime) {
    // EGPWS receives ADR1 only
    const baroAlt = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_BARO_CORRECTED_ALTITUDE_1');
    const computedAirspeed = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED');
    const pitch = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_IR_1_PITCH');
    const radioAlt1 = Arinc429Word.fromSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE');
    const radioAlt2 = Arinc429Word.fromSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE');
    const radioAlt = radioAlt1.isFailureWarning() || radioAlt1.isNoComputedData() ? radioAlt2 : radioAlt1;
    const radioAltValid = radioAlt.isNormalOperation();
    const isOnGround = !this.isAirVsGroundMode;

    const isTerrModeOff = SimVar.GetSimVarValue('L:A32NX_GPWS_TERR_OFF', 'Bool') === 1;
    const isFlapModeOff = SimVar.GetSimVarValue('L:A32NX_GPWS_FLAP_OFF', 'Bool') === 1;
    const isLdgFlap3On = SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'Bool') === 1;

    const sfccFap5 = SimVar.GetSimVarValue('L:A32NX_SFCC_1_FAP_5', 'Bool') === 1; // Flaps > 19deg
    const sfccFap1 = SimVar.GetSimVarValue('L:A32NX_SFCC_1_FAP_1', 'Bool') === 1; // Flaps > 39deg

    const areFlapsInLandingConfig = isFlapModeOff || (isLdgFlap3On ? sfccFap5 : sfccFap1);
    const isGearDownLocked = SimVar.GetSimVarValue('L:A32NX_LGCIU_1_LEFT_GEAR_DOWNLOCKED', 'Bool') === 1;

    // TODO only use this in the air?
    const isNavAccuracyHigh = SimVar.GetSimVarValue('L:A32NX_FMGC_L_NAV_ACCURACY_HIGH', 'Bool') === 1;
    const isTcfOperational = this.isTerrainClearanceFloorOperational(isTerrModeOff, radioAlt, isNavAccuracyHigh);
    const isTafOperational = this.isTerrainAwarenessOperational(isTerrModeOff);

    this.UpdateAltState(radioAltValid ? radioAlt.value : NaN);
    this.differentiate_radioalt(radioAltValid ? radioAlt.value : NaN, deltaTime);

    const mda = SimVar.GetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet');
    const dh = SimVar.GetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet');

    this.update_maxRA(radioAlt, isOnGround);

    const isOverflightDetected = this.updateOverflightState(deltaTime);
    this.updateMode4aInhibited(isGearDownLocked, areFlapsInLandingConfig);

    this.updateAirGroundState(deltaTime, computedAirspeed, radioAlt, pitch);
    this.updateApproachTakeoffState(
      computedAirspeed,
      radioAlt,
      isGearDownLocked,
      areFlapsInLandingConfig,
      isTcfOperational,
      isTafOperational,
      isOverflightDetected,
    );

    this.GPWSComputeLightsAndCallouts();

    if (mda !== 0 || (dh !== -1 && dh !== -2 && this.isApproachVsTakeoffState)) {
      let minimumsDA; //MDA or DH
      let minimumsIA; //radio or baro altitude
      if (dh >= 0) {
        minimumsDA = dh;
        minimumsIA = radioAlt.isNormalOperation() || radioAlt.isFunctionalTest() ? radioAlt.value : NaN;
      } else {
        minimumsDA = mda;
        minimumsIA = baroAlt.isNormalOperation() || baroAlt.isFunctionalTest() ? baroAlt.value : NaN;
      }
      if (isFinite(minimumsDA) && isFinite(minimumsIA)) {
        this.gpws_minimums(minimumsDA, minimumsIA);
      }
    }
  }

  /**
   * Takes the derivative of the radio altimeter. Using central difference, to prevent high frequency noise
   * @param radioAlt - in feet
   * @param deltaTime - in milliseconds
   */
  differentiate_radioalt(radioAlt, deltaTime) {
    if (!isNaN(this.prevRadioAlt2) && !isNaN(radioAlt)) {
      this.RadioAltRate = (radioAlt - this.prevRadioAlt2) / (deltaTime / 1000 / 60) / 2;
      this.prevRadioAlt2 = this.prevRadioAlt;
      this.prevRadioAlt = radioAlt;
    } else if (!isNaN(this.prevRadioAlt) && !isNaN(radioAlt)) {
      this.prevRadioAlt2 = this.prevRadioAlt;
      this.prevRadioAlt = radioAlt;
    } else {
      this.prevRadioAlt2 = radioAlt;
    }
  }

  update_maxRA(radioAlt, isOnGround) {
    // on ground check is to get around the fact that radio alt is set to around 300 while loading
    if (isOnGround || this.isApproachVsTakeoffState) {
      this.Mode4MaxRAAlt = 0;
    } else if (radioAlt.isNormalOperation()) {
      this.Mode4MaxRAAlt = Math.max(this.Mode4MaxRAAlt, 0.75 * radioAlt.value);
    }
  }

  gpws_minimums(minimumsDA, minimumsIA) {
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
      this.core.soundManager.tryPlaySound(soundList.hundred_above);
      this.minimumsState = 1;
    } else if (this.minimumsState === 1 && !overMinimums) {
      this.core.soundManager.tryPlaySound(soundList.minimums);
      this.minimumsState = 0;
    }
  }

  GetWarningFromEnum(num: number) {
    switch (num) {
      case 1:
        return soundList.pull_up;
      case 2:
        return soundList.terrain;
      case 3:
        return soundList.too_low_terrain;
      case 4:
        return soundList.too_low_gear;
      case 5:
        return soundList.too_low_flaps;
      case 6:
        return soundList.sink_rate;
      case 7:
        return soundList.dont_sink;
      case 8:
        return soundList.glideslope_quiet;
      case 9:
        return soundList.glideslope_loud;
      case 10:
        return soundList.terrain_ahead;
      case 11:
        return soundList.obstacle_ahead;
      default:
        return '';
    }
  }

  GPWSComputeLightsAndCallouts() {
    const currentAuralWarning = SimVar.GetSimVarValue('L:A32NX_GPWS_AURAL_OUTPUT', 'number');
    if (currentAuralWarning !== this.prevAuralWarning) {
      if (currentAuralWarning !== 0) {
        this.core.soundManager.addPeriodicSound(this.GetWarningFromEnum(currentAuralWarning), 1.1);
      }
      this.core.soundManager.removePeriodicSound(this.GetWarningFromEnum(this.prevAuralWarning));

      this.prevAuralWarning = currentAuralWarning;
    }
  }

  UpdateAltState(radioAlt) {
    if (isNaN(radioAlt)) {
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
          if (this.RetardState.value !== 'retardPlaying' && this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Five) {
            this.core.soundManager.tryPlaySound(soundList.alt_5);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over10':
        if (radioAlt > 22) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 12) {
          if (this.RetardState.value !== 'retardPlaying' && this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Ten) {
            this.core.soundManager.tryPlaySound(soundList.alt_10);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over20':
        if (radioAlt > 32) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 22) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Twenty) {
            this.core.soundManager.tryPlaySound(soundList.alt_20);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over30':
        if (radioAlt > 42) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 32) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Thirty) {
            this.core.soundManager.tryPlaySound(soundList.alt_30);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over40':
        if (radioAlt > 53) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 42) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Forty) {
            this.core.soundManager.tryPlaySound(soundList.alt_40);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over50':
        if (radioAlt > 110) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 53) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Fifty) {
            this.core.soundManager.tryPlaySound(soundList.alt_50);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over100':
        if (radioAlt > 210) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 110) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.OneHundred) {
            this.core.soundManager.tryPlaySound(soundList.alt_100);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over200':
        if (radioAlt > 310) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 210) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.TwoHundred) {
            this.core.soundManager.tryPlaySound(soundList.alt_200);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over300':
        if (radioAlt > 410) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 310) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.ThreeHundred) {
            this.core.soundManager.tryPlaySound(soundList.alt_300);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over400':
        if (radioAlt > 513) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 410) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.FourHundred) {
            this.core.soundManager.tryPlaySound(soundList.alt_400);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over500':
        if (radioAlt > 1020) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 513) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.FiveHundred) {
            this.core.soundManager.tryPlaySound(soundList.alt_500);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over1000':
        if (radioAlt > 2020) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 1020) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.OneThousand) {
            this.core.soundManager.tryPlaySound(soundList.alt_1000);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over2000':
        if (radioAlt > 2530) {
          this.AltCallState.action('up');
        } else if (radioAlt <= 2020) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.TwoThousand) {
            this.core.soundManager.tryPlaySound(soundList.alt_2000);
          }
          this.AltCallState.action('down');
        }
        break;
      case 'over2500':
        if (radioAlt <= 2530) {
          if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred) {
            this.core.soundManager.tryPlaySound(soundList.alt_2500);
          } else if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.TwentyFiveHundred) {
            this.core.soundManager.tryPlaySound(soundList.alt_2500b);
          }
          this.AltCallState.action('down');
        }
        break;
    }

    switch (this.RetardState.value) {
      case 'overRetard':
        if (radioAlt < 20) {
          if (!SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_ACTIVE', 'Bool')) {
            this.RetardState.action('play');
            this.core.soundManager.addPeriodicSound(soundList.retard, 1.1);
          } else if (radioAlt < 10) {
            this.RetardState.action('play');
            this.core.soundManager.addPeriodicSound(soundList.retard, 1.1);
          }
        }
        break;
      case 'retardPlaying':
        if (
          SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number') < 2.6 ||
          SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number') < 2.6
        ) {
          this.RetardState.action('land');
          this.core.soundManager.removePeriodicSound(soundList.retard);
        } else if (
          SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum') === FmgcFlightPhase.GoAround ||
          radioAlt > 20
        ) {
          this.RetardState.action('go_around');
          this.core.soundManager.removePeriodicSound(soundList.retard);
        }
        break;
      case 'landed':
        if (radioAlt > 20) {
          this.RetardState.action('up');
        }
        break;
    }
  }

  updateAirGroundState(deltaTime, computedAirspeed, radioAlt, pitchAngle) {
    if (!computedAirspeed.isNormalOperation() || !radioAlt.isNormalOperation()) {
      // Stay in current state
      return;
    }

    this.airborneFor5s.write(
      computedAirspeed.value > 90 && radioAlt.value > 25 && pitchAngle.isNormalOperation() && pitchAngle.value > 5,
      deltaTime,
    );
    this.airborneFor10s.write(computedAirspeed.value > 90 && radioAlt.value > 25, deltaTime);

    if (this.isAirVsGroundMode) {
      if (radioAlt.value < 25) {
        this.isAirVsGroundMode = false;
        SimVar.SetSimVarValue('L:A32NX_GPWS_GROUND_STATE', 'Bool', 1);
      }
    } else {
      if (this.airborneFor5s.read() || this.airborneFor5s.read()) {
        this.isAirVsGroundMode = true;
        SimVar.SetSimVarValue('L:A32NX_GPWS_GROUND_STATE', 'Bool', 0);
      }
    }
  }

  updateApproachTakeoffState(
    computedAirspeed,
    radioAlt,
    isGearDown,
    areFlapsInLandingConfig,
    tcfOperational,
    tafOperational,
    isOverflightDetected,
  ) {
    // TODO: what do we do if computedAirspeed is not NO?
    if (!computedAirspeed.isNormalOperation()) {
      return;
    }

    if (this.isApproachVsTakeoffState) {
      // Switch to TO if we pass below 245 ft mode 4b floor without an alert (i.e gear down and flaps in landing config)
      if (radioAlt.isNormalOperation() && radioAlt.value < 245 && isGearDown && areFlapsInLandingConfig) {
        this.isApproachVsTakeoffState = false;
        SimVar.SetSimVarValue('L:A32NX_GPWS_APPROACH_STATE', 'Bool', 0);
      }
    } else {
      const isFirstAlgorithmSatisfied = false;
      // - 4C filter value exceeds 4A alert boundary
      const isSecondAlgorithmSatisfied =
        this.Mode4MaxRAAlt >
        this.mode4aUpperBoundary(
          computedAirspeed.value,
          areFlapsInLandingConfig,
          tcfOperational,
          tafOperational,
          isOverflightDetected,
        );

      if ((isFirstAlgorithmSatisfied || !this.isAudioDeclutterEnabled) && isSecondAlgorithmSatisfied) {
        this.isApproachVsTakeoffState = true;
        SimVar.SetSimVarValue('L:A32NX_GPWS_APPROACH_STATE', 'Bool', 1);
      }
    }
  }

  mode4aUpperBoundary(computedAirspeed, areFlapsInLandingConfig, tcfOperational, tafOperational, isOverflightDetected) {
    let expandedBoundary = 1000;
    if (areFlapsInLandingConfig || tcfOperational || tafOperational) {
      expandedBoundary = 500;
    } else if (isOverflightDetected) {
      expandedBoundary = 800;
    }

    return Math.max(500, Math.min(expandedBoundary, 8.333 * computedAirspeed - 1083.33));
  }

  mode4bUpperBoundary(computedAirspeed, areFlapsInLandingConfig, tcfOperational, tafOperational, isOverflightDetected) {
    let expandedBoundary = 1000;
    if (areFlapsInLandingConfig || tcfOperational || tafOperational) {
      expandedBoundary = 245;
    } else if (isOverflightDetected) {
      expandedBoundary = 800;
    }

    return Math.max(245, Math.min(expandedBoundary, 8.333 * computedAirspeed - 1083.33));
  }

  mode4cUpperBoundary(computedAirspeed) {
    return Math.max(500, Math.min(1000, 8.3333 * computedAirspeed.value - 1083.33));
  }

  updateOverflightState(deltaTime) {
    // Need -2200 ft/s to trigger an overflight state
    return this.isOverflightDetected.write(this.RadioAltRate < -2200 * 60, deltaTime);
  }

  isTerrainClearanceFloorOperational(terrPbOff, radioAlt, fmcNavAccuracyHigh) {
    // TODO when ground speed is below 60 kts, always consider fms nav accuracy high
    // where does GS come from?
    return this.isTerrainAwarenessEnabled && !terrPbOff && radioAlt.isNormalOperation() && fmcNavAccuracyHigh;
  }

  isTerrainAwarenessOperational(terrPbOff) {
    // TODO replace placeholders
    const doesTerrainAwarenessUseGeometricAltitude = true;
    const isGeometricAltitudeVfomValid = true;
    const isGeometricAltitudeHilValid = true;
    const geometricAltitudeVfom = 0;
    const isRaimFailureDetected = false;

    return (
      this.isTerrainAwarenessEnabled &&
      !terrPbOff &&
      !doesTerrainAwarenessUseGeometricAltitude &&
      isGeometricAltitudeVfomValid &&
      isGeometricAltitudeHilValid &&
      !isRaimFailureDetected &&
      geometricAltitudeVfom < 200
    );
  }

  updateMode4aInhibited(isGearDownLocked, isFlapsInLandingConfig) {
    if (this.isMode4aInhibited) {
      if (!this.isAirVsGroundMode || !this.isApproachVsTakeoffState) {
        // Reset
        this.isMode4aInhibited = false;
      }
    } else if (this.isAlternateMode4bEnabled) {
      if (isGearDownLocked || isFlapsInLandingConfig) {
        this.isMode4aInhibited = true;
      }
    }
  }

  selectAltitudeRate(inertialVs, baroVs) {
    if (inertialVs.isNormalOperation()) {
      return inertialVs.value;
    } else if (Number.isFinite(this.RadioAltRate)) {
      return this.RadioAltRate;
    } else if (baroVs.isNormalOperation()) {
      return baroVs.value;
    }

    return NaN;
  }
}

const RetardStateMachine = {
  overRetard: {
    transitions: {
      play: {
        target: 'retardPlaying',
      },
    },
  },
  retardPlaying: {
    transitions: {
      land: {
        target: 'landed',
      },
      go_around: {
        target: 'overRetard',
      },
    },
  },
  landed: {
    transitions: {
      up: {
        target: 'overRetard',
      },
    },
  },
};

const AltCallStateMachine = {
  init: 'ground',
  over2500: {
    transitions: {
      down: {
        target: 'over2000',
      },
    },
  },
  over2000: {
    transitions: {
      down: {
        target: 'over1000',
      },
      up: {
        target: 'over2500',
      },
    },
  },
  over1000: {
    transitions: {
      down: {
        target: 'over500',
      },
      up: {
        target: 'over2000',
      },
    },
  },
  over500: {
    transitions: {
      down: {
        target: 'over400',
      },
      up: {
        target: 'over1000',
      },
    },
  },
  over400: {
    transitions: {
      down: {
        target: 'over300',
      },
      up: {
        target: 'over500',
      },
    },
  },
  over300: {
    transitions: {
      down: {
        target: 'over200',
      },
      up: {
        target: 'over400',
      },
    },
  },
  over200: {
    transitions: {
      down: {
        target: 'over100',
      },
      up: {
        target: 'over300',
      },
    },
  },
  over100: {
    transitions: {
      down: {
        target: 'over50',
      },
      up: {
        target: 'over200',
      },
    },
  },
  over50: {
    transitions: {
      down: {
        target: 'over40',
      },
      up: {
        target: 'over100',
      },
    },
  },
  over40: {
    transitions: {
      down: {
        target: 'over30',
      },
      up: {
        target: 'over50',
      },
    },
  },
  over30: {
    transitions: {
      down: {
        target: 'over20',
      },
      up: {
        target: 'over40',
      },
    },
  },
  over20: {
    transitions: {
      down: {
        target: 'over10',
      },
      up: {
        target: 'over30',
      },
    },
  },
  over10: {
    transitions: {
      down: {
        target: 'over5',
      },
      up: {
        target: 'over20',
      },
    },
  },
  over5: {
    transitions: {
      down: {
        target: 'ground',
      },
      up: {
        target: 'over10',
      },
    },
  },
  ground: {
    transitions: {
      up: {
        target: 'over5',
      },
    },
  },
};
