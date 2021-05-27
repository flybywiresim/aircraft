#include "AnimationAileronHandler.h"
#include <cmath>

AnimationAileronHandler::AnimationAileronHandler() {
  rateLimiterLeft.setRate(AILERON_RATE);
  rateLimiterRight.setRate(AILERON_RATE);
  rateLimiterDroop.setRate(DROOP_RATE);
  rateLimiterAntiDroop.setRate(ANTI_DROOP_RATE);
}

void AnimationAileronHandler::update(bool autopilotActive,
                                     bool groundSpoilersActive,
                                     double simulationTime,
                                     double pitchAttitudeDegrees,
                                     double flapsHandleIndex,
                                     double flapsPosition,
                                     double position,
                                     double dt) {
  // inhibit condition for anti-droop
  if (!areGroundSpoilersActive && groundSpoilersActive && autopilotActive) {
    antiDroopInhibited = true;
  } else if (!groundSpoilersActive) {
    antiDroopInhibited = false;
  }
  areGroundSpoilersActive = groundSpoilersActive;

  // anti-droop
  if (groundSpoilersActive && !antiDroopInhibited && (-pitchAttitudeDegrees) < ANTI_DROOP_PITCH_ATTITUDE_REFERENCE &&
      flapsHandleIndex > 0) {
    rateLimiterAntiDroop.update(ANTI_DROOP_BIAS_ON, dt);
  } else {
    rateLimiterAntiDroop.update(ANTI_DROOP_BIAS_OFF, dt);
  }

  // droop
  if ((lastFlapsPosition <= DROOP_MINIMUM_FLAPS_EXTENSION && flapsPosition > DROOP_MINIMUM_FLAPS_EXTENSION) ||
      (lastFlapsPosition > DROOP_MINIMUM_FLAPS_EXTENSION && flapsPosition <= DROOP_MINIMUM_FLAPS_EXTENSION)) {
    eventTime = simulationTime;
  }
  if (simulationTime - eventTime >= DROOP_TIME_SWITCH) {
    if (flapsPosition > DROOP_MINIMUM_FLAPS_EXTENSION) {
      targetValueDroop = DROOP_BIAS_ON;
    } else {
      targetValueDroop = DROOP_BIAS_OFF;
    }
  }
  rateLimiterDroop.update(targetValueDroop, dt);
  lastFlapsPosition = flapsPosition;

  // set target position
  rateLimiterLeft.update(fmax(-1.0, fmin(1.0, position + rateLimiterDroop.getValue() + rateLimiterAntiDroop.getValue())), dt);
  rateLimiterRight.update(fmax(-1.0, fmin(1.0, position - rateLimiterDroop.getValue() - rateLimiterAntiDroop.getValue())), dt);
}

double AnimationAileronHandler::getPositionLeft() {
  return rateLimiterLeft.getValue();
}

double AnimationAileronHandler::getPositionRight() {
  return rateLimiterRight.getValue();
}
