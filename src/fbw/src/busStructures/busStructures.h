#pragma once

#include "../Arinc429.h"

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
  Arinc429NumericWord rudderPosition;
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

// These EFCS interconnect buses are only an educated guess
struct ElacOutBus {};

struct SecOutBus {};

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

struct FacBus {
  // Label 71
  Arinc429NumericWord gammaT;
  // Label 77
  Arinc429NumericWord sideslipTarget;
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
  // Label 274
  Arinc429DiscreteWord discreteWord4;
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
  Arinc429NumericWord latitude;

  Arinc429NumericWord longitude;

  Arinc429NumericWord groundspeed;

  Arinc429NumericWord windspeed;

  Arinc429NumericWord windDirection;

  Arinc429NumericWord trackAngleTrue;

  Arinc429NumericWord trackAngleMagnetic;

  Arinc429NumericWord headingMagnetic;

  Arinc429NumericWord headingTrue;

  Arinc429NumericWord driftAngle;

  Arinc429NumericWord flightPathAngle;

  Arinc429NumericWord pitchAngle;

  Arinc429NumericWord rollAngle;

  Arinc429NumericWord bodyPitchRate;

  Arinc429NumericWord bodyRollRate;

  Arinc429NumericWord bodyYawRate;

  Arinc429NumericWord bodyLongAccel;

  Arinc429NumericWord bodyLatAccel;

  Arinc429NumericWord bodyNormalAccel;

  Arinc429NumericWord pitchAttRate;

  Arinc429NumericWord rollAttRate;

  Arinc429NumericWord inertialAlt;

  Arinc429NumericWord verticalAccel;

  Arinc429NumericWord inertialVerticalSpeed;

  Arinc429DiscreteWord discreteWord1;
};

struct AdirsBusses {
  AirDataBus adrBus;

  InertialReferenceBus irsBus;
};
