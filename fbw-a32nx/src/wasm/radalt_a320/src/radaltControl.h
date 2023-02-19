#pragma once

#include "SimVars.h"

HANDLE  hSimConnect;
SimVars* simVars;

double  devState = 0.0;
bool	debug = true;
double	radAlt = 0.0;
double	beamMin = 0.0;
double	beamActual = 0.0;
double	plane_alt = 0.0; // Debug
double	probe_alt = 0.0; // Debug
double	plane_abv = 0.0; // Debug
int		test_i = 0;		 // Debug
int		interval = 1;	 // Debug

int     quit = 0;

//**********************************************************************************
// Key COMMON variables and functions
// Set up flags so these operations only happen once
static bool	radarActive = false;

const double PHI_2D = 1.32471795724474602596;	// 2D Gloden Ratio
const double ALPHA_0 = 1 / PHI_2D;
const double ALPHA_1 = 1 / pow(PHI_2D, 2);
const double EARTH_RAD = 20888156.17;			// earth's radius in feet
const int	 MAX_AI = 100;
const double H_ANGLE = 40;						// in degrees
const double V_ANGLE = 20;						// in degrees
const double MAX_BEAM_D = 8192;					// in feet

// convert degrees to radians
inline double deg2rad(double deg)
{
	return deg * (M_PI / 180.0);
}

// convert radians to degrees
inline double rad2deg(double rad)
{
	return rad * (180.0 / M_PI);
}

// find Minimum of two values
bool findMin(double a, double b)
{
	if (a < b)
		return false;
	else
		return true;
}


// END of COMMON
//*******************************************************************************

struct userStruct
{
	double  altitude;
	double  altAbvGnd;
	double  latitude;
	double  longitude;
	double  heading;
	double  bank;
	double  pitch;
};

struct probeStruct
{
	double  altitude;
	double  altAbvGnd;
	double  latitude;
	double  longitude;
	double	pitch;
	double	heading;
};

struct probeInfo
{
	SIMCONNECT_OBJECT_ID id;
	bool created;
};

static enum EVENT_ID {
	EVENT_RADAR_ON,
	EVENT_RADAR_OFF,
	EVENT_FREEZE_LATLONG,
	EVENT_FREEZE_ALTITUDE,
	EVENT_FREEZE_ATTITUDE
};

static enum DATA_DEFINE_ID {
	DEFINITION_USER_POS,
	DEFINITION_PROBE_POS
};

static enum DATA_REQUEST_ID {
	REQUEST_USER_DATA,
	REQUEST_PROBE_CREATE = 0x00100000,
	REQUEST_PROBE_REMOVE = 0x00200000,
	REQUEST_PROBE_DATA = 0x00300000,
	//REQUEST_PROBE_RELEASE = 0x00400000
};

static enum GROUP_ID {
	GROUP_ZX,
};

static enum INPUT_ID {
	INPUT_ZX,
};

// create varS to hold user plane position
userStruct	user_pos;
probeStruct probe_pos;
probeInfo	probe_info[MAX_AI]; 

