#pragma once

#include "../Arinc429.h"
#include "../model/ElacComputer_types.h"
#include "../model/SecComputer_types.h"

enum class LateralLaw {
  NormalLaw,
  DirectLaw,
  None,
};

enum class PitchLaw {
  NormalLaw,
  AlternateLaw1,
  AlternateLaw2,
  DirectLaw,
  None,
};

struct IlsBus {
  // Label 33
  Arinc429NumericWord ilsFreq;
  // Label 17
  Arinc429NumericWord runwayHeading;
  // Label 173
  Arinc429NumericWord locDeviation;
  // Label 174
  Arinc429NumericWord glideDeviation;
};

struct DmeBus {};

struct RaBus {
  // Label 164
  Arinc429NumericWord radioHeight;
};

struct FcdcBus {
  // Label 040
  Arinc429DiscreteWord efcsStatus1;
  // Label 041
  Arinc429DiscreteWord efcsStatus2;
  // Label 042
  Arinc429DiscreteWord efcsStatus3;
  // Label 043
  Arinc429DiscreteWord efcsStatus4;
  // Label 044
  Arinc429DiscreteWord efcsStatus5;
  // Label 301
  Arinc429NumericWord captRollCommand;
  // Label 302
  Arinc429NumericWord foRollCommand;
  // Label 304
  Arinc429NumericWord rudderPedalPosition;
  // Label 305
  Arinc429NumericWord captPitchCommand;
  // Label 306
  Arinc429NumericWord foPitchCommand;
  // Label 310
  Arinc429NumericWord aileronLeftPos;
  // Label 314
  Arinc429NumericWord elevatorLeftPos;
  // Label 330
  Arinc429NumericWord aileronRightPos;
  // Label 334
  Arinc429NumericWord elevatorRightPos;
  // Label 335 and/or 315, not sure
  Arinc429NumericWord horizStabTrimPos;
  // Label 361
  Arinc429NumericWord spoilerLeft1Pos;
  // Label 362
  Arinc429NumericWord spoilerLeft2Pos;
  // Label 363
  Arinc429NumericWord spoilerLeft3Pos;
  // Label 364
  Arinc429NumericWord spoilerLeft4Pos;
  // Label 365
  Arinc429NumericWord spoilerLeft5Pos;
  // Label 371
  Arinc429NumericWord spoilerRight1Pos;
  // Label 372
  Arinc429NumericWord spoilerRight2Pos;
  // Label 373
  Arinc429NumericWord spoilerRight3Pos;
  // Label 374
  Arinc429NumericWord spoilerRight4Pos;
  // Label 375
  Arinc429NumericWord spoilerRight5Pos;
};

// These EFCS interconnect buses are only educated guesses.
// Here is a bit table for the ELAC discrete Words:

