#include "FlapsHandler.h"

bool FlapsHandler::getIsInitialized() const {
  return isInitialized;
}

FlapsHandler::SIM_POSITION FlapsHandler::getSimPosition() const {
  return simPosition;
}

FlapsHandler::HANDLE_POSITION FlapsHandler::getHandlePosition() const {
  return handlePosition;
}

double FlapsHandler::getHandlePositionPercent() const {
  return handlePosition * (1.0 / 4.0);
}

void FlapsHandler::setInitialPosition(HANDLE_POSITION position) {
  if (isInitialized) {
    return;
  }
  updateSimPosition(position);
  isInitialized = true;
}

void FlapsHandler::setAirspeed(double value) {
  airspeed = value;
  updateSimPosition(handlePosition);
}

void FlapsHandler::onEventFlapsSet(long value) {
  updateSimPosition(getTargetHandlePosition((value / 8192.0) - 1));
}

void FlapsHandler::onEventFlapsAxisSet(long value) {
  updateSimPosition(getTargetHandlePosition(value / 16384.0));
}

FlapsHandler::HANDLE_POSITION FlapsHandler::getTargetHandlePosition(double targetValue) {
  if (targetValue < -0.8) {
    return HANDLE_POSITION_FLAPS_0;
  } else if (targetValue > -0.7 && targetValue < -0.3) {
    return HANDLE_POSITION_FLAPS_1;
  } else if (targetValue > -0.2 && targetValue < 0.2) {
    return HANDLE_POSITION_FLAPS_2;
  } else if (targetValue > 0.3 && targetValue < 0.7) {
    return HANDLE_POSITION_FLAPS_3;
  } else if (targetValue > 0.8) {
    return HANDLE_POSITION_FLAPS_4;
  }
  return handlePosition;
}

void FlapsHandler::onEventFlapsIncrease() {
  updateSimPosition(static_cast<HANDLE_POSITION>(handlePosition + 1));
}

void FlapsHandler::onEventFlapsDecrease() {
  updateSimPosition(static_cast<HANDLE_POSITION>(handlePosition - 1));
}

void FlapsHandler::onEventFlapsUp() {
  updateSimPosition(HANDLE_POSITION_FLAPS_0);
}

void FlapsHandler::onEventFlapsSet_1() {
  updateSimPosition(HANDLE_POSITION_FLAPS_1);
}

void FlapsHandler::onEventFlapsSet_2() {
  updateSimPosition(HANDLE_POSITION_FLAPS_2);
}

void FlapsHandler::onEventFlapsSet_3() {
  updateSimPosition(HANDLE_POSITION_FLAPS_3);
}

void FlapsHandler::onEventFlapsSet_4() {
  updateSimPosition(HANDLE_POSITION_FLAPS_4);
}

void FlapsHandler::onEventFlapsDown() {
  updateSimPosition(HANDLE_POSITION_FLAPS_4);
}

void FlapsHandler::updateSimPosition(HANDLE_POSITION targetHandlePosition) {
  // ensure correct range
  if (targetHandlePosition < HANDLE_POSITION_FLAPS_0) {
    targetHandlePosition = HANDLE_POSITION_FLAPS_0;
  } else if (targetHandlePosition > HANDLE_POSITION_FLAPS_4) {
    targetHandlePosition = HANDLE_POSITION_FLAPS_4;
  }

  // determine new flaps position
  switch (targetHandlePosition) {
    case HANDLE_POSITION_FLAPS_0: {
      simPosition = SIM_POSITION_FLAPS_0;
      break;
    }

    case HANDLE_POSITION_FLAPS_1: {
      switch (handlePosition) {
        case HANDLE_POSITION_FLAPS_0: {
          if (airspeed <= 100) {
            simPosition = SIM_POSITION_FLAPS_1F;
          } else {
            simPosition = SIM_POSITION_FLAPS_1;
          }
          break;
        }

        case HANDLE_POSITION_FLAPS_1: {
          if (airspeed >= 210) {
            simPosition = SIM_POSITION_FLAPS_1;
          } else if (airspeed <= 100) {
            simPosition = SIM_POSITION_FLAPS_1F;
          }
          break;
        }

        case HANDLE_POSITION_FLAPS_2:
        case HANDLE_POSITION_FLAPS_3:
        case HANDLE_POSITION_FLAPS_4: {
          if (airspeed < 210) {
            simPosition = SIM_POSITION_FLAPS_1F;
          } else {
            simPosition = SIM_POSITION_FLAPS_1;
          }
          break;
        }
      }
      break;
    }

    case HANDLE_POSITION_FLAPS_2: {
      simPosition = SIM_POSITION_FLAPS_2;
      break;
    }

    case HANDLE_POSITION_FLAPS_3: {
      simPosition = SIM_POSITION_FLAPS_3;
      break;
    }

    case HANDLE_POSITION_FLAPS_4: {
      simPosition = SIM_POSITION_FLAPS_4;
      break;
    }
  }

  // update handle position
  handlePosition = targetHandlePosition;
}
