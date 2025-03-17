/**
 * Stall speed table
 * calls function(gross weight (t), landing gear) which returns CAS.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const vs = [
  [
    () => 124,
    (m) => 124 + 1.4 * (m - 40),
    (m) => 131 + 1.4 * (m - 45),
    (m) => 138 + 1.4 * (m - 50),
    (m) => 145 + m - 55,
    (m) => 150 + 1.2 * (m - 60),
    (m) => 155 + 1.2 * (m - 65),
    (m) => 161 + m - 70,
    (m) => 166 + 1.2 * (m - 75),
    () => 172,
  ], // Clean Conf
  [
    () => 93,
    (m) => 93 + m - 40,
    (m) => 98 + m - 45,
    (m) => 103 + m - 50,
    (m) => 108 + 0.8 * (m - 55),
    (m) => 112 + m - 60,
    (m) => 117 + 0.8 + (m - 65),
    (m) => 121 + 0.8 + (m - 70),
    (m) => 125 + m - 75,
    () => 130,
  ], // Conf 1 + F
  [
    () => 91,
    (m) => 91 + m - 40,
    (m) => 96 + m - 45,
    (m) => 101 + 0.8 * (m - 50),
    (m) => 105 + m - 55,
    (m) => 110 + 0.8 * (m - 60),
    (m) => 114 + m - 65,
    (m) => 119 + 0.6 * (m - 70),
    (m) => 122 + 0.8 * (m - 75),
    () => 126,
  ], // Conf 2
  [
    (_, ldg) => 91 - ldg * 2,
    (m, ldg) => 91 + m - 40 - ldg * 2,
    (m, ldg) => 96 + m - 45 - ldg * 2,
    (m, ldg) => 101 + 0.8 * (m - 50) - ldg * 2,
    (m, ldg) => 105 + m - 55 - ldg * 2,
    (m, ldg) => 110 + 0.8 * (m - 60) - ldg * 2,
    (m, ldg) => 114 + m - 65 - ldg * 2,
    (m, ldg) => 119 + 0.6 * (m - 70) - ldg * 2,
    (m, ldg) => 122 + 0.8 * (m - 75) - ldg * 2,
    (_, ldg) => 126 - ldg * 2,
  ], // Conf 3
  [
    () => 84,
    (m) => 84 + 0.8 * (m - 40),
    (m) => 88 + m - 45,
    (m) => 93 + 0.8 * (m - 50),
    (m) => 97 + 0.8 * (m - 55),
    (m) => 101 + 0.8 * (m - 60),
    (m) => 105 + 0.8 * (m - 65),
    (m) => 109 + 0.8 * (m - 70),
    (m) => 113 + 0.6 * (m - 75),
    () => 116,
  ], // Conf Full
  [
    () => 102,
    (m) => 102 + m - 40,
    (m) => 107 + m - 45,
    (m) => 112 + m - 50,
    (m) => 117 + 1.2 * (m - 55),
    (m) => 123 + 0.8 * (m - 60),
    (m) => 127 + m - 65,
    (m) => 132 + m - 70,
    (m) => 137 + 0.8 * (m - 75),
    () => 141,
  ], // Conf 1
];

/**
 * Lowest selectable Speed Table
 * calls function(gross weigh (t), landing gear) which returns CAS, automatically compensates for cg.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const vls = [
  [
    () => 159,
    (m) => 159 + 1.8 * (m - 40),
    (m) => 168 + 1.8 * (m - 45),
    (m) => 177 + 1.8 * (m - 50),
    (m) => 186 + 1.2 * (m - 55),
    (m) => 192 + 1.2 * (m - 60),
    (m) => 198 + 1.6 * (m - 65),
    (m) => 206 + 1.2 * (m - 70),
    (m) => 212 + 1.6 * (m - 75),
    () => 220,
  ], // Clean Config
  [
    () => 114,
    (m) => 114 + 1.4 * (m - 40),
    (m) => 121 + 1.2 * (m - 45),
    (m) => 127 + 1.2 * (m - 50),
    (m) => 133 + m - 55,
    (m) => 138 + 1.2 * (m - 60),
    (m) => 144 + m - 65,
    (m) => 149 + m - 70,
    (m) => 154 + 1.2 * (m - 75),
    () => 160,
  ], // Config 1 + F
  [
    () => 110,
    (m) => 110 + 1.8 * (m - 40),
    (m) => 119 + 1.2 * (m - 45),
    (m) => 125 + 1.2 * (m - 50),
    (m) => 131 + 1.2 * (m - 55),
    (m) => 137 + m - 60,
    (m) => 142 + 0.6 * (m - 65),
    (m) => 145 + 0.8 * (m - 70),
    (m) => 149 + m - 75,
    () => 154,
  ], // Config 2
  [
    (_, ldg) => 117 - ldg,
    (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 117 + 0.4 * (m - 40) : 117)) - ldg,
    (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 119 + 1.2 * (m - 45) : 117 + 1.4 * (m - 45))) - ldg,
    (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 125 + 1.2 * (m - 50) : 124 + 1.2 * (m - 50))) - ldg,
    (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 131 + 1.2 * (m - 55) : 130 + m - 55)) - ldg,
    (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 137 + m - 60 : 135 + 1.2 * (m - 60))) - ldg,
    (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 142 : 141) + m - 65) - ldg,
    (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 147 : 146) + m - 70) - ldg,
    (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 152 + 0.8 * (m - 75) : 151 + m - 65)) - ldg,
    (_, ldg) => 156 - ldg,
  ], // Config 3
  [
    () => 116,
    () => 116,
    () => 116,
    (m) => 116 + correctCg(m, (m, cg) => (cg < 25 ? 0.8 : 0.6) * (m - 50)),
    (m) => correctCg(m, (m, cg) => (cg < 25 ? 120 : 119) + m - 55),
    (m) => correctCg(m, (m, cg) => (cg < 25 ? 125 : 124) + m - 60),
    (m) => correctCg(m, (m, cg) => (cg < 25 ? 130 : 129) + m - 65),
    (m) => correctCg(m, (m, cg) => (cg < 25 ? 135 + 0.8 * (m - 70) : 134 + m - 70)),
    (m) => 139 + 0.8 * (m - 75),
    () => 143,
  ], // Config Full
  [
    () => 125,
    (m) => 125 + 1.4 * (m - 40),
    (m) => 132 + 1.2 * (m - 45),
    (m) => 138 + 1.2 * (m - 50),
    (m) => 144 + 1.4 * (m - 55),
    (m) => 151 + m - 60,
    (m) => 156 + 1.2 * (m - 65),
    (m) => 162 + 1.4 * (m - 70),
    (m) => 169 + 0.8 * (m - 75),
    () => 173,
  ], // Config 1
];

/**
 * Lowest selectable Speed Table for TakeOff ONLY
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const vlsTo = [
  vls[0], // Clean Config
  [
    () => 105,
    (m) => 105 + 1.2 * (m - 40),
    (m) => 111 + m - 45,
    (m) => 116 + 1.2 * (m - 50),
    (m) => 122 + m - 55,
    (m) => 127 + m - 60,
    (m) => 132 + m - 65,
    (m) => 137 + 0.8 * (m - 70),
    (m) => 141 + 1.2 * (m - 75),
    () => 147,
  ], // Config 1 + F
  [
    (_) => 101,
    (m) => 101 + 1.4 * (m - 40),
    (m) => 108 + 1.2 * (m - 45),
    (m) => 114 + m - 50,
    (m) => 119 + 1.2 * (m - 55),
    (m) => 125 + m - 60,
    (m) => 130 + 0.4 * (m - 65),
    (m) => 132 + 0.8 * (m - 70),
    (m) => 136 + 0.8 * (m - 75),
    () => 140,
  ], // Config 2
  [
    () => 101,
    (m) => 101 + m - 40,
    (m) => 106 + 1.2 * (m - 45),
    (m) => 112 + 0.8 * (m - 50),
    (m) => 116 + 1.2 * (m - 55),
    (m) => 122 + m - 60,
    (m) => 127 + m - 65,
    (m) => 132 + 0.8 * (m - 70),
    (m) => 136 + 0.8 * (m - 75),
    () => 140,
  ], // Config 3
  vls[4], // Config Full
  vls[5], // Config 1
];

/**
 * F-Speed Table
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const f = [
  () => 131,
  () => 131,
  () => 131,
  (m) => 131 + 1.2 * (m - 50),
  (m) => 137 + 1.4 * (m - 55),
  (m) => 144 + m - 60,
  (m) => 149 + 1.2 * (m - 65),
  (m) => 155 + m - 70,
  (m) => 160 + 1.2 * (m - 75),
  () => 166,
];

/**
 * S-Speed Table
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const s = [
  () => 152,
  (m) => 152 + 1.8 * (m - 40),
  (m) => 161 + 1.6 * (m - 45),
  (m) => 169 + 1.8 * (m - 50),
  (m) => 178 + 1.6 * (m - 55),
  (m) => 186 + 1.4 * (m - 60),
  (m) => 193 + 1.4 * (m - 65),
  (m) => 200 + 1.4 * (m - 70),
  (m) => 207 + 1.4 * (m - 75),
  () => 214,
];

const vmca = [
  [-2000, 115],
  [0, 114],
  [2000, 114],
  [4000, 113],
  [6000, 112],
  [8000, 109],
  [10000, 106],
  [12000, 103],
  [14100, 99],
  [15100, 97],
];

const vmcg = [
  // 1+F, 2, 3 all the same
  [-2000, 117],
  [0, 116],
  [2000, 116],
  [4000, 115],
  [6000, 114],
  [8000, 112],
  [10000, 109],
  [12000, 106],
  [14100, 102],
  [15100, 101],
];

/**
 * Vfe for Flaps/Slats
 * @type {number[]}
 */
