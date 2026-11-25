#include "Bcm.h"

#include <cmath>

Bcm::Bcm() {}

// The BCM is an analog computer, so power-up self tests, startup time etc. do not apply in the same way
// as for normal computers. This also means that the computations it does are time-continuous, but
// we still approximate this by using discrete time.
void Bcm::update(double deltaTime, bool faultActive, bool bcsYellowPowered, bool bcsGreenPowered) {
  updatePowerSupply(deltaTime, bcsYellowPowered || bcsGreenPowered, faultActive);

  isActive = !powerSupplyFault && !discreteInputs.prim1Inhibit && !discreteInputs.prim3Inhibit && !discreteInputs.sec1Inhibit &&
             !discreteInputs.sec3Inhibit;

  auto stickPitchCommand = std::fmax(std::fmin(analogInputs.captPitchStickPos + analogInputs.foPitchStickPos, 1), -1);
  auto stickRollCommand = std::fmax(std::fmin(analogInputs.captRollStickPos + analogInputs.foRollStickPos, 1), -1);

  // TODO Add pitch and yaw damping.
  etaCommand = std::fmax(std::fmin(-30. * stickPitchCommand, 20), -30);
  zetaCommand = -30. * analogInputs.rudderPedalPos;
  auto xiCommand = -30. * stickRollCommand;
  xiCommandLeft = std::fmax(std::fmin(-xiCommand, 20), -30);
  xiCommandRight = std::fmax(std::fmin(xiCommand, 20), -30);

  updateOutputs();
}

// Monitor the power supply and record the outage time.
// If an outage lasts more than 10ms, consider the BCM as unpowered.
void Bcm::updatePowerSupply(double deltaTime, bool isPowered, bool faultActive) {
  if (!isPowered || faultActive) {
    powerSupplyOutageTime += deltaTime;
  }
  if (powerSupplyOutageTime > minimumPowerOutageTimeForFailure) {
    powerSupplyFault = true;
  }
  if (isPowered && powerSupplyFault) {
    powerSupplyFault = false;
    powerSupplyOutageTime = 0;
  }
}

void Bcm::updateOutputs() {
  if (powerSupplyFault) {
    discreteOutputs = {};
    analogOutputs = {};

    return;
  }

  discreteOutputs.bcmEnergized = !powerSupplyFault;
  discreteOutputs.bcmActive = isActive;

  analogOutputs.leftElevCmd = etaCommand;
  analogOutputs.rightElevCmd = etaCommand;
  analogOutputs.leftAilCmd = xiCommandLeft;
  analogOutputs.rightAilCmd = xiCommandRight;
  analogOutputs.upperRudCmd = zetaCommand;
  analogOutputs.lowerRudCmd = zetaCommand;
  analogOutputs.thsCmd = 0;
}

const BcmDiscreteOutputs& Bcm::getDiscreteOutputs() {
  return discreteOutputs;
}

const BcmAnalogOutputs& Bcm::getAnalogOutputs() {
  return analogOutputs;
}