// +=======+=====================================+=======+
// | Label |        Parameter Definition         | Bits  |
// +=======+=====================================+=======+
// |     1 | Discrete Word 1                     |       |
// +-------+-------------------------------------+-------+
// |       | Left Aileron Fault                  | 11    |
// +-------+-------------------------------------+-------+
// |       | Right Aileron Fault                 | 12    |
// +-------+-------------------------------------+-------+
// |       | Left Elevator Fault                 | 13    |
// +-------+-------------------------------------+-------+
// |       | Right Elevator Fault                | 14    |
// +-------+-------------------------------------+-------+
// |       | Left Aileron Avail                  | 15    |
// +-------+-------------------------------------+-------+
// |       | Right Aileron Avail                 | 16    |
// +-------+-------------------------------------+-------+
// |       | Left Elevator Avail                 | 17    |
// +-------+-------------------------------------+-------+
// |       | Right Elevator Avail                | 18    |
// +-------+-------------------------------------+-------+
// |       | Computer Engaged in Pitch           | 19    |
// +-------+-------------------------------------+-------+
// |       | Computer Engaged in Roll            | 20    |
// +-------+-------------------------------------+-------+
// |       | Computer Pitch Fault                | 21    |
// +-------+-------------------------------------+-------+
// |       | Computer Roll Fault                 | 22    |
// +-------+-------------------------------------+-------+
// |       | Active Pitch Law                    | 23-25 |
// +-------+-------------------------------------+-------+
// |       |    1 0 0 - Normal law               |       |
// +-------+-------------------------------------+-------+
// |       |    0 1 0 - Alternate law 1          |       |
// +-------+-------------------------------------+-------+
// |       |    1 1 0 - Alternate law 2          |       |
// +-------+-------------------------------------+-------+
// |       |    0 0 1 - Direct law               |       |
// +-------+-------------------------------------+-------+
// |       |    0 0 0 - None                     |       |
// +-------+-------------------------------------+-------+
// |       | Active Lateral Law                  | 26-27 |
// +-------+-------------------------------------+-------+
// |       |    1 0 - Normal law                 |       |
// +-------+-------------------------------------+-------+
// |       |    0 1 - Direct Law                 |       |
// +-------+-------------------------------------+-------+
// |       |    0 0 - None                       |       |
// +-------+-------------------------------------+-------+
// |       | Spoiler Pair 3 Roll Active Command  | 28    |
// +-------+-------------------------------------+-------+
// |       | Spoiler Pair 2 Roll Active Command  | 29    |
// +-------+-------------------------------------+-------+
// |       |                                     |       |
// +-------+-------------------------------------+-------+
// |     2 | Discrete Word 2                     |       |
// +-------+-------------------------------------+-------+
// |       | Pitch law Capability                | 11-12 |
// +-------+-------------------------------------+-------+
// |       |    1 0 - Normal law                 |       |
// +-------+-------------------------------------+-------+
// |       |    0 1 - Alternate law              |       |
// +-------+-------------------------------------+-------+
// |       |    1 1 - Direct law                 |       |
// +-------+-------------------------------------+-------+
// |       |    0 0 - None                       |       |
// +-------+-------------------------------------+-------+
// |       | Lateral law Capability              | 13-14 |
// +-------+-------------------------------------+-------+
// |       |    1 0 - Normal law                 |       |
// +-------+-------------------------------------+-------+
// |       |    0 1 - Direct Law                 |       |
// +-------+-------------------------------------+-------+
// |       |    0 0 - None                       |       |
// +-------+-------------------------------------+-------+
// |       | Left Sidestick Fault                | 15    |
// +-------+-------------------------------------+-------+
// |       | Right Sidestick Fault               | 16    |
// +-------+-------------------------------------+-------+
// |       | Left sidestick disabled (priority)  | 17    |
// +-------+-------------------------------------+-------+
// |       | Right sidestick disabled (priority) | 18    |
// +-------+-------------------------------------+-------+
// |       | Left sidestick priority locked      | 19    |
// +-------+-------------------------------------+-------+
// |       | Right sidestick priority locked     | 20    |
// +-------+-------------------------------------+-------+
// |       | Aileron Droop active                | 21    |
// +-------+-------------------------------------+-------+
// |       | Any AP engaged                      | 22    |
// +-------+-------------------------------------+-------+
// |       | Alpha protection active             | 23    |
// +-------+-------------------------------------+-------+

struct ElacOutBus {
  // Surface positions
  Arinc429NumericWord leftAileronPosition;

  Arinc429NumericWord rightAileronPosition;

  Arinc429NumericWord leftElevatorPosition;

  Arinc429NumericWord rightElevatorPosition;

  Arinc429NumericWord thsPosition;
  // Sidestick/Rudder pedal posititons;
  Arinc429NumericWord leftSidestickPitchCommand;

  Arinc429NumericWord rightSidestickPitchCommand;

  Arinc429NumericWord leftSidestickRollCommand;

  Arinc429NumericWord rightSidestickRollCommand;

  Arinc429NumericWord rudderPedalPosition;
  // Aileron command for cross-ELAC roll command execution
  Arinc429NumericWord aileronCommand;

  Arinc429NumericWord rollSpoilerCommand;
  // Yaw Damper command for the FACs
  Arinc429NumericWord yawDamperCommand;

  Arinc429NumericWord elevatorDualPressurizationCommand;
  // Discrete status words
  Arinc429DiscreteWord discreteStatusWord1;

  Arinc429DiscreteWord discreteStatusWord2;
};

// Bit table for SEC discrete words