const vfeFS = [
  215, // Config 1 + F
  200, // Config 2
  185, // Config 3
  177, // Config Full
  230, // Config 1
];

const Vmo = 350;
const Mmo = 0.82;

/**
 * Correct input function for cg
 * @param m {number} gross weight (t)
 * @param f {function} function to be called with cg variable
 * @param cg {number} center of gravity
 * @returns {number} cg corrected velocity (CAS)
 */
function correctCg(m, f, cg = SimVar.GetSimVarValue('CG PERCENT', 'percent')) {
  return f(m, isNaN(cg) ? 24 : cg);
}

/**
 * Ensure gross weight (mass) is withing valid range
 * @param m {number} mass: gross weight
 * @returns {number} mass: gross weight
 * @private
 */
function _correctMass(m) {
  return Math.ceil(((m > 80 ? 80 : m) - 40) / 5);
}

/**
 * Calculate green dot speed
 * Calculation:
 * Gross weight (t) * 2 + 85 when below FL200
 * @returns {number}
 */
function _computeGD(m) {
  return m * 2 + 85;
}

/**
 * Corrects velocity for mach effect by adding 1kt for every 1000ft above FL200
 * @param v {number} velocity in kt (CAS)
 * @param alt {number} altitude in feet (baro)
 * @returns {number} Mach corrected velocity in kt (CAS)
 */
