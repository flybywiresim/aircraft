/*
 * File: rtwtypes.h
 * 
 * MATLAB Coder Runtime Type Definitions
 * Provides basic type definitions for MATLAB Coder generated code
 */

#ifndef RTWTYPES_H
#define RTWTYPES_H

/* Include standard library headers */
#include <stddef.h>
#include <stdbool.h>

/* Boolean type definition */
#ifndef typedef_boolean_T
#define typedef_boolean_T
typedef bool boolean_T;
#endif

/* Additional standard types */
typedef signed char int8_T;
typedef unsigned char uint8_T;
typedef short int16_T;
typedef unsigned short uint16_T;
typedef int int32_T;
typedef unsigned int uint32_T;
typedef float real32_T;
typedef double real64_T;
typedef double real_T;

/* Complex types */
typedef struct {
  real32_T re;
  real32_T im;
} creal32_T;

typedef struct {
  real64_T re;
  real64_T im;
} creal64_T;

typedef struct {
  real_T re;
  real_T im;
} creal_T;

/* Constants */
#ifndef FALSE
#define FALSE false
#endif

#ifndef TRUE
#define TRUE true
#endif

#endif /* RTWTYPES_H */

/*
 * [EOF]
 */
