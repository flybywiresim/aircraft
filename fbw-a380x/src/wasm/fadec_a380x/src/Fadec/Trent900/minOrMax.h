/*
 * File: minOrMax.h
 * 
 * Min/Max utilities (MATLAB Coder stub)
 */

#ifndef MINORMAX_H
#define MINORMAX_H

#include "rtwtypes.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Maximum of two values */
static inline double fmax_custom(double a, double b) {
    return (a > b) ? a : b;
}

/* Minimum of two values */
static inline double fmin_custom(double a, double b) {
    return (a < b) ? a : b;
}

/* Find minimum value in array and return index */
static inline void minimum(const double *x, int *minIdx) {
    const int n = 7;  /* Fixed size for compressor map lookups */
    double minVal = x[0];
    *minIdx = 0;
    for (int i = 1; i < n; i++) {
        if (x[i] < minVal) {
            minVal = x[i];
            *minIdx = i;
        }
    }
}

#ifdef __cplusplus
}
#endif

#endif /* MINORMAX_H */
