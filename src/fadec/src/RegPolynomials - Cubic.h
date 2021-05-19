#pragma once

/// A collection of multi-variate regression polynomials for engine parameters
class Polynomial {
public:
	double n2NX(double n2, double idleN2) {
		double n2_out = 0;
		//double m = 0;
		//Sdouble b = 0;
		double noise = 0;
		double y0 = 1.049882, y1 = 1.073, y2 = 1.05266153, y3 = 1.000000;
		double x0 = 60, x1 = 62.9, x2 = 64.7881559, x3 = idleN2;
		double a = 0, b = 0, c = 0, d = 0;


		if (n2 <= 10  ) {
			n2_out = (0.001164088 * pow(n2, 4)) - (0.032581156 * pow(n2, 3)) + (0.329780857 * pow(n2, 2)) - (1.51026875 * n2) + 5.0000000;
		}
		else if (n2 <= 35) {
			n2_out = (-0.000146255 * pow(n2, 3)) + (0.011892965 * pow(n2, 2)) - (0.320662087 * n2) + 4.100000000;
		}
		else if (n2 <= 49) {
			n2_out = (0.000014202 * pow(n2, 3)) - (0.001434902 * pow(n2, 2)) + (0.037872646 * n2) +1.0000000;
		}
		else if (n2 <= 60) {
			n2_out = (0.000015864 * pow(n2, 4)) - (0.003354284 * pow(n2, 3)) + (0.264180902 * pow(n2, 2)) - (9.184557684 * n2) + 120.000000000;
		}
		else {
			a = (y0 * (n2 - x1) * (n2 - x2) * (n2 - x3)) / ((x0 - x1) * (x0 - x2) * (x0 - x3));
			b = (y1 * (n2 - x0) * (n2 - x2) * (n2 - x3)) / ((x1 - x0) * (x1 - x2) * (x1 - x3));
			c = (y2 * (n2 - x0) * (n2 - x1) * (n2 - x3)) / ((x2 - x0) * (x2 - x1) * (x2 - x3));
			d = (y3 * (n2 - x0) * (n2 - x1) * (n2 - x2)) / ((x3 - x0) * (x3 - x1) * (x3 - x2));

			n2_out = a + b + c + d;

		}

		n2_out = n2_out * n2;

		return n2_out;
		/*if (n2_out > idleN2 + 0.15) {
			return idleN2;
		}
		else {
			return n2_out;
		}*/
	}

	double cegtNX(double cn1, double cff, double mach, double alt) {
		double cegt_out = 0;

		double cegt_coef[16] = {
			443.3145034,    0.0000000e+00,  3.0141710e+00,  3.9132758e-02,
			-4.8488279e+02, -1.2890964e-03, -2.2332050e-02, 8.3849683e-05,
			6.0478647e+00,  6.9171710e-05,  -6.5369271e-07, -8.1438322e-03,
			-5.1229403e-07, 7.4657497e+01,  -4.6016728e-03, 2.8637860e-08 };

		cegt_out = cegt_coef[0] + cegt_coef[1] + (cegt_coef[2] * cn1) +
			(cegt_coef[3] * cff) + (cegt_coef[4] * mach) +
			(cegt_coef[5] * alt) + (cegt_coef[6] * pow(cn1, 2)) +
			(cegt_coef[7] * cn1 * cff) + (cegt_coef[8] * cn1 * mach) +
			(cegt_coef[9] * cn1 * alt) + (cegt_coef[10] * pow(cff, 2)) +
			(cegt_coef[11] * mach * cff) + (cegt_coef[12] * cff * alt) +
			(cegt_coef[13] * pow(mach, 2)) +
			(cegt_coef[14] * mach * alt) + (cegt_coef[15] * pow(alt, 2));

		return cegt_out;
	}

	double cflowNX(double cn1, double mach, double alt) {
		double cflow_out = 0;

		double cflow_coef[21] = {
			-639.6602981, 0.00000e+00, 1.03705e+02,  -2.23264e+03, 5.70316e-03,
			-2.29404e+00, 1.08230e+02, 2.77667e-04,  -6.17180e+02, -7.20713e-02,
			2.19013e-07,  2.49418e-02, -7.31662e-01, -1.00003e-05, -3.79466e+01,
			1.34552e-03,  5.72612e-09, -2.71950e+02, 8.58469e-02,  -2.72912e-06,
			2.02928e-11 };

		// CRZ fuel cflow
		cflow_out =
			cflow_coef[0] + cflow_coef[1] + (cflow_coef[2] * cn1) +
			(cflow_coef[3] * mach) + (cflow_coef[4] * alt) +
			(cflow_coef[5] * pow(cn1, 2)) + (cflow_coef[6] * cn1 * mach) +
			(cflow_coef[7] * cn1 * alt) + (cflow_coef[8] * pow(mach, 2)) +
			(cflow_coef[9] * mach * alt) + (cflow_coef[10] * pow(alt, 2)) +
			(cflow_coef[11] * pow(cn1, 3)) + (cflow_coef[12] * pow(cn1, 2) * mach) +
			(cflow_coef[13] * pow(cn1, 2) * alt) +
			(cflow_coef[14] * cn1 * pow(mach, 2)) +
			(cflow_coef[15] * cn1 * mach * alt) +
			(cflow_coef[16] * cn1 * pow(alt, 2)) + (cflow_coef[17] * pow(mach, 3)) +
			(cflow_coef[18] * pow(mach, 2) * alt) +
			(cflow_coef[19] * mach * pow(alt, 2)) + (cflow_coef[20] * pow(alt, 3));

		return cflow_out;
	}
};
