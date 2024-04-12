# Engine & FADEC - A32NX/ A380X Build Options

By default, the FADEC code will be built for the A32NX aircraft. To build for the A380X, you will have to edit the build.sh file accordingly:

A380X Option:
Line 44:   "${DIR}/a380_fadec/src/FadecGauge.cpp"

To go back to the A32NX Option:
Line 44:   "${DIR}/a320_fadec/src/FadecGauge.cpp"
