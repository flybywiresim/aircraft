# FBW Extras Host

The ExtrasHost instrument is used to provide non-aircraft and non-wasm related functionality an 
environment to run as single instrument without rendering or connection to the MCDU, or the EFB, 
where some of these functionalities have been hosted in the past.

The ExtrasHost inherits from the BaseInstruments class that is managed by the simulator.

It uses the msfssdk library for using the EventBus and HEventPublisher and pot. other classes.

## System interfaces

Every module class has to implement the following functions:

- `constructor` to get access to the system-wide EventBus
- `connectedCallback` which is called after the simulator set up everything. These functions will also add the subscribtion to special events.
- `startPublish` which is called as soon as the simulator starts running. It will also start publishing the simulator variables onto the EventBus
- `update` is called in every update call of the simulator, but only after `startPublish` is called

## Examples

See the modules folder for examples on how to implement a module.


