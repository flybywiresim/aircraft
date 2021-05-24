#pragma once

#include "RegPolynomials.h"
#include "SimVars.h"
#include "Tables.h"
#include "common.h"

class EngineControl {
private:
	SimVars* simVars;
	Ratios* ratios;
	Polynomial* poly;

	double Eng1Time;
	double Eng2Time;
	double ambientTemp;

	int idx;
	int engine;
	int egt_imbalance;
	int ff_imbalance;
	int N2_imbalance;
	std::string imbalance;
	double EngineState;
	double Engine1Combustion;
	double Engine2Combustion;
	double engineStarter;
	double engineIgniter;

	double cn1;
	double n2;
	double idleN1;
	double idleN2;
	double mach;
	double pressAltitude;
	double cegtNX;
	double cflowNX;
	double Imbalance;
	int EngineImbalanced;
	double FFImbalanced;

	double cff;
	double flow_out;

	double m;
	double b;
	double EngineCycleTime;
	double FuelBurn1;
	double FuelBurn2;
	double FuelWeightGallon;
	double Engine1PreFF;
	double Engine2PreFF;
	double FuelUsedLeft;
	double FuelUsedRight;
	double FuelLeftPre;
	double FuelRightPre;
	double FuelAuxLeftPre;
	double FuelAuxRightPre;
	double FuelCenterPre;
	double Engine1FF;
	double Engine2FF;
	double FuelLeft;
	double FuelRight;
	double FuelCenter;
	double leftQuantity;
	double rightQuantity;
	double leftAuxQuantity;
	double rightAuxQuantity;
	double centerQuantity;
	double xfrCenter;
	double xfrAuxLeft;
	double xfrAuxRight;
	double FuelTotalActual;
	double FuelTotalPre;

	// Engine Imbalance Coded Digital Word:
	// 00 - Engine, 00 - N2, 00 - FuelFlow, 00 - EGT
	// Generates a random engine imbalance. Next steps: make realistic imbalance due to wear
	void EngineImbalance(int initial) {
		srand((int)time(0));

		if (initial == 1) {
			// Decide Engine with imbalance
			if ((rand() % 100) + 1 < 50) {
				engine = 1;
			}
			else {
				engine = 2;
			}
			// Obtain EGT imbalance (Max 20ºC)
			egt_imbalance = (rand() % 20) + 1;

			// Obtain FF imbalance (Max 36 Kg/h)
			ff_imbalance = (rand() % 36) + 1;

			// Obtain N2 imbalance (Max 0.3%)
			N2_imbalance = (rand() % 30) + 1;

			// Zero Padding and Merging
			imbalance = to_string_with_zero_padding(engine, 2) + to_string_with_zero_padding(egt_imbalance, 2) +
				to_string_with_zero_padding(ff_imbalance, 2) + to_string_with_zero_padding(N2_imbalance, 2);

			simVars->setEngineImbalance(stod(imbalance));
		}
	}

	// Engine Start Procedure
	void engineStartProcedure(int idx, double n2, double pressAltitude, double ambientTemp) {
		idleN2 = simVars->getEngineIdleN2();

		if (idx == 1) {
			simVars->setEngine1N2(poly->n2NX(n2, idleN2));
		}
		else {
			simVars->setEngine2N2(poly->n2NX(n2, idleN2));
		}

		// Checking Engine Idle condition
		if (n2 >= idleN2) {
			if (idx == 1) {
				simVars->setEngine1State(1);
			}
			else {
				simVars->setEngine2State(1);
			}
		}
	}

	// FBW Engine RPM (N1 and N2)
	// Updates Engine N1 and N2 with our own algorithm for start-up and shutdown
	void updateRPM(int idx, double n2) {
		if (idx == 1) {
			simVars->setEngine1N2(n2);
		}
		else {
			simVars->setEngine2N2(n2);
		}
	}

	// FBW Exhaust Gas Temperature (in º Celsius)
	// Updates EGT with realistic values visualized in the ECAM
	void updateEGT(int idx, double cn1, double cff, double mach, double pressAltitude, double ambientTemp) {
		cegtNX = poly->cegtNX(cn1, cff, mach, pressAltitude);

		if (idx == 1) {
			simVars->setEngine1EGT(cegtNX * ratios->theta2(mach, ambientTemp));
		}
		else {
			simVars->setEngine2EGT(cegtNX * ratios->theta2(mach, ambientTemp));
		}
	}

	// FBW Fuel FLow (in Kg/h)
	// Updates Fuel Flow with realistic values
	double updateFF(int idx, double cn1, double mach, double pressAltitude, double ambientTemp) {
		flow_out = 0;

		// Engine Imbalance
		Imbalance = simVars->getEngineImbalance();
		EngineImbalanced = imbalance_extractor(Imbalance, 0);
		FFImbalanced = imbalance_extractor(Imbalance, 2);

		cflowNX = poly->cflowNX(cn1, mach, pressAltitude);  // in lbs/hr.

		// Checking engine imbalance
		if (EngineImbalanced != idx || cflowNX < 1) {
			FFImbalanced = 0;
		}

		// Checking Fuel Logic and final Fuel Flow
		if (cflowNX < 1) {
			flow_out = 0;
		}
		else {
			flow_out = (cflowNX * 0.453592 * ratios->delta2(mach, ambientTemp) * sqrt(ratios->theta2(mach, ambientTemp))) - FFImbalanced;
		}

		if (idx == 1) {
			simVars->setEngine1FF(flow_out);
		}
		else {
			simVars->setEngine2FF(flow_out);
		}

		return cflowNX;
	}

