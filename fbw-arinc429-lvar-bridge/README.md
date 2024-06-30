# FlyByWire Arinc429 LVar Bridge

The Arinc429 LVar Bridge in the FlyByWire project is a bridge designed to interface
between the Aircraft's data bus protocol (ARINC 429) and local simulation variables (LVars).

As some of these raw values of these LVars might be useful to 3rd parties (e.g. cockpit builder,
3rd party software, etc.) this bridge allows to expose a selected user configurable set of these
arinc429 encoded variables with their raw value as LVars.

## **NOTE**

This is still a proof of concept as there are only few arinc429 encoded variables yet.
Also, it is yet unclear how the naming convention of encoded vs. raw values should be handled. 


