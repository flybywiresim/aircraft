#include "ElevatorTrimHandler.h"
#include <cmath>
#include <iostream>

void ElevatorTrimHandler::synchronizeValue(double value) {
  targetValue = value;
}

void ElevatorTrimHandler::onEventElevatorTrimUp() {
  targetValue = fmin(POSITION_MAX_UP, targetValue + POSITION_INCREMENT);
}

void ElevatorTrimHandler::onEventElevatorTrimDown() {
  targetValue = fmax(POSITION_MAX_DOWN, targetValue - POSITION_INCREMENT);
}

void ElevatorTrimHandler::onEventElevatorTrimSet(double value) {
  targetValue = fmax(POSITION_MAX_DOWN, fmin(POSITION_MAX_UP, value * VALUE_FACTOR));
}

void ElevatorTrimHandler::onEventElevatorTrimAxisSet(double value) {
  targetValue = fmax(POSITION_MAX_DOWN, fmin(POSITION_MAX_UP, value * VALUE_FACTOR));
}

double ElevatorTrimHandler::getPosition() {
  return targetValue;
}
