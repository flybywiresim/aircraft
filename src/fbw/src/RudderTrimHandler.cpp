#include "RudderTrimHandler.h"
#include <cmath>

RudderTrimHandler::RudderTrimHandler() {
  rateLimiter.setRate(RATE_LEFT_RIGHT);
}

void RudderTrimHandler::synchronizeValue(double value) {
  targetValue = value;
  rateLimiter.reset(value);
}

void RudderTrimHandler::onEventRudderTrimLeft(double dt) {
  rateLimiter.setRate(RATE_LEFT_RIGHT);
  if (targetValue == POSITION_RESET) {
    targetValue = rateLimiter.getValue();
  }
  targetValue = fmax(POSITION_MAX_LEFT, targetValue - (RATE_LEFT_RIGHT * dt));
}

void RudderTrimHandler::onEventRudderTrimReset() {
  rateLimiter.setRate(RATE_RESET);
  targetValue = POSITION_RESET;
}

void RudderTrimHandler::onEventRudderTrimRight(double dt) {
  rateLimiter.setRate(RATE_LEFT_RIGHT);
  if (targetValue == POSITION_RESET) {
    targetValue = rateLimiter.getValue();
  }
  targetValue = fmin(POSITION_MAX_RIGHT, targetValue + (RATE_LEFT_RIGHT * dt));
}

void RudderTrimHandler::onEventRudderTrimSet(double value) {
  rateLimiter.setRate(RATE_LEFT_RIGHT);
  targetValue = fmin(POSITION_MAX_RIGHT, fmax(POSITION_MAX_LEFT, value / SET_EVENT_DIVIDER));
}

void RudderTrimHandler::update(double dt) {
  rateLimiter.update(targetValue, dt);
}

double RudderTrimHandler::getPosition() {
  return rateLimiter.getValue();
}

double RudderTrimHandler::getTargetPosition() {
  return targetValue;
}