// +=======+=====================================+=======+
// | Label |        Parameter Definition         | Bits  |
// +=======+=====================================+=======+
// |     1 | Discrete Word 1                     |       |
// +-------+-------------------------------------+-------+
// |       | Spoiler 1 Fault                     | 11    |
// +-------+-------------------------------------+-------+
// |       | Spoiler 2 Fault                     | 12    |
// +-------+-------------------------------------+-------+
// |       | Left Elevator Fault                 | 13    |
// +-------+-------------------------------------+-------+
// |       | Right Elevator Fault                | 14    |
// +-------+-------------------------------------+-------+
// |       | Spoiler 1 Avail                     | 15    |
// +-------+-------------------------------------+-------+
// |       | Spoiler 2 Avail                     | 16    |
// +-------+-------------------------------------+-------+
// |       | Left Elevator Avail                 | 17    |
// +-------+-------------------------------------+-------+
// |       | Right Elevator Avail                | 18    |
// +-------+-------------------------------------+-------+
// |       | Active Pitch Law                    | 19-21 |
// +-------+-------------------------------------+-------+
// |       |    0 1 0 - Alternate law 1          |       |
// +-------+-------------------------------------+-------+
// |       |    1 1 0 - Alternate law 2          |       |
// +-------+-------------------------------------+-------+
// |       |    0 0 1 - Direct law               |       |
// +-------+-------------------------------------+-------+
// |       |    0 0 0 - None                     |       |
// +-------+-------------------------------------+-------+
// |       | Computer Engaged in Lateral         | 22    |
// +-------+-------------------------------------+-------+
// |       | Computer Engaged in Pitch           | 23    |
// +-------+-------------------------------------+-------+
// |       | Ground Spoiler Fault                | 24    |
// +-------+-------------------------------------+-------+
// |       | Ground Spoiler Out                  | 25    |
// +-------+-------------------------------------+-------+
// |       | Ground Spoiler Armed                | 26    |
// +-------+-------------------------------------+-------+
// |       |                                     |       |
// +-------+-------------------------------------+-------+
// |     2 | Discrete Word 2                     |       |
// +-------+-------------------------------------+-------+
// |       | Left Sidestick Fault                | 11    |
// +-------+-------------------------------------+-------+
// |       | Right Sidestick Fault               | 12    |
// +-------+-------------------------------------+-------+
// |       | Left sidestick disabled (priority)  | 13    |
// +-------+-------------------------------------+-------+
// |       | Right sidestick disabled (priority) | 14    |
// +-------+-------------------------------------+-------+
// |       | Left sidestick priority locked      | 15    |
// +-------+-------------------------------------+-------+
// |       | Right sidestick priority locked     | 16    |
// +-------+-------------------------------------+-------+
// |       | LGCIU Uplock Disagree or Fault      | 17    |
// +-------+-------------------------------------+-------+
// |       | Any L/G not uplocked                | 18    |
// +-------+-------------------------------------+-------+

struct SecOutBus {
  // Surface positions
  Arinc429NumericWord leftSpoiler1Position;

  Arinc429NumericWord rightSpoiler1Position;

  Arinc429NumericWord leftSpoiler2Position;

  Arinc429NumericWord rightSpoiler2Position;

  Arinc429NumericWord leftElevatorPosition;

  Arinc429NumericWord rightElevatorPosition;

  Arinc429NumericWord thsPosition;

  // Sidestick / Speed brake lever positions
  // SEC 1&2 only
  Arinc429NumericWord leftSidestickPitchCommand;
  // SEC 1&2 only
  Arinc429NumericWord rightSidestickPitchCommand;

  Arinc429NumericWord leftSidestickRollCommand;

  Arinc429NumericWord rightSidestickRollCommand;

  Arinc429NumericWord speedBrakeLeverCommand;

  // Thrust Lever Angles, for ELAC and FCDC
  Arinc429NumericWord thrustLeverAngle1;

  Arinc429NumericWord thrustLeverAngle2;

  // Discrete status words
  Arinc429DiscreteWord discreteStatusWord1;

  Arinc429DiscreteWord discreteStatusWord2;
};