// Returns new lat/ long probe coordinates for each probe
// Beam distance coded as pitch
// TO BE CHECKED
probeStruct distance_and_bearing(userStruct p, int probe_i) {
	double r1, r2, probe_x, probe_y, rbearing, rdistance;
	double rlat1, rlon1, rlat2, rlon2, x_dist, y_dist;
	double cAltAbvGnd = p.altAbvGnd;
	double cAltitude = p.altAbvGnd;
	double cBank = p.bank;
	double cPitch = p.pitch;

	/* Setting constrains */
	if (cAltAbvGnd > MAX_BEAM_D)
		cAltAbvGnd = MAX_BEAM_D;
	if (cBank > 1.56)
		cBank = 1.56;
	if (cBank < -1.56)
		cBank = -1.56;
	if (cPitch > 1.56)
		cPitch = 1.56;
	if (cPitch < -1.56)
		cPitch = -1.56;

	probeStruct r;

	x_dist = tan(H_ANGLE * M_PI / 180) * cAltAbvGnd;
	y_dist = tan(V_ANGLE * M_PI / 180) * cAltAbvGnd;

	// Quasi-random R2 
	probe_x = (0.5 + (ALPHA_0 * probe_i));
	probe_y = (0.5 + (ALPHA_1 * probe_i));

	probe_x = 2 * x_dist * (probe_x - (int)probe_x - 0.5) + (tan(cBank) * cAltAbvGnd);
	probe_y = 2 * y_dist * (probe_y - (int)probe_y - 0.5) - (tan(cPitch) * cAltAbvGnd);

	rbearing = atan(probe_x / probe_y);					 // 2D top-down bearing (degrees)
	rdistance = sqrt(pow(probe_x, 2) + pow(probe_y, 2)); // 2D top-down distance (feet)

	if (probe_y < 0) {
		rbearing = rbearing + M_PI;
	}
	else if (probe_x < 0 && probe_y > 0) {
		rbearing = (2 * M_PI) + rbearing;
	}

	// LAT/LON Translation
	rlat1 = deg2rad(p.latitude);
	rlon1 = deg2rad(p.longitude);
	rbearing = p.heading + rbearing;

	// New Coordinates
	rlat2 = asin((sin(rlat1) * cos(rdistance / EARTH_RAD)) + (cos(rlat1) * sin(rdistance / EARTH_RAD) * cos(rbearing)));
	rlon2 = rlon1 + (atan2(sin(rbearing) * sin(rdistance / EARTH_RAD) * cos(rlat1), cos(rdistance / EARTH_RAD) - sin(rlat1) * sin(rlat2)));

	r.latitude = rad2deg(rlat2);
	r.longitude = rad2deg(rlon2);

	r.pitch = rdistance / 100; // used to represent 2D beam distance from aircraft to probe
	r.heading = rbearing;

	return r;
}

// Creates initial probe mesh when RA is turned on. Called by REQUEST_USER_DATA
void create_probe_mesh(int probe_i)
{
	SIMCONNECT_DATA_INITPOSITION Init;
	HRESULT hr;

	devState = simVars->getDeveloperState();

	probeStruct r = distance_and_bearing(user_pos, probe_i);

	if (debug) std::cout << "RADALT: Creating Probe (" << probe_i << ") .." << std::endl;

	// Initialize probe 
	Init.Latitude = r.latitude;
	Init.Longitude = r.longitude;
	Init.Altitude = 0.0;
	Init.Pitch = 0.0;
	Init.Bank = 0.0;
	Init.Heading = 0.0;
	Init.OnGround = 1;
	Init.Airspeed = 0;
	
	if (devState == 3.0) 
		hr = SimConnect_AICreateSimulatedObject(hSimConnect, "ralt_probe", Init, (UINT)REQUEST_PROBE_CREATE + probe_i);
	else
		hr = SimConnect_AICreateSimulatedObject(hSimConnect, "triangleWithoutIndices", Init, (UINT)REQUEST_PROBE_CREATE + probe_i);
}

// Removes the probe mesh when RA is turned off. Called by REQUEST_PROBE_DATA
void remove_probe_mesh(int probe_i) {

	HRESULT hr;

	if (probe_info[probe_i].created) {

		if (debug) std::cout << "RADALT: Removing Probe (" << probe_i << ").." << std::endl;
		probe_info[probe_i].created = false;

		hr = SimConnect_AIRemoveObject(hSimConnect, probe_info[probe_i].id, (UINT)REQUEST_PROBE_REMOVE + probe_i);
		hr = SimConnect_RequestDataOnSimObject(hSimConnect,
			(UINT)REQUEST_PROBE_DATA + probe_i,
			DEFINITION_PROBE_POS,
			probe_info[probe_i].id,
			SIMCONNECT_PERIOD_NEVER);
		if (probe_i == MAX_AI - 1) {
			hr = SimConnect_RequestDataOnSimObject(hSimConnect,
				REQUEST_USER_DATA,
				DEFINITION_USER_POS,
				SIMCONNECT_OBJECT_ID_USER,
				SIMCONNECT_PERIOD_NEVER);
		}
	}
}

