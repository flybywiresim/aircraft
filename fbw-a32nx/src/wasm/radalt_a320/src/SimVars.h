#pragma once

/// <summary>
/// A collection of SimVar unit enums.
/// </summary>
class Units {
public:
	ENUM Percent = get_units_enum("Percent");
	ENUM Pounds = get_units_enum("Pounds");
	ENUM Psi = get_units_enum("Psi");
	ENUM Pph = get_units_enum("Pounds per hour");
	ENUM Gallons = get_units_enum("Gallons");
	ENUM Feet = get_units_enum("Feet");
	ENUM FootPounds = get_units_enum("Foot pounds");
	ENUM FeetMin = get_units_enum("Feet per minute");
	ENUM Number = get_units_enum("Number");
	ENUM Mach = get_units_enum("Mach");
	ENUM Millibars = get_units_enum("Millibars");
	ENUM SluggerSlugs = get_units_enum("Slug per cubic feet");
	ENUM Celsius = get_units_enum("Celsius");
	ENUM Bool = get_units_enum("Bool");
	ENUM Hours = get_units_enum("Hours");
	ENUM Seconds = get_units_enum("Seconds");
};

/// <summary>
/// A collection of SimVars and LVars for the A32NX
/// </summary>
class SimVars {
public:
	Units* m_Units;

	/// <summary>
	/// Collection of LVars for the A32NX
	/// </summary>
	ENUM PlaneAltitudeAGL = get_aircraft_var_enum("PLANE ALT ABOVE GROUND");

	ID DevVar;
	ID ProbeZero;
	ID RadAlt1;
	ID RadAlt2;
	ID AcBus1;
	ID AcBus2;

	SimVars() { this->initializeVars(); }

	void initializeVars() {
		DevVar = register_named_variable("A32NX_DEVELOPER_STATE");
		ProbeZero = register_named_variable("A32NX_RA_PROBE_ZERO");
		RadAlt1 = register_named_variable("A32NX_RA_1_RAW");
		RadAlt2 = register_named_variable("A32NX_RA_2_RAW");
		AcBus1 = register_named_variable("A32NX_ELEC_AC_1_BUS_IS_POWERED");
		AcBus2 = register_named_variable("A32NX_ELEC_AC_2_BUS_IS_POWERED");

		//this->setDeveloperState(0);
		this->setRadioAltitude1(99999);
		this->setRadioAltitude2(99999);
		this->setProbeZero(0);


		m_Units = new Units();
	}
	// Collection of LVar 'set' Functions
	void setProbeZero(FLOAT64 value) { set_named_variable_value(ProbeZero, value); }
	void setDeveloperState(FLOAT64 value) { set_named_variable_value(DevVar, value); }
	void setRadioAltitude1(FLOAT64 value) { set_named_variable_value(RadAlt1, value); }
	void setRadioAltitude2(FLOAT64 value) { set_named_variable_value(RadAlt2, value); }

	// Collection of SimVar/LVar 'get' Functions
	FLOAT64 getDeveloperState() { return get_named_variable_value(DevVar); }
	FLOAT64 getRadarAltitude1() { return get_named_variable_value(RadAlt1); }
	FLOAT64 getRadarAltitude2() { return get_named_variable_value(RadAlt2); }
	FLOAT64 getAcBusState1() { return get_named_variable_value(AcBus1); }
	FLOAT64 getAcBusState2() { return get_named_variable_value(AcBus2); }
	FLOAT64 getPlaneAltitudeAGL() { return aircraft_varget(PlaneAltitudeAGL, m_Units->Feet, 0); }
};