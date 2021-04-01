#pragma once

struct EngineData {
  unsigned long long simOnGround;
  double generalEngineElapsedTime_1;
  double generalEngineElapsedTime_2;
  double standardAtmTemperature;
  double turbineEngineCorrectedFuelFlow_1;
  double turbineEngineCorrectedFuelFlow_2;
  double fuelTankCapacityAuxLeft;
  double fuelTankCapacityAuxRight;
  double fuelTankCapacityMainLeft;
  double fuelTankCapacityMainRight;
  double fuelTankCapacityCenter;
  double fuelTankQuantityAuxLeft;
  double fuelTankQuantityAuxRight;
  double fuelTankQuantityMainLeft;
  double fuelTankQuantityMainRight;
  double fuelTankQuantityCenter;
  double fuelTankQuantityTotal;
  double fuelWeightPerGallon;
  double engineEngine1EGT;
  double engineEngine2EGT;
  double engineEngine1FF;
  double engineEngine2FF;
  double engineEngine1PreFF;
  double engineEngine2PreFF;
  double engineEngineImbalance;
  double engineFuelUsedLeft;
  double engineFuelUsedRight;
  double engineFuelQuantityPre;
  double engineFuelLeftPre;
  double engineFuelRightPre;
  double engineEngineCrank;
  double engineEngineCycleTime;
  double enginePreFlightPhase;
  double engineActualFlightPhase;
};