// Function called everytime the aircraft's RA is ready to emit. Called by EVENT_RADAR_ON
void get_startup_data() {
	HRESULT hr;

	if (debug) std::cout << "Entering get_startup_data()... " << std::endl;

	hr = SimConnect_RequestDataOnSimObject(hSimConnect,
		REQUEST_USER_DATA,
		DEFINITION_USER_POS,
		SIMCONNECT_OBJECT_ID_USER,
		SIMCONNECT_PERIOD_SIM_FRAME,
		0, 0, interval, 0); //SIMCONNECT_DATA_REQUEST_FLAG_CHANGED

	for (int i = 0; i < MAX_AI; i++) {
		if (!radarActive) {
			create_probe_mesh(i);
		}
	}

	radarActive = true;

}

// Function called to stop RA emission. Called by EVENT_RADAR_OFF
void remove_probes() {

	for (int i = 0; i < MAX_AI; i++) {
		remove_probe_mesh(i);
	}
	radarActive = false;
}

// Calls freeze events on each probe. Called within REQUEST_PROBE_CREATE
void probe_init(int probe_i)
{
	HRESULT hr;
	//hr = SimConnect_AIReleaseControl(hSimConnect, probe_info[probe_i].id, (UINT)REQUEST_PROBE_RELEASE+probe_i);

	//hr = SimConnect_TransmitClientEvent(hSimConnect,
	//	probe_info[probe_i].id,
	//	EVENT_FREEZE_ALTITUDE,
	//	1, // set freeze value to 1
	//	SIMCONNECT_GROUP_PRIORITY_HIGHEST,
	//	SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY);
	hr = SimConnect_TransmitClientEvent(hSimConnect,
		probe_info[probe_i].id,
		EVENT_FREEZE_ATTITUDE,
		1, // set freeze value to 1
		SIMCONNECT_GROUP_PRIORITY_HIGHEST,
		SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY);
	hr = SimConnect_TransmitClientEvent(hSimConnect,
		probe_info[probe_i].id,
		EVENT_FREEZE_LATLONG,
		1, // set freeze value to 1
		SIMCONNECT_GROUP_PRIORITY_HIGHEST,
		SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY);
}

// Sets request for probe position while probes are being created. Called within REQUEST_PROBE_CREATE
void get_updated_probe(int probe_i) {
	HRESULT hr;

	hr = SimConnect_RequestDataOnSimObject(hSimConnect,
		(UINT)REQUEST_PROBE_DATA + probe_i,
		DEFINITION_PROBE_POS,
		probe_info[probe_i].id,
		SIMCONNECT_PERIOD_SIM_FRAME,
		0, 0, interval, 0); // SIMCONNECT_DATA_REQUEST_FLAG_CHANGED

}

// Sets new probe mesh position. Called by REQUEST_PROBE_DATA
void update_probe_mesh(int probe_i) {
	HRESULT hr;

	probeStruct r = distance_and_bearing(user_pos, probe_i);

	probe_pos.latitude = r.latitude;
	probe_pos.longitude = r.longitude;
	//probe_pos.altAbvGnd = 0.0;
	probe_pos.pitch = r.pitch;
	probe_pos.heading = r.heading;

	hr = SimConnect_SetDataOnSimObject(hSimConnect,
		DEFINITION_PROBE_POS,
		probe_info[probe_i].id,
		0,
		0,
		sizeof(probeStruct),
		&probe_pos);
}

