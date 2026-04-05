import { Constants } from '@flybywiresim/fbw-sdk';

export class HpathLaw {
  public static readonly Tau = 3; // seconds
  public static readonly Zeta = 0.8; // 1
  public static readonly G = Constants.G * 6997.84; // kts/h
  public static readonly T = this.Tau / 3600; // hours
  public static readonly K1 = 180 / 4 / Math.PI ** 2 / this.Zeta / this.T; // 1 / h
  public static readonly K2 = this.Zeta / Math.PI / this.G / this.T; // 1 / kts
  public static readonly InterceptAngle = 45;
}
