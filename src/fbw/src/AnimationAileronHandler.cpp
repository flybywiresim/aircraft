#include "AnimationAileronHandler.h"
#include <cmath>

AnimationAileronHandler::AnimationAileronHandler() {
  rateLimiterLeft.setRate(RATE);
  rateLimiterRight.setRate(RATE);
}

void AnimationAileronHandler::update(bool autopilotActive,
                                     bool groundSpoilersActive,
                                     double pitchAttitudeDegrees,
                                     double flapsHandleIndex,
                                     double flapsPosition,
                                     double position,
                                     double dt) {
  double flapsBias = fmax(0.0, fmin(1.0, (flapsPosition - FLAPS_ANGLE_REFERENCE) / FLAPS_ANGLE_REFERENCE));
  droopBiasLeft = flapsBias * BIAS_DROOP_LEFT;
  droopBiasRight = flapsBias * BIAS_DROOP_RIGHT;

  if (groundSpoilersActive && !autopilotActive && (-pitchAttitudeDegrees) < PITCH_ATTITUDE_REFERENCE && flapsHandleIndex > 0) {
    targetValueLeft = POSITION_ANTI_DROOP_LEFT;
    targetValueRight = POSITION_ANTI_DROOP_RIGHT;
  } else {
    targetValueLeft = fmax(-1.0, fmin(1.0, droopBiasLeft + position));
    targetValueRight = fmax(-1.0, fmin(1.0, droopBiasRight + position));
  }

  rateLimiterLeft.update(targetValueLeft, dt);
  rateLimiterRight.update(targetValueRight, dt);
}

double AnimationAileronHandler::getPositionLeft() {
  return rateLimiterLeft.getValue();
}

double AnimationAileronHandler::getPositionRight() {
  return rateLimiterRight.getValue();
}