void read_probe_data(int probe_i, probeStruct probe_pos) {

	if (probe_i == 0) {
		beamMin = 99999;
		radAlt = 99999;
	}

	beamActual = sqrt(pow(probe_pos.pitch * 100, 2) + pow(user_pos.altitude - probe_pos.altitude, 2));
	
	if (findMin(beamMin, beamActual)) {
		radAlt = user_pos.altitude - probe_pos.altitude;
		beamMin = sqrt(pow(probe_pos.pitch * 100, 2) + pow(radAlt, 2));
		plane_alt = user_pos.altitude;			 // Debug
		probe_alt = probe_pos.altitude;			 // Debug
		plane_abv = user_pos.altAbvGnd;			 // Debug
		test_i = probe_i;						 // Debug
	}

	if (probe_i == MAX_AI - 1) {
		if (radAlt > MAX_BEAM_D || beamMin > MAX_BEAM_D)
			radAlt = 99999;

		simVars->setRadAlt(radAlt);

		if (debug) std::cout << "RADALT: Probe (" << test_i <<
			") Plane_Alt: " << plane_alt <<
			" Probe_Alt: " << probe_alt <<
			" Plane_AltAbv: " << plane_abv <<
			" beamMin: " << beamMin <<
			" RA: " << radAlt << std::endl;
	}
}