	// FBW Fuel Consumption and Tankering
	// Updates Fuel Consumption with realistic values
	void updateFuel(double deltaTime) {
		EngineCycleTime = simVars->getEngineCycleTime();
		Eng1Time = simVars->getEngineTime(1);
		Eng2Time = simVars->getEngineTime(2);
		double test = 0;

		m = 0;
		b = 0;
		FuelBurn1 = 0;
		FuelBurn2 = 0;

		Engine1PreFF = simVars->getEngine1PreFF();  // KG/H
		Engine2PreFF = simVars->getEngine2PreFF();  // KG/H
		Engine1FF = simVars->getEngine1FF();        // KG/H
		Engine2FF = simVars->getEngine2FF();        // KG/H

		FuelWeightGallon = simVars->getFuelWeightGallon();
		FuelUsedLeft = simVars->getFuelUsedLeft();    // Kg
		FuelUsedRight = simVars->getFuelUsedRight();  // Kg

		FuelLeftPre = simVars->getFuelLeftPre();                                   // LBS
		FuelRightPre = simVars->getFuelRightPre();                                 // LBS
		FuelAuxLeftPre = simVars->getFuelAuxLeftPre();                             // LBS
		FuelAuxRightPre = simVars->getFuelAuxRightPre();                           // LBS
		FuelCenterPre = simVars->getFuelCenterPre();                               // LBS
		leftQuantity = simVars->getTankLeftQuantity() * FuelWeightGallon;          // LBS
		rightQuantity = simVars->getTankRightQuantity() * FuelWeightGallon;        // LBS
		leftAuxQuantity = simVars->getTankLeftAuxQuantity() * FuelWeightGallon;    // LBS
		rightAuxQuantity = simVars->getTankRightAuxQuantity() * FuelWeightGallon;  // LBS
		centerQuantity = simVars->getTankCenterQuantity() * FuelWeightGallon;      // LBS
		FuelLeft = 0;                                                              // LBS
		FuelRight = 0;
		FuelCenter = 0;
		xfrCenter = 0;
		xfrAuxLeft = 0;
		xfrAuxRight = 0;
		FuelTotalActual = leftQuantity + rightQuantity + leftAuxQuantity + rightAuxQuantity + centerQuantity;
		FuelTotalPre = FuelLeftPre + FuelRightPre + FuelAuxLeftPre + FuelAuxRightPre + FuelCenterPre;

		deltaTime = deltaTime / 3600;

		if (Eng1Time + Eng2Time > EngineCycleTime && abs(FuelTotalActual - FuelTotalPre) < 1) {
			test = 1;
			//--------------------------------------------
			// Left Engine and Wing routine
			//--------------------------------------------
			if (FuelLeftPre > 0.2) {
				// Cycle Fuel Burn for Engine 1
				m = (Engine1FF - Engine1PreFF) / deltaTime;
				b = Engine1PreFF;
				FuelBurn1 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

				// Fuel Used Accumulators - Engine 1
				FuelUsedLeft += FuelBurn1;

				// Fuel transfer routine for Left Wing
				if (FuelAuxLeftPre > leftAuxQuantity) {
					xfrAuxLeft = FuelAuxLeftPre - leftAuxQuantity;
				}
			}
			else if (FuelLeftPre <= 0) {
				FuelBurn1 = 0;
				FuelLeftPre = 0;
			}
			else {
				FuelBurn1 = 0;
				FuelLeftPre = -10;
			}

			//--------------------------------------------
			// Right Engine and Wing routine
			//--------------------------------------------
			if (FuelRightPre > 0.2) {
				// Cycle Fuel Burn for Engine 2
				m = (Engine2FF - Engine2PreFF) / deltaTime;
				b = Engine2PreFF;
				FuelBurn2 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

				// Fuel Used Accumulators - Engine 2
				FuelUsedRight += FuelBurn2;

				// Fuel transfer routine for Left Wing
				if (FuelAuxRightPre > rightAuxQuantity) {
					xfrAuxRight = FuelAuxRightPre - rightAuxQuantity;
				}
			}
			else if (FuelRightPre <= 0) {
				FuelBurn2 = 0;
				FuelRightPre = 0;
			}
			else {
				FuelBurn2 = 0;
				FuelRightPre = -10;
			}

			//--------------------------------------------
			// Center Tank transfer routine
			//--------------------------------------------
			if (FuelCenterPre > centerQuantity) {
				xfrCenter = FuelCenterPre - centerQuantity;
			}

			//--------------------------------------------
			// Main Fuel Logic
			//--------------------------------------------
			FuelControlData tankering;

			FuelLeft = (FuelLeftPre - (FuelBurn1 * 2.20462)) + xfrAuxLeft + (xfrCenter / 2);     // LBS
			FuelRight = (FuelRightPre - (FuelBurn2 * 2.20462)) + xfrAuxRight + (xfrCenter / 2);  // LBS

			// Checking for Inner Tank overflow - Will be taken off with Rust code
			if (FuelLeft > 12167.1 && FuelRight > 12167.1) {
				FuelCenter = centerQuantity + (FuelLeft - 12167.1) + (FuelRight - 12167.1);
				FuelLeft = 12167.1;
				FuelRight = 12167.1;
			}
			else if (FuelRight > 12167.1) {
				FuelCenter = centerQuantity + FuelRight - 12167.1;
				FuelRight = 12167.1;
			}
			else if (FuelLeft > 12167.1) {
				FuelCenter = centerQuantity + FuelLeft - 12167.1;
				FuelLeft = 12167.1;
			}
			else {
				FuelCenter = centerQuantity;
			}

			// Setting new pre-cycle conditions
			simVars->setEngine1PreFF(Engine1FF);
			simVars->setEngine2PreFF(Engine2FF);
			simVars->setFuelUsedLeft(FuelUsedLeft);         // in KG
			simVars->setFuelUsedRight(FuelUsedRight);       // in KG
			simVars->setFuelAuxLeftPre(leftAuxQuantity);    // in LBS
			simVars->setFuelAuxRightPre(rightAuxQuantity);  // in LBS
			simVars->setFuelCenterPre(FuelCenter);          // in LBS
			simVars->setEngineCycleTime(Eng1Time + Eng2Time);

			tankering.FuelLeft = (FuelLeft / FuelWeightGallon);      // USG
			tankering.FuelRight = (FuelRight / FuelWeightGallon);    // USG
			tankering.FuelCenter = (FuelCenter / FuelWeightGallon);  // USG

			SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(tankering), &tankering);

			simVars->setFuelLeftPre(FuelLeft);              // in LBS
			simVars->setFuelRightPre(FuelRight);            // in LBS

		}
		else {
			simVars->setFuelLeftPre(leftQuantity);		// in LBS
			simVars->setFuelRightPre(rightQuantity);		// in LBS
			simVars->setFuelAuxLeftPre(leftAuxQuantity);    // in LBS
			simVars->setFuelAuxRightPre(rightAuxQuantity);  // in LBS
			simVars->setFuelCenterPre(centerQuantity);      // in LBS
		}
	}

