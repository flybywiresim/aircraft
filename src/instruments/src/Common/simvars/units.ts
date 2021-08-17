export type SimVarUnit = SimVarLengthUnit | SimVarAreaUnit | SimVarVolumeUnit | SimVarTempUnit |
SimVarAngleUnit | SimVarGlobalPositionUnit | SimVarAngularVelocityUnit | SimVarAngularAccelerationUnit |
SimVarSpeedUnit | SimVarAccelerationUnit | SimVarTimeUnit | SimVarPowerUnit | SimVarVolumeRateUnit |
SimVarWeightUnit | SimVarWeightRateUnit | SimVarElectricalCurrentUnit | SimVarElectricalPotentialUnit |
SimVarFrequencyUnit | SimVarDensityUnit | SimVarPressureUnit | SimVarTorqueUnit | SimVarMiscUnit;

export type SimVarLengthUnit =
'meter' | 'meters' | 'm' |
'centimeter' | 'centimeters' | 'cm' |
'kilometer' | 'kilometers' | 'km' |
'millimeter' | 'millimeters' |
'mile' | 'miles' |
'decimile' | 'decimiles' |
'nautical mile' | 'nautical miles' | 'nmile' | 'nmiles' |
'decinmile' | 'decinmiles' |
'foot' | 'feet' | 'ft' |
'inch' | 'inches' | 'in' |
'yard' | 'yards';

export type SimVarAreaUnit =
'square inch' | 'square inches' | 'sq in' | 'in2' |
'square feet' | 'square foot' | 'sq ft' | 'ft2' |
'square yard' | 'square yards' | 'sq yd' | 'yd2' |
'square meter' | 'square meters' | 'sq m' | 'm2' |
'square centimeter' | 'square centimeters' | 'sq cm' | 'cm2' |
'square kilometer' | 'square kilometers' | 'sq km' | 'km2' |
'square millimeter' | 'square millimeters' | 'sq mm' | 'mm2' |
'square mile' | 'square miles';

export type SimVarVolumeUnit =
'cubic inch' | 'cubic inches' | 'cu in' | 'in3' |
'cubic foot' | 'cubic feet' | 'cu ft' | 'ft3' |
'cubic yard' | 'cubic yards' | 'cu yd' | 'yd3' |
'cubic mile' | 'cubic miles' |
'cubic millimeter' | 'cubic millimeters' | 'cu mm' | 'mm3' |
'cubic centimeter' | 'cubic centimeters' | 'cu cm' | 'cm3' |
'meter cubed' | 'meters cubed' | 'cubic meter' | 'cubic meters' | 'cu m' | 'm3' |
'cubic kilometer' | 'cubic kilometers' | 'cu km' | 'km3' |
'liter' | 'liters' |
'gallon' | 'gallons' |
'quart' | 'quarts';

export type SimVarTempUnit =
'kelvin' |
'rankine' |
'farenheit' | 'fahrenheit' |
'celsius';

export type SimVarAngleUnit =
'radian' | 'radians' |
'round' | 'rounds' |
'degree' | 'degrees' |
'degree latitude' |
'degree longitude' |
'grad' | 'grads';

export type SimVarGlobalPositionUnit =
'degree latitude' | 'degrees latitude' |
'degree longitude' | 'degrees longitude' |
'meter latitude' | 'meters latitude';

export type SimVarAngularVelocityUnit =
'radian per second' | 'radians per second' |
'revolution per minute' | 'revolutions per minute' | 'rpm' | 'rpms' |
'minute per round' | 'minutes per round' |
'nice minute per round' | 'nice minutes per round' |
'degree per second' | 'degrees per second';

export type SimVarAngularAccelerationUnit =
'radian per second squared' | 'radians per second squared' |
'degree per second squared' | 'degrees per second squared';

export type SimVarSpeedUnit =
'meter per second' | 'meters/second' | 'm/s' |
'meter per minute' | 'meters per minute' |
'feet/second' |
'feet/minute' | 'ft/min' |
'kilometer/hour' | 'kilometers/hour' | 'kilometers per hour' | 'kph' |
'knot' | 'knots' |
'mile per hour' | 'miles per hour' | 'mph' |
'mach' | 'machs';