static const char* ExceptionName(SIMCONNECT_EXCEPTION exception) {
	switch (exception) {
	case SIMCONNECT_EXCEPTION_NONE:				//0
		return "EXCEPTION_NONE (0)";
	case SIMCONNECT_EXCEPTION_ERROR:			//1
		return "EXCEPTION_ERROR (1)";
	case SIMCONNECT_EXCEPTION_SIZE_MISMATCH:	//2
		return "EXCEPTION_SIZE_MISMATCH (2)";
	case SIMCONNECT_EXCEPTION_UNRECOGNIZED_ID:	//3
		return "EXCEPTION_UNRECOGNIZED_ID (3)";
	case SIMCONNECT_EXCEPTION_UNOPENED:			//4
		return "EXCEPTION_UNOPENED (4)";
	case SIMCONNECT_EXCEPTION_VERSION_MISMATCH:	//5
		return "EXCEPTION_VERSION_MISMATCH (5)";
	case SIMCONNECT_EXCEPTION_TOO_MANY_GROUPS:	//6
		return "EXCEPTION_TOO_MANY_GROUPS (6)";
	case SIMCONNECT_EXCEPTION_NAME_UNRECOGNIZED://7
		return "EXCEPTION_NAME_UNRECOGNIZED (7)";
	case SIMCONNECT_EXCEPTION_TOO_MANY_EVENT_NAMES:		//8
		return "EXCEPTION_TOO_MANY_EVENT_NAMES (8)";
	case SIMCONNECT_EXCEPTION_EVENT_ID_DUPLICATE:		//9
		return "EXCEPTION_EVENT_ID_DUPLICATE (9)";
	case SIMCONNECT_EXCEPTION_TOO_MANY_MAPS:			//10
		return "EXCEPTION_TOO_MANY_MAPS (10)";
	case SIMCONNECT_EXCEPTION_TOO_MANY_OBJECTS:			//11
		return "EXCEPTION_TOO_MANY_OBJECTS (11)";
	case SIMCONNECT_EXCEPTION_TOO_MANY_REQUESTS:				//12
		return "EXCEPTION_TOO_MANY_REQUESTS (12)";
	case SIMCONNECT_EXCEPTION_WEATHER_INVALID_PORT:				//13
		return "EXCEPTION_WEATHER_INVALID_PORT (13)";
	case SIMCONNECT_EXCEPTION_WEATHER_INVALID_METAR:			//14
		return "EXCEPTION_WEATHER_INVALID_METAR (14)";
	case SIMCONNECT_EXCEPTION_WEATHER_UNABLE_TO_GET_OBSERVATION://15
		return "EXCEPTION_WEATHER_UNABLE_TO_GET_OBSERVATION (15)";
	case SIMCONNECT_EXCEPTION_WEATHER_UNABLE_TO_CREATE_STATION:	//16
		return "EXCEPTION_WEATHER_UNABLE_TO_CREATE_STATION (16)";
	case SIMCONNECT_EXCEPTION_WEATHER_UNABLE_TO_REMOVE_STATION:	//17
		return "EXCEPTION_WEATHER_UNABLE_TO_REMOVE_STATION (17)";
	case SIMCONNECT_EXCEPTION_INVALID_DATA_TYPE:				//18
		return "EXCEPTION_INVALID_DATA_TYPE (18)";
	case SIMCONNECT_EXCEPTION_INVALID_DATA_SIZE:				//19
		return "EXCEPTION_INVALID_DATA_SIZE (19)";
	case SIMCONNECT_EXCEPTION_DATA_ERROR:						//20
		return "EXCEPTION_DATA_ERROR (20)";
	case SIMCONNECT_EXCEPTION_INVALID_ARRAY:			//21
		return "EXCEPTION_INVALID_ARRAY (21)";
	case SIMCONNECT_EXCEPTION_CREATE_OBJECT_FAILED:		//22
		return "EXCEPTION_CREATE_OBJECT_FAILED (22)";
	case SIMCONNECT_EXCEPTION_LOAD_FLIGHTPLAN_FAILED:	//23
		return "EXCEPTION_LOAD_FLIGHTPLAN_FAILED (23)";
	case SIMCONNECT_EXCEPTION_OPERATION_INVALID_FOR_OBJECT_TYPE://24
		return "EXCEPTION_OPERATION_INVALID_FOR_OBJECT_TYPE (24)";
	case SIMCONNECT_EXCEPTION_ILLEGAL_OPERATION:				//25
		return "EXCEPTION_ILLEGAL_OPERATION (25)";
	case SIMCONNECT_EXCEPTION_ALREADY_SUBSCRIBED:				//26
		return "EXCEPTION_ALREADY_SUBSCRIBED (26)";
	case SIMCONNECT_EXCEPTION_INVALID_ENUM:						//27
		return "EXCEPTION_INVALID_ENUM (27)";
	case SIMCONNECT_EXCEPTION_DEFINITION_ERROR:	//28
		return "EXCEPTION_DEFINITION_ERROR (28)";
	case SIMCONNECT_EXCEPTION_DUPLICATE_ID:		//29
		return "EXCEPTION_DUPLICATE_ID (29)";
	case SIMCONNECT_EXCEPTION_DATUM_ID:			//30
		return "EXCEPTION_DATUM_ID (30)";
	case SIMCONNECT_EXCEPTION_OUT_OF_BOUNDS:	//31
		return "EXCEPTION_OUT_OF_BOUNDS (31)";
	case SIMCONNECT_EXCEPTION_ALREADY_CREATED:	//32
		return "EXCEPTION_ALREADY_CREATED (32)";
	case SIMCONNECT_EXCEPTION_OBJECT_OUTSIDE_REALITY_BUBBLE://33
		return "EXCEPTION_OBJECT_OUTSIDE_REALITY_BUBBLE (33)";
	case SIMCONNECT_EXCEPTION_OBJECT_CONTAINER:				//34
		return "EXCEPTION_OBJECT_CONTAINER (34)";
	case SIMCONNECT_EXCEPTION_OBJECT_AI:					//35
		return "EXCEPTION_OBJECT_AI (35)";
	case SIMCONNECT_EXCEPTION_OBJECT_ATC:					//36
		return "EXCEPTION_OBJECT_ATC (36)";
	case SIMCONNECT_EXCEPTION_OBJECT_SCHEDULE:				//37
		return "EXCEPTION_OBJECT_SCHEDULE (37)";
	default:
		return "UNKNOWN EXCEPTION";
	}
}
void CALLBACK RadaltDispatchProc(SIMCONNECT_RECV* pData, DWORD cbData, void* pContext)
{	
	switch (pData->dwID)
	{
	case SIMCONNECT_RECV_ID_EVENT:
	{
		SIMCONNECT_RECV_EVENT* evt = (SIMCONNECT_RECV_EVENT*)pData;

		switch (evt->uEventID)
		{
		case EVENT_RADAR_ON:
			if (!radarActive)
			{
				simVars = new SimVars();
				get_startup_data();
			}
			break;
		case EVENT_RADAR_OFF:
			if (radarActive)
			{
				remove_probes();
			}
			break;
		default:
			std::cout << "RADALT: Unknown event: " << evt->uEventID << std::endl;
			break;
		}
		break;
	}
	case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
	{
		SIMCONNECT_RECV_SIMOBJECT_DATA* pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA*)pData;

		if (pObjData->dwRequestID >= (UINT)REQUEST_PROBE_DATA &&
			pObjData->dwRequestID < (UINT)REQUEST_PROBE_DATA + MAX_AI) {

			UINT probe_i = (UINT)pObjData->dwRequestID - (UINT)REQUEST_PROBE_DATA;

			probeStruct* pS = (probeStruct*)&pObjData->dwData;

			probe_pos.altitude = pS->altitude;
			probe_pos.altAbvGnd = pS->altAbvGnd;
			probe_pos.latitude = pS->latitude;
			probe_pos.longitude = pS->longitude;
			probe_pos.pitch = pS->pitch;            // ground distance
			probe_pos.heading = pS->heading;        // ground bearing

			update_probe_mesh(probe_i);
			read_probe_data(probe_i, probe_pos);

		}
		else if (pObjData->dwRequestID == (UINT)REQUEST_USER_DATA) {
			userStruct* uS = (userStruct*)&pObjData->dwData;

			user_pos.altitude = uS->altitude;
			user_pos.altAbvGnd = uS->altAbvGnd;
			user_pos.latitude = uS->latitude;
			user_pos.longitude = uS->longitude;
			user_pos.heading = uS->heading;
			user_pos.bank = uS->bank;
			user_pos.pitch = uS->pitch;

		}
		break;
	}
	case SIMCONNECT_RECV_ID_ASSIGNED_OBJECT_ID:
	{
		SIMCONNECT_RECV_ASSIGNED_OBJECT_ID* pObjData = (SIMCONNECT_RECV_ASSIGNED_OBJECT_ID*)pData;

		if (pObjData->dwRequestID >= (UINT)REQUEST_PROBE_CREATE &&
			pObjData->dwRequestID < (UINT)REQUEST_PROBE_CREATE + MAX_AI) {

			UINT probe_i = (UINT)pObjData->dwRequestID - (UINT)REQUEST_PROBE_CREATE;
			probe_info[probe_i].id = pObjData->dwObjectID;
			probe_info[probe_i].created = true;

			probe_init(probe_i);

			if (debug) std::cout << "Created probe id = " << probe_info[probe_i].id << std::endl;

			get_updated_probe(probe_i);
		}
		else {
			if (debug) std::cout << "Unknown creation %d" << pObjData->dwRequestID << std::endl;
		}
		break;
	}
	case SIMCONNECT_RECV_ID_QUIT:
	{
		quit = 1;
		break;
	}
	case SIMCONNECT_RECV_ID_EXCEPTION:
	{
		SIMCONNECT_RECV_EXCEPTION* data = (SIMCONNECT_RECV_EXCEPTION*)(pData);
		SIMCONNECT_EXCEPTION exception = (SIMCONNECT_EXCEPTION)(data->dwException);
		std::cout << "Exception: " << ExceptionName(exception) << std::endl;
		break;
	}
	default:
		std::cout << "Received: " << pData->dwID << std::endl;
		break;
	}
}