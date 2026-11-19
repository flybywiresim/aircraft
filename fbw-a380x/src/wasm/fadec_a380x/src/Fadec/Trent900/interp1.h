/*
 * File: interp1.h
 * 
 * Linear interpolation routines (MATLAB Coder stub)
 */

#ifndef INTERP1_H
#define INTERP1_H

#include "rtwtypes.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Linear interpolation - 1D */
double interp1(const double *x, const double *y, int n, double xi);

/* Linear interpolation with extrapolation */
double interp1_extrap(const double *x, const double *y, int n, double xi);

/* Special interpolation for 14-element arrays */
double b_interp1(const double *x, const double *y, double xi);

#ifdef __cplusplus
}
#endif

#endif /* INTERP1_H */
