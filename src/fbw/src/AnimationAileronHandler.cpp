#include "AnimationAileronHandler.h"
#include <cmath>

AnimationAileronHandler::AnimationAileronHandler() {
  rateLimiterLeft.setRate(RATE);
  rateLimiterRight.setRate(RATE);
}

void AnimationAileronHandler::update(bool groundSpoilersActive, double flapsPosition, double position, double dt) {
  isGroundSpoilersActive = groundSpoilersActive;

  double flapsBias = fmax(0.0, fmin(1.0, (flapsPosition - FLAPS_ANGLE_REFERENCE) / FLAPS_ANGLE_REFERENCE));
  droopBiasLeft = flapsBias * BIAS_DROOP_LEFT;
  droopBiasRight = flapsBias * BIAS_DROOP_RIGHT;

  if (!isGroundSpoilersActive) {
    targetValueLeft = fmax(-1.0, fmin(1.0, droopBiasLeft + position));
    targetValueRight = fmax(-1.0, fmin(1.0, droopBiasRight + position));
  } else {
    targetValueLeft = POSITION_ANTI_DROOP_LEFT;
    targetValueRight = POSITION_ANTI_DROOP_RIGHT;
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
