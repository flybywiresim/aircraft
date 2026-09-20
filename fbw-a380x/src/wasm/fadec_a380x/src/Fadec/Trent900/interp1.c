/*
 * File: interp1.c
 * 
 * Linear interpolation implementation
 */

#include "interp1.h"
#include <math.h>

/* Linear interpolation - 1D */
double interp1(const double *x, const double *y, int n, double xi) {
    int i;
    double x1, x2, y1, y2, slope;
    
    /* Handle edge cases */
    if (n <= 0) return 0.0;
    if (n == 1) return y[0];
    
    /* Check if xi is outside bounds */
    if (xi <= x[0]) return y[0];
    if (xi >= x[n-1]) return y[n-1];
    
    /* Find bracketing indices */
    for (i = 0; i < n-1; i++) {
        if (xi >= x[i] && xi <= x[i+1]) {
            x1 = x[i];
            x2 = x[i+1];
            y1 = y[i];
            y2 = y[i+1];
            
            /* Linear interpolation */
            if (fabs(x2 - x1) < 1e-10) {
                return y1;
            }
            slope = (y2 - y1) / (x2 - x1);
            return y1 + slope * (xi - x1);
        }
    }
    
    /* Shouldn't reach here, but return last value */
    return y[n-1];
}

/* Linear interpolation with extrapolation */
double interp1_extrap(const double *x, const double *y, int n, double xi) {
    /* For now, just use regular interp1 (clamps to endpoints) */
    return interp1(x, y, n, xi);
}

/* Special interpolation function for 14-element arrays (b_interp1) */
double b_interp1(const double *x, const double *y, double xi) {
    return interp1(x, y, 14, xi);
}
