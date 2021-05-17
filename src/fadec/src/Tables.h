#pragma once

#include "SimVars.h"
#include "common.h"

Ratios* ratios;

// Interpolation Function
double interpolate(double x, double x0, double x1, double y0, double y1) {
	double y = 0;

	y = ((y0 * (x1 - x)) + (y1 * (x - x0))) / (x1 - x0);

	return y;
}

// Table 1502 - CN2 vs CN1
double table1502(int i, int j) {
	double t[13][2] = { {18.2,0}, {22,1.9}, {26,2.5}, {57,12.8}, {68.2,19.6}, {77,26}, {83,31.42024}, {89,40.972041}, {92.8,51}, {97,65}, {100,77}, {104,85}, {116.5,101} };

	return t[i][j];
}

// Calculate expected N2 at Idle
double IdleCN2(double pressAltitude, double ambientTemp) {
	double idle_cn2 = 0;

	idle_cn2 = 68.2 / sqrt((288.15 - (1.98 * pressAltitude / 1000)) / 288.15);

	return idle_cn2;
}

// Calculate expected N1 at Idle
double IdleCN1(double pressAltitude, double ambientTemp) {
	int i;
	double idle_cn1 = 0;
	double idle_cn2 = 68.2 / sqrt((288.15 - (1.98 * pressAltitude / 1000)) / 288.15);
	double cell = 0;
	double cn2lo = 0, cn2hi = 0, cn1lo = 0, cn1hi = 0;

	for (i = 0; i < 13; i++) {
		cell = table1502(i, 0);
		if (cell > idle_cn2) {
			break;
		}
	}
	cn2lo = table1502(i - 1, 0);
	cn2hi = table1502(i, 0);
	cn1lo = table1502(i - 1, 1);
	cn1hi = table1502(i, 1);

	idle_cn1 = interpolate(idle_cn2, cn2lo, cn2hi, cn1lo, cn1hi);

	return idle_cn1;
}
