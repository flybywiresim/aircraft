export class Lrc {
  GW: number; // Gross weight (kg)
  FL: number; // Flight level (ft)
  ISA_dev: number; // ISA deviation (°C)
  S: number; // Wing area (m^2)
  CD0: number;
  k: number;
  TSFC_base: number; // Base TSFC (kg / (N * s))
  machMin: number;
  machMax: number;
  machStep: number;
  private g = 9.80665;
  private R = 287.05287;
  private gamma = 1.4;

  constructor(opts: {
    GW: number;
    FL: number;
    ISA_dev: number;
    S: number;
    CD0: number;
    k: number;
    TSFC_base: number;
    machMin: number;
    machMax: number;
    machStep: number;
  }) {
    this.GW = opts.GW;
    this.FL = opts.FL;
    this.ISA_dev = opts.ISA_dev;
    this.S = opts.S;
    this.CD0 = opts.CD0;
    this.k = opts.k;
    this.TSFC_base = opts.TSFC_base;
    this.machMin = opts.machMin;
    this.machMax = opts.machMax;
    this.machStep = opts.machStep;
  }

  private isaAtmosphere(alt_m: number) {
    const T0 = 288.15;
    const p0 = 101325;
    let T: number, p: number;

    if (alt_m <= 11000) {
      const lapse = -0.0065;
      T = T0 + lapse * alt_m + this.ISA_dev;
      p = p0 * Math.pow(T / T0, -this.g / (this.R * lapse));
    } else {
      T = 216.65 + this.ISA_dev;
      p = p0 * 0.223361 * Math.exp((-this.g * (alt_m - 11000)) / (this.R * T));
    }
    return {
      T,
      rho: p / (this.R * T),
      a: Math.sqrt(this.gamma * this.R * T),
    };
  }

  private tsfcModel(M: number, alt_m: number): number {
    const altPenalty = 1 + 0.03 * Math.max(0, (alt_m - 11000) / 10000);
    const machPenalty = 1 + 1.5 * Math.pow(Math.max(0, M - 0.82), 2);
    return this.TSFC_base * altPenalty * machPenalty;
  }

  computeSRforMach(M: number): number {
    const alt_m = this.FL * 0.3048;
    const { rho, a } = this.isaAtmosphere(alt_m);
    const V = M * a;
    const W = this.GW * this.g;
    const CL = (2 * W) / (rho * V * V * this.S);
    const CL_buffet = 0.62;

    if (CL > CL_buffet) return 0;
    const M_buffet = 0.88 - 0.00000025 * (this.GW - 300000);
    if (M > M_buffet) return 0;
    const Mcrit = 0.82;
    let CD_comp = 1.0;
    if (M > Mcrit) {
      CD_comp += 12 * Math.pow(M - Mcrit, 2) * (1 + 2 * CL);
    }
    const CD = (this.CD0 + this.k * CL * CL) * CD_comp;
    const D = 0.5 * rho * V * V * this.S * CD;
    const tsfc = this.tsfcModel(M, alt_m);
    const mdot = tsfc * D;
    if (mdot <= 0) return 0;
    return V / mdot / 1852;
  }

  computeSRcurve(): { machs: number[]; srs: number[] } {
    const machs: number[] = [];
    const srs: number[] = [];
    for (let m = this.machMin; m <= this.machMax + 1e-9; m += this.machStep) {
      machs.push(Number(m.toFixed(6)));
      srs.push(this.computeSRforMach(m));
    }
    return { machs, srs };
  }

  computeLRC() {
    let bestSR = 0;
    let M_mrc = this.machMin;

    for (let M = this.machMin; M <= this.machMax; M += this.machStep) {
      const SR = this.computeSRforMach(M);
      if (SR > bestSR) {
        bestSR = SR;
        M_mrc = M;
      }
    }
    const SR_target = 0.99 * bestSR;
    let M_lrc = M_mrc;
    for (let M = M_mrc; M <= this.machMax; M += this.machStep) {
      if (this.computeSRforMach(M) >= SR_target) {
        M_lrc = M;
      }
    }
    return {
      M_mrc: Number(M_mrc.toFixed(3)),
      M_lrc: Number(M_lrc.toFixed(3)),
      SR_max: bestSR,
    };
  }
}
