#pragma once

#ifndef __INTELLISENSE__
#define MODULE_EXPORT __attribute__((visibility("default")))
#define MODULE_WASM_MODNAME(mod) __attribute__((import_module(mod)))
#else
#define MODULE_EXPORT
#define MODULE_WASM_MODNAME(mod)
#define __attribute__(x)
#define __restrict__
#endif

#include <MSFS\Legacy\gauges.h>
#include <MSFS\MSFS.h>
#include <MSFS\MSFS_Render.h>
#include <SimConnect.h>

#include <cmath>
#include <iostream>

#include "radaltControl.h"
#include "SimVars.h"

class RadaltGauge {
private:
	bool isConnected = false;

	/// <summary>
	/// Initializes the connection to SimConnect
	/// </summary>
	/// <returns>True if successful, false otherwise.</returns> 
	bool initializeSimConnect()
	{
		std::cout << "RADALT: Connecting to SimConnect..." << std::endl;
		if (SUCCEEDED(SimConnect_Open(&hSimConnect, "RadAlt", nullptr, 0, 0, 0)))
		{
			std::cout << "RADALT: SimConnect connected." << std::endl;

			// Defining User Airraft Position
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_USER_POS, "Plane Altitude", "feet");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_USER_POS, "Plane Alt Above Ground", "feet");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_USER_POS, "Plane Latitude", "degrees");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_USER_POS, "Plane Longitude", "degrees");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_USER_POS, "Plane Heading Degrees True", "radians");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_USER_POS, "Plane Bank Degrees", "radians");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_USER_POS, "Plane Pitch Degrees", "radians");

			// Set up the probe data definition, but do not yet do anything with it
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_PROBE_POS, "Plane Altitude", "feet");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_PROBE_POS, "Plane Alt Above Ground", "feet");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_PROBE_POS, "Plane Latitude", "degrees");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_PROBE_POS, "Plane Longitude", "degrees");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_PROBE_POS, "Plane Pitch Degrees", "degrees");
			SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_PROBE_POS, "Plane Heading Degrees True", "radians");
				
			// Subscribe to the repeating 4-second timer event
			SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_4S_TIMER, "4sec");
			SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_PAUSED, "Pause");

			//  set the id for the freeze events so this client has full control of probe objects
			SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_FREEZE_LATLONG, "FREEZE_LATITUDE_LONGITUDE_SET");
			SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_FREEZE_ALTITUDE, "FREEZE_ALTITUDE_SET");
			SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_FREEZE_ATTITUDE, "FREEZE_ATTITUDE_SET");

			// Create some private events
			SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_RADAR_ON);
			SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_RADAR_OFF);

			// Link the private events to keyboard keys, and ensure the input events are off
			SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "Z", EVENT_RADAR_ON);
			SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "C", EVENT_RADAR_OFF);

			SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_OFF);

			// Sign up for notifications
			SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_RADAR_ON);
			SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_RADAR_OFF);

			SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_ON);

			std::cout << "RADALT: SimConnect registrations complete." << std::endl;

			return true;
		}

		std::cout << "RADALT: SimConnect failed." << std::endl;

		return false;
	}

public:
	/// <summary>
	/// Initializes the RADALT control
	/// </summary>
	/// <returns>True if successful, false otherwise.</returns>
	bool initializeRA() {
		if (!this->initializeSimConnect()) {
			std::cout << "RADALT: Init SimConnect failed." << std::endl;
			return false;
		}

		isConnected = true;
		simVars = new SimVars();
		SimConnect_CallDispatch(hSimConnect, RadaltDispatchProc, this);

		return true;
	}

	/// <summary>
	/// Kills the RADALT and unregisters all LVars
	/// </summary>
	/// <returns>True if successful, false otherwise.</returns>
	bool killRA() {
		std::cout << "RADALT: Disconnecting ..." << std::endl;
		//EngineControlInstance.terminate();

		isConnected = false;
		unregister_all_named_vars();

		std::cout << "RADALT: Disconnected." << std::endl;
		return SUCCEEDED(SimConnect_Close(hSimConnect));
	}
};