struct FmgcABus {
  // Label 140
  Arinc429NumericWord rollFdCommand;
  // Label 141
  Arinc429NumericWord pitchFdCommand;
  // Label 143
  Arinc429NumericWord yawFdCommand;
  // Label 144
  Arinc429NumericWord accuracyInput;
  // Label 145
  Arinc429DiscreteWord discreteWord5;
  // Label 146
  Arinc429DiscreteWord discreteWord4;
  // Label 270
  Arinc429DiscreteWord discreteWordAthr;
  // Label 271
  Arinc429DiscreteWord discreteWordAthrFma;
  // Label 273
  Arinc429DiscreteWord discreteWord3;
  // Label 274
  Arinc429DiscreteWord discreteWord1;
  // Label 275
  Arinc429DiscreteWord discreteWord2;
  // Label 276
  Arinc429DiscreteWord discreteWord6;
  // Label 277
  Arinc429DiscreteWord discreteWord7;
  // Label 317
  Arinc429NumericWord track;
  // Label 320
  Arinc429NumericWord heading;
  // Label 206
  Arinc429NumericWord cas;
  // Label 205
  Arinc429NumericWord mach;
  // Label 365
  Arinc429NumericWord vs;
  // Label 322
  Arinc429NumericWord fpa;
};

struct FmgcBBus {
  // Label 164
  Arinc429NumericWord fgRadioHeight;
  // Label 310
  Arinc429DiscreteWord deltaPAileronCmd;
  // Label 311
  Arinc429DiscreteWord deltaPSpoilerCmd;
  // Label 312
  Arinc429DiscreteWord deltaRCmd;
  // Label 313
  Arinc429DiscreteWord deltaQCmd;
};

struct FacBus {
  // Label 47
  Arinc429DiscreteWord discreteWord1;
  // Label 70
  Arinc429NumericWord gammaA;
  // Label 71
  Arinc429NumericWord gammaT;
  // Label 74
  Arinc429NumericWord weight;
  // Label 76
  Arinc429NumericWord centerOfGravity;
  // Label 77
  Arinc429NumericWord sideslipTarget;
  // Label 127
  Arinc429NumericWord facSlatAngle;
  // Label 137
  Arinc429NumericWord facFlapAngle;
  // Label 146
  Arinc429DiscreteWord discreteWord2;
  // Label 167
  Arinc429NumericWord rudderTravelLimitCommand;
  // Label 172
  Arinc429NumericWord deltaRYawDamperVoted;
  // Label 226
  Arinc429NumericWord estimatedSideslip;
  // Label 243
  Arinc429NumericWord vAlphaLim;
  // Label 245
  Arinc429NumericWord vLs;
  // Label 246
  Arinc429NumericWord vStall;
  // Label 247
  Arinc429NumericWord vAlphaProt;
  // Label 256
  Arinc429NumericWord vStallWarn;
  // Label 262
  Arinc429NumericWord speedTrend;
  // Label 263
  Arinc429NumericWord v3;
  // Label 264
  Arinc429NumericWord v4;
  // Label 265
  Arinc429NumericWord vMan;
  // Label 266
  Arinc429NumericWord vMax;
  // Label 267
  Arinc429NumericWord vFeNext;
  // Label 271
  Arinc429DiscreteWord discreteWord3;
  // Label 273
  Arinc429DiscreteWord discreteWord4;
  // Label 274
  Arinc429DiscreteWord discreteWord5;
  // Label 312
  Arinc429DiscreteWord deltaRRudderTrim;
  // Label 313
  Arinc429DiscreteWord rudderTrimPos;
};

struct FadecBus {
  Arinc429NumericWord thrustLeverAngle;

  Arinc429NumericWord n1Max;

  Arinc429NumericWord n1Limit;

  Arinc429NumericWord n1Idle;

  Arinc429DiscreteWord statusWord2;
};

struct FcuBus {
  // Label 101
  Arinc429NumericWord selectedHeading;
  // Label 102
  Arinc429NumericWord selectedAltitude;
  // Label 103
  Arinc429NumericWord selectedAirspeed;
  // Label 104
  Arinc429NumericWord selectedVerticalSpeed;
  // Label 106
  Arinc429NumericWord selectedMach;
  // Label 114
  Arinc429NumericWord selectedTrack;
  // Label 115
  Arinc429NumericWord selectedFpa;
  // Label 214
  Arinc429NumericWord flexToTemp;
  // Label 234
  Arinc429NumericWord baroCorrectionHpaLeft;
  // Label 235
  Arinc429NumericWord baroCorrectionInhgLeft;
  // Label 236
  Arinc429NumericWord baroCorrectionHpaRight;
  // Label 237
  Arinc429NumericWord baroCorrectionInhgRight;
  // Label 343
  Arinc429NumericWord n1AthrCommand;
  // Label 270
  Arinc429DiscreteWord fcuAtsWord;
  // Label 147
  Arinc429DiscreteWord fcuAtsFmaWord;
  // Label 271
  Arinc429DiscreteWord fcuEisWord1Left;
  // Label 271
  Arinc429DiscreteWord fcuEisWord1Right;
  // Label 272
  Arinc429DiscreteWord fcuEisWord2Left;
  // Label 272
  Arinc429DiscreteWord fcuEisWord2Right;
  // Label 273
  Arinc429DiscreteWord fcuDiscreteWord2;
  // Label 274
  Arinc429DiscreteWord fcuDiscreteWord1;
};