function _compensateForMachEffect(v, alt) {
  return Math.ceil(alt > 20000 ? v + (alt - 20000) / 1000 : v);
}

/**
 * Calculates wind component for ground speed mini
 * @param vw {number} velocity wind (headwind)
 * @returns {number} velocity wind [5, 15]
 */
function _addWindComponent(vw) {
  return Math.max(Math.min(15, vw), 5);
}

/**
 * Get difference between angles
 * @param a {number} angle a
 * @param b {number} angle b
 * @returns {number} angle diff
 * @private
 */
function _getdiffAngle(a, b) {
  return 180 - Math.abs(Math.abs(a - b) - 180);
}

/**
 * Get next flaps index for vfeFS table
 * @param fi {number} current flaps index
 * @returns {number} vfeFS table index
 * @private
 */
function _getVfeNIdx(fi) {
  switch (fi) {
    case 0:
      return 4;
    case 5:
      return 1;
    default:
      return fi;
  }
}

/**
 * Convert degrees Celsius into Kelvin
 * @param T {number} degrees Celsius
 * @returns {number} degrees Kelvin
 */
function _convertCtoK(T) {
  return T + 273.15;
}

/**
 * Convert Mach to True Air Speed
 * @param M {number} Mach
 * @param T {number} Kelvin
 * @returns {number} True Air Speed
 */
