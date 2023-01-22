import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';

export class BisectionMethod {
    /**
     * Use bisection method to approximate root of a function. This method works best for continuous functions.
     * We
     * @param f Function to find root of. Should take in a number and return a number.
     * @param a, b Bounds of domain to search for root. Should be such that f(a) and f(b) have opposite signs.
     * @param errorTolerance An array [e0, e1] describing the interval in which the error is allowed to be.
     * @param maxIterations Number of iterations to perform before giving up.
     * @param nonTerminationStrategy Strategy to use if the method does not converge.
     * @link https://en.wikipedia.org/wiki/Bisection_method
     * @returns
     */
    public static findZero(
        f: (c: number) => number,
        [a, b]: [number, number],
        errorTolerance: [number, number] = [-0.05, 0.05],
        nonTerminationStrategy: NonTerminationStrategy = NonTerminationStrategy.LowerAbsoluteErrorResult,
        maxIterations: number = 10,
    ): number {
        if (a > b) {
            if (VnavConfig.DEBUG_PROFILE) {
                console.warn(`[FMS/VNAV] Expected b > a in bisection method (${a.toFixed(2)} > ${b.toFixed(2)}). Swapping a, b...`);
            }

            [b, a] = [a, b];
        }

        const isWithinTolerance = (error: number): boolean => error >= errorTolerance[0] && error <= errorTolerance[1];

        const fa = f(a);
        const fb = f(b);

        if (fa * fb > 0) {
            // If solution does not lie between a and b, return closer value.
            return Math.abs(fa) < Math.abs(fb) ? a : b;
        }

        if (fa * fb < 0) {
            for (let i = 0; i < maxIterations; i++) {
                const c = (a + b) / 2;
                const fc = f(c);

                if (isWithinTolerance(fc)) {
                    if (VnavConfig.DEBUG_PROFILE) {
                        console.log(`[FMS/VNAV] Final error ${fc} after ${i} iterations.`);
                    }

                    return c;
                }

                if (fa * fc > 0) {
                    a = c;
                } else {
                    b = c;
                }
            }
        }

        if (nonTerminationStrategy === NonTerminationStrategy.PositiveErrorResult) {
            return fa > 0 ? a : b;
        } if (nonTerminationStrategy === NonTerminationStrategy.NegativeErrorResult) {
            return fa < 0 ? a : b;
        }

        return Math.abs(fa) < Math.abs(fb) ? a : b;
    }
}

export enum NonTerminationStrategy {
    PositiveErrorResult,
    NegativeErrorResult,
    LowerAbsoluteErrorResult,
}
