# Payload Module

Module to handle loading of passengers and cargo payload.
 - Based on Loadsheet Pax and Cargo Stations
 - Serialisation of passenger seating configuration into bits (u64) via bitwise manipulation
 - Syncs between boarding related L:Vars and A:Vars for Payload Station Weights.
    - i.e. PAX_FLAGS_A (kg) syncs with A:PAYLOAD STATION WEIGHTS:1 (lbs)
 - Acts in a read-only mode when GSX 3rd party integration is enabled.

## Dependencies
 - Requires:
   - Payload A:Vars (LBS)
   - Boarding L:Vars (PAX #/KG)
   - payload.rs aspect

## Pax Seating Serialisation
 - Represented as a series of bits within one u64 as a binary number, i.e. 0 -> 0, 111 -> 7 , 00100011 -> 35
 - Format is column (front->back) row (left->right)
    | number | binary       | represents         |
    |--------|--------------|--------------------|
    | 31     | 11111        | OXX XXX            |
    | 1983   | 011110111111 | XXX XXX<br>OXX XXO |