public:
	// Initialize the FADEC and Fuel model
	void initialize() {
		std::cout << "FADEC: Initializing EngineControl" << std::endl;

		simVars = new SimVars();

		EngineImbalance(1);

		Eng1Time = simVars->getEngineTime(1);
		Eng2Time = simVars->getEngineTime(2);
		simVars->setEngineCycleTime(Eng1Time + Eng2Time);

		// Checking for engine combustion (engine on or off)
		Engine1Combustion = simVars->getEngineCombustion(1);
		Engine2Combustion = simVars->getEngineCombustion(2);

		// Setting Engine State 
		if (Engine1Combustion) {
			simVars->setEngine1State(1);
		}
		else {
			simVars->setEngine1State(0);
		}

		if (Engine2Combustion) {
			simVars->setEngine2State(1);
		}
		else {
			simVars->setEngine2State(0);
		}
	}

	void update(double deltaTime) {
		// Per cycle Initial Conditions
		idx = 2;
		mach = simVars->getMach();
		pressAltitude = simVars->getPressureAltitude();
		ambientTemp = simVars->getAmbientTemperature();
		idleN1 = IdleCN1(pressAltitude, ambientTemp) * sqrt(ratios->theta2(mach, ambientTemp));
		idleN2 = IdleCN2(pressAltitude, ambientTemp) * sqrt((273.15 + ambientTemp) / 288.15);
		simVars->setEngineIdleN1(idleN1);
		simVars->setEngineIdleN2(idleN2);



		// Timer timer;
		while (idx != 0) {
			engineStarter = simVars->getEngineStarter(idx);
			engineIgniter = simVars->getEngineIgniter(idx);
			n2 = simVars->getN2(idx);

			// Are we starting the engine?
			if (idx == 1) {
				EngineState = simVars->getEngine1State();
				if (engineStarter && engineIgniter && n2 > 0 && EngineState != 1) {
					simVars->setEngine1State(2);
				}
			}
			else {
				EngineState = simVars->getEngine2State();
				if (engineStarter && engineIgniter && n2 > 0 && EngineState != 1) {
					simVars->setEngine2State(2);
				}
			}

			switch (int(EngineState)) {
			case 2:
				engineStartProcedure(idx, n2, pressAltitude, ambientTemp);
				break;
			default:
				cn1 = simVars->getCN1(idx);
				updateRPM(idx, n2);
				cff = updateFF(idx, cn1, mach, pressAltitude, ambientTemp);
				updateEGT(idx, cn1, cff, mach, pressAltitude, ambientTemp);
			}
			idx--;
		}

		updateFuel(deltaTime);
		// timer.Stop();
	}

	void terminate() {}
};

EngineControl EngCntrlInst;