function _convertMachToKTas(M, T) {
  return M * 661.4786 * Math.sqrt(T / 288.15);
}

/**
 * Convert TAS to Mach
 * @param Vt {number} TAS
 * @param T {number} Kelvin
 * @returns {number} True Air Speed
 */
function _convertKTASToMach(Vt, T) {
  return Vt / 661.4786 / Math.sqrt(T / 288.15);
}

/**
 * Convert TAS to Calibrated Air Speed
 * @param Vt {number} velocity true air speed
 * @param T {number} current temperature Kelvin
 * @param p {number} current pressure hpa
 * @returns {number} Calibrated Air Speed
 */
function _convertTasToKCas(Vt, T, p) {
  return (
    1479.1 * Math.sqrt(((p / 1013) * ((1 + (1 / (T / 288.15)) * (Vt / 1479.1) ** 2) ** 3.5 - 1) + 1) ** (1 / 3.5) - 1)
  );
}

/**
 * Convert KCAS to KTAS
 * @param Vc {number} velocity true air speed
 * @param T {number} current temperature Kelvin
 * @param p {number} current pressure hpa
 * @returns {number} Calibrated Air Speed
 */
function _convertKCasToKTAS(Vc, T, p) {
  return (
    1479.1 *
    Math.sqrt((T / 288.15) * (((1 / (p / 1013)) * ((1 + 0.2 * (Vc / 661.4786) ** 2) ** 3.5 - 1) + 1) ** (1 / 3.5) - 1))
  );
}

/**
 * Convert Mach to Calibrated Air Speed
 * @param M {number} Mach
 * @param T {number} Kelvin
 * @param p {number} current pressure hpa
 * @returns {number} Calibrated Air Speed
 */
function _convertMachToKCas(M, T, p) {
  return _convertTasToKCas(_convertMachToKTas(M, T), T, p);
}

/**
 * Get correct Vmax for Vmo and Mmo in knots
 * @returns {number} Min(Vmo, Mmo)
 * @private
 */
function _getVmo() {
  return Math.min(
    Vmo,
    _convertMachToKCas(
      Mmo,
      _convertCtoK(Simplane.getAmbientTemperature()),
      SimVar.GetSimVarValue('AMBIENT PRESSURE', 'millibar'),
    ),
  );
}

export class NXSpeeds {
  private readonly cm = _correctMass(this.m);
  public vs = vs[this.fPos][this.cm](this.m, this.gPos);
  public vls = (this.isTo ? vlsTo : vls)[this.fPos][this.cm](this.m, this.gPos);
  public readonly vapp = this.vls + _addWindComponent(this.wind);
  public readonly f = f[this.cm](this.m);
  public readonly s = s[this.cm](this.m);
  public gd = _computeGD(this.m);
  public readonly vmax = this.fPos === 0 ? _getVmo() : vfeFS[this.fPos - 1];
  public readonly vfeN = this.fPos === 4 ? 0 : vfeFS[_getVfeNIdx(this.fPos)];

  /**
   * Computes Vs, Vls, Vapp, F, S and GD
   * @param m mass: gross weight in t
   * @param fPos flaps position
   * @param gPos landing gear position
   * @param isTo whether in takeoff config or not
   * @param wind wind speed, defaults to 0.
   */
  constructor(
    private m: number,
    private fPos: number,
    private gPos: number,
    private isTo: boolean,
    private wind = 0,
  ) {}

  compensateForMachEffect(alt: number) {
    this.vs = _compensateForMachEffect(this.vs, alt);
    this.vls = _compensateForMachEffect(this.vls, alt);
    this.gd = _compensateForMachEffect(this.gd, alt);
  }
}