// These are not the complete Bus contents, there are
// some more labels that I have left out for now
struct AirDataBus {
  // Label 203
  Arinc429NumericWord altitudeStandard;
  // Label 204
  Arinc429NumericWord altitudeCorrected;
  // Label 205
  Arinc429NumericWord mach;
  // Label 206
  Arinc429NumericWord airspeedComputed;
  // Label 210
  Arinc429NumericWord airspeedTrue;
  // Label 212
  Arinc429NumericWord verticalSpeed;
  // Label 241
  Arinc429NumericWord aoaCorrected;
};

// Same here
struct InertialReferenceBus {
  // Label 270
  Arinc429DiscreteWord discreteWord1;
  // Label 310
  Arinc429NumericWord latitude;
  // Label 311
  Arinc429NumericWord longitude;
  // Label 312
  Arinc429NumericWord groundspeed;
  // Label 313
  Arinc429NumericWord trackAngleTrue;
  // Label 314
  Arinc429NumericWord headingTrue;
  // Label 315
  Arinc429NumericWord windspeed;
  // Label 316
  Arinc429NumericWord windDirectionTrue;
  // Label 317
  Arinc429NumericWord trackAngleMagnetic;
  // Label 320
  Arinc429NumericWord headingMagnetic;
  // Label 321
  Arinc429NumericWord driftAngle;
  // Label 322
  Arinc429NumericWord flightPathAngle;
  // Label 323
  Arinc429NumericWord flightPathAcceleration;
  // Label 324
  Arinc429NumericWord pitchAngle;
  // Label 325
  Arinc429NumericWord rollAngle;
  // Label 326
  Arinc429NumericWord bodyPitchRate;
  // Label 327
  Arinc429NumericWord bodyRollRate;
  // Label 330
  Arinc429NumericWord bodyYawRate;
  // Label 331
  Arinc429NumericWord bodyLongAccel;
  // Label 332
  Arinc429NumericWord bodyLatAccel;
  // Label 333
  Arinc429NumericWord bodyNormalAccel;
  // Label 335
  Arinc429NumericWord trackAngleRate;
  // Label 336
  Arinc429NumericWord pitchAttRate;
  // Label 337
  Arinc429NumericWord rollAttRate;
  // Label 361
  Arinc429NumericWord inertialAlt;
  // Label 362
  Arinc429NumericWord alongTrackHorizAcc;
  // Label 363
  Arinc429NumericWord crossTrackHorizAcc;
  // Label 364
  Arinc429NumericWord verticalAccel;
  // Label 365
  Arinc429NumericWord inertialVerticalSpeed;
  // Label 366
  Arinc429NumericWord northSouthVelocity;
  // Label 367
  Arinc429NumericWord eastWestVelocity;
};

struct AdirsBusses {
  AirDataBus adrBus;

  InertialReferenceBus irsBus;
};

struct SfccBus {
  // Label 45
  Arinc429DiscreteWord slatFlapComponentStatus;
  // Label 46
  Arinc429DiscreteWord slatFlapSystemStatus;
  // Label 47
  Arinc429DiscreteWord slatFlapActualPosition;
  // Label 127
  Arinc429NumericWord slatActualPosition;
  // Label 137
  Arinc429NumericWord flapActualPosition;
};

struct LgciuBus {
  // Label 20
  Arinc429DiscreteWord discreteWord1;
  // Label 21
  Arinc429DiscreteWord discreteWord2;
  // Label 22
  Arinc429DiscreteWord discreteWord3;
  // Label 23
  Arinc429DiscreteWord discreteWord4;
};
