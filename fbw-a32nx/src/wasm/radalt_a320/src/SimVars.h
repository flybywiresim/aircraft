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
	ID DevVar;
	ID RadAlt;

	SimVars() { this->initializeVars(); }

	void initializeVars() {
		DevVar = register_named_variable("A32NX_DEVELOPER_STATE");
		RadAlt = register_named_variable("A32NX_RADAR_ALTIMETER");

		//this->setDeveloperState(0);
		this->setRadAlt(99999);


		m_Units = new Units();
	}
	// Collection of LVar 'set' Functions
	void setDeveloperState(FLOAT64 value) { set_named_variable_value(DevVar, value); }
	void setRadAlt(FLOAT64 value) { set_named_variable_value(RadAlt, value); }

	// Collection of SimVar/LVar 'get' Functions
	FLOAT64 getDeveloperState() { return get_named_variable_value(DevVar); }
	FLOAT64 getRadAlt() { return get_named_variable_value(RadAlt); }
};