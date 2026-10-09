/*
 * File: rt_nonfinite.h
 * 
 * Non-finite value definitions (MATLAB Coder stub)
 */

#ifndef RT_NONFINITE_H
#define RT_NONFINITE_H

#include <math.h>
#include <stddef.h>
#include "rtwtypes.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Definitions for NaN and Inf */
#ifndef INFINITY
#define INFINITY (1.0/0.0)
#endif

#ifndef NAN
#define NAN (0.0/0.0)
#endif

/* Check for non-finite values */
#define rtIsNaN(x) isnan(x)
#define rtIsInf(x) isinf(x)
#define rtIsFinite(x) isfinite(x)

/* Runtime NaN and Inf values */
extern const double rtNaN;
extern const double rtInf;
extern const double rtMinusInf;

/* Initialize nonfinite values (stub - not needed for our test) */
static inline void rt_InitInfAndNaN(void) {
    /* No-op for standard C99 */
}

#ifdef __cplusplus
}
#endif

#endif /* RT_NONFINITE_H */
