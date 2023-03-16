# FBW Systems Host

The systems host is used to provide non-Rust systems of the A32NX an environment to run as single instrument without rendering or connection to the MCDU, etc. The system inherits from the BaseInstruments class that is managed by the simulator.

It manages the different power supplies, systems and handles the simulator states.

## Communication stack

The systems and the power supply communicate via the MSFS EventBus. The power supply class translates the simulator variables into EventBus events.

## System interfaces

Every system has to implement the following functions:

- `constructor` to get access to the system-wide EventBus
- `connectedCallback` which is called after the simulator set up everything. These functions will also add the subscribtion to special events.
- `startPublish` which is called as soon as the simulator starts running. It will also start publishing the simulator variables onto the EventBus
- `update` is called in every update call of the simulator, but only after `startPublish` is called

## Example

The `systems/atsu.ts` is a first example how to implement a system inside the host environment.
