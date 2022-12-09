#include "SpoilersHandler.h"

#include <cmath>
#include <iostream>

using std::cout;
using std::endl;

bool SpoilersHandler::getIsInitialized() const {
  return isInitialized;
}

bool SpoilersHandler::getIsArmed() const {
  return isArmed;
}

double SpoilersHandler::getHandlePosition() const {
  return handlePosition;
}

void SpoilersHandler::setInitialPosition(bool isArmed, double position) {
  if (isInitialized) {
    return;
  }
  this->isArmed = isArmed;
  handlePosition = fmin(1.0, fmax(0.0, position));
  isInitialized = true;
}

void SpoilersHandler::onEventSpoilersOn() {
  isArmed = false;
  handlePosition = POSITION_FULL;
}

void SpoilersHandler::onEventSpoilersOff() {
  isArmed = false;
  handlePosition = POSITION_RETRACTED;
}

void SpoilersHandler::onEventSpoilersToggle() {
  isArmed = false;
  handlePosition = handlePosition > 0 ? POSITION_RETRACTED : POSITION_FULL;
}

void SpoilersHandler::onEventSpoilersSet(double value) {
  handlePosition = fmin(1.0, fmax(0.0, value / 16384.0));
  if (handlePosition > 0) {
    isArmed = false;
  }
}

void SpoilersHandler::onEventSpoilersAxisSet(double value) {
  handlePosition = fmin(1.0, fmax(0.0, 0.5 + (value / 32768.0)));
  if (handlePosition > 0) {
    isArmed = false;
  }
}

void SpoilersHandler::onEventSpoilersArmOn() {
  isArmed = true;
  handlePosition = 0;
}

void SpoilersHandler::onEventSpoilersArmOff() {
  isArmed = false;
}

void SpoilersHandler::onEventSpoilersArmToggle() {
  isArmed = !isArmed;
  if (isArmed) {
    handlePosition = 0;
  }
}

void SpoilersHandler::onEventSpoilersArmSet(bool value) {
  isArmed = value;
  if (isArmed) {
    handlePosition = 0;
  }
}