export class NXSpeedsApp {
  private readonly cm = _correctMass(this.m);
  public readonly vls = vls[this.isConf3 ? 3 : 4][this.cm](this.m, 1);
  public readonly vapp = this.vls + NXSpeedsUtils.addWindComponent(this.wind / 3);
  public readonly f = f[this.cm](this.m);
  public readonly s = s[this.cm](this.m);
  public readonly gd = _computeGD(this.m);
  public valid = true;

  /**
   * Calculates VLS and Vapp for selected landing configuration
   * @param m Projected landing mass in t
   * @param isConf3 CONF3 if true, else FULL
   * @param tower headwind component, defaults to 0.
   */
  constructor(
    private m: number,
    private isConf3: boolean,
    private wind = 0,
  ) {}
}

export class NXSpeedsUtils {
  /**
   * Calculates wind component for ground speed mini
   * @param vw {number} velocity wind (1/3 steady headwind)
   * @returns {number} velocity wind [5, 15]
   */
  static addWindComponent(vw = (SimVar.GetSimVarValue('AIRCRAFT WIND Z', 'knots') * -1) / 3) {
    return _addWindComponent(vw);
  }

  /**
   * Calculates headwind component
   * @param v {number} velocity wind
   * @param a {number} angle: a
   * @param b {number} angle: b
   * @returns {number} velocity headwind
   */
  static getHeadwind(v, a, b) {
    return v * Math.cos(_getdiffAngle(a, b) * (Math.PI / 180));
  }

  /**
   * 1/3 * (current headwind - tower headwind)
   * @param vTwr {number} velocity tower headwind
   * @param vCur {number} velocity current headwind
   * @returns {number} head wind diff
   */
  static getHeadWindDiff(vTwr, vCur = SimVar.GetSimVarValue('AIRCRAFT WIND Z', 'knots') * -1) {
    return Math.round((1 / 3) * (vCur - vTwr));
  }

  /**
   * Returns Vtarget limited by Vapp and VFE next
   * @param vapp {number} Vapp
   * @param windDiff {number} ground speed mini
   * @returns {number}
   */
  static getVtargetGSMini(vapp, windDiff) {
    return Math.max(
      vapp,
      Math.min(
        Math.round(vapp + windDiff),
        Math.round(
          SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number') === 4
            ? SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'Number') - 5
            : SimVar.GetSimVarValue('L:A32NX_SPEEDS_VFEN', 'Number'),
        ),
      ),
    );
  }

  static convertKCasToMach(
    Vc,
    T = _convertCtoK(Simplane.getAmbientTemperature()),
    p = SimVar.GetSimVarValue('AMBIENT PRESSURE', 'millibar'),
  ) {
    return _convertKTASToMach(_convertKCasToKTAS(Vc, T, p), T);
  }

  /** @private */
  static interpolateTable(table, alt) {
    if (alt <= table[0][0]) {
      return vmca[0][1];
    }
    if (alt >= table[table.length - 1][0]) {
      table[table.length - 1][1];
    }
    for (let i = 0; i < table.length - 1; i++) {
      if (alt >= table[i][0] && alt <= table[i + 1][0]) {
        const d = (alt - table[i][0]) / (table[i + 1][0] - table[i][0]);
        return Avionics.Utils.lerpAngle(table[i][1], table[i + 1][1], d);
      }
    }
  }

  /**
   * Get VMCA (minimum airborne control speed) for a given altitude
   * @param {number} altitude Altitude in feet
   * @returns VMCA in knots
   */
  static getVmca(altitude) {
    return this.interpolateTable(vmca, altitude);
  }

  /**
   * Get VMCG (minimum ground control speed) for a given altitude
   * @param {number} altitude Altitude in feet
   * @returns VMCG in knots
   */
  static getVmcg(altitude) {
    return this.interpolateTable(vmcg, altitude);
  }

  /**
   * Get Vs1g for the given config
   *
   * @param {number} mass mass of the aircraft in tons
   * @param {number} conf 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
   * @param {boolean} gearDown true if the gear is down
   */
  static getVs1g(mass, conf, gearDown) {
    return vs[conf][_correctMass(mass)](mass, gearDown ? 1 : 0);
  }
}