export type SimVarAccelerationUnit =
'meter per second squared' | 'meters per second squared' |
'Gforce' | 'G Force' |
'feet per second squared' | 'foot per second squared';

export type SimVarTimeUnit =
'second' | 'seconds' |
'minute' | 'minutes' |
'hour' | 'hours' |
'day' | 'days' |
'hour over 10' | 'hours over 10' |
'year' | 'years';

export type SimVarPowerUnit =
'Watt' | 'Watts' |
'ft lb per second';

export type SimVarVolumeRateUnit =
'meter cubed per second' | 'meters cubed per second' |
'gallon per hour' | 'gallons per hour' | 'gph' |
'liter per hour' | 'liters per hour';

export type SimVarWeightUnit =
'kilogram' | 'kilograms' | 'kg' |
'slug' | 'slugs' | 'geepound' | 'geepounds' |
'pound' | 'pounds' | 'lbs';

export type SimVarWeightRateUnit =
'kilogram per second' | 'kilograms per second' |
'pound per hour' | 'pounds per hour';

export type SimVarElectricalCurrentUnit =
'ampere' | 'amperes' | 'amp' | 'amps';

export type SimVarElectricalPotentialUnit =
'volt' | 'volts';

export type SimVarFrequencyUnit =
'Hertz' | 'Hz' |
'Kilohertz' | 'KHz' |
'Megahertz' | 'MHz' |
'Frequency BCD32' |
'Frequency BCD16' |
'Frequency ADF BCD32';

export type SimVarDensityUnit =
'kilogram per cubic meter' | 'kilograms per cubic meter' |
'Slug per cubic feet' | 'Slugs per cubic feet' | 'Slug/ft3' | 'slug per cubic foot' | 'slugsper cubic foot' |
'pound per gallon' | 'pounds per gallon' | 'lbs/gallon';

export type SimVarPressureUnit =
'pascal' | 'pascals' | 'Pa' |
'Newton per square meter' | 'newtons per square meter' |
'kilopascal' | 'kpa' |
'kilogram force per square centimeter' | 'KgFSqCm' |
'millimeter of mercury' | 'millimeters of mercury' | 'mmHg' |
'centimeter of mercury' | 'centimeters of mercury' | 'cmHg' |
'inch of mercury' | 'inches of mercury' | 'inHg' |
'atmosphere' | 'atmospheres' | 'atm' |
'millimeter of water' | 'millimeters of water' |
'pound-force per square inch' | 'psi' |
'pound-force per square foot' | 'psf' |
'bar' | 'bars' |
'millibar' | 'millibars' | 'mbar' | 'mbars' | 'hectopascal' | 'hectopascals' |
'boost cmHg' |
'boost inHg' |
'boost psi' |
'slug feet squared' | 'slugs feet squared' |
'kilogram meter squared' | 'kilograms meter squared' |
'millibar' | 'millibars' | 'mbar' | 'mbars' | 'hectopascal' | 'hectopascals';

export type SimVarTorqueUnit =
'Newton meter' | 'Newton' | 'meters' | 'nm' |
'foot-pound' | 'foot pound' | 'ft-lbs' | 'foot-pounds' |
'lbf-feet' |
'kilogram meter' | 'kilogram meters' | 'kgf meter' | 'kgf meters' |
'poundal feet';

export type SimVarMiscUnit =
'part' |
'half' | 'halfs' |
'third' | 'thirds' |
'percent' | 'percentage' |
'percent over 100' |
'bel' | 'bels' |
'decibel' | 'decibels' |
'more_than_a_half' |
'times' |
'ratio' |
'number' | 'numbers' |
'scaler' |
'position' |
'Enum' |
'Bool' | 'Boolean' |
'Bco16' |
'mask' |
'flags' |
'string' |
'per radian' |
'per degree';
