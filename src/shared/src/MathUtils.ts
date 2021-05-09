export class MathUtils {
   static DEEGREES_TO_RADIANS = Math.PI / 180;

   static Rad2Deg = 180 / Math.PI;

   private static optiPow10 = [];

   public static fastToFixed(val: number, fraction: number): string {
       if (fraction <= 0) {
           return Math.round(val).toString();
       }

       let coefficient = MathUtils.optiPow10[fraction];
       if (!coefficient || Number.isNaN(coefficient)) {
           coefficient = 10 ** fraction;
           MathUtils.optiPow10[fraction] = coefficient;
       }

       return (Math.round(val * coefficient) / coefficient).toString();
   }
}
