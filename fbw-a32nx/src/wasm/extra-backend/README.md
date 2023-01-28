# FlybyWire Simulations - C++ WASM framework

A lightweight framework to abstract the most common aspects when developing
C++ WASM modules using the MSFS SDK and SimConnect.

See [GUIDELINES.md](fbw-a32nx/src/wasm/extra-backend/GUIDELINES.md) for more information on how to write good 
C++ code for FlyByWire Simulations.

## Purpose

The purpose of this framework is to provide a lightweight abstraction layer
to the MSFS SDK and SimConnect for FlyByWire. This allows developers to focus 
on the implementation of the actual module without having to worry about the
boilerplate code required to get the module up and running.

It also helps to avoid doubling of code, variables and multiple calls to retrieve
the same data from the simulator.

On of the main purposes of this framework is to avoid multiple WASM files which 
have to be compiled by MSFS at the start of the flight when files have been 
updated. Every file adds a significant overhead to the startup time of a flight
in MSFS. Having fewer files is more efficient and allows for faster startup 
times.     

## Goals

This framework will not cover all aspects of MSFS SDK or SimConnect, but it will
also not limit the developer to use the full SDK or SimConnect directly.
The goal is to make easy things easy and hard things possible.

It is not aimed at any specific use case or systems - it does not abstract the
aircraft or its systems. This will be done in the actual modules.

It helps new developers to get started with C++ WASM development in the FlyByWire
Code base without an overwhelming incomprehensible framework.

Continuously improve the framework to make it easier to use and more powerful
for additional use cases without making it overly complex.

## Overview and Features

The framework is split into two parts:

### Gauge, MsfsHandler and Modules
These components simplify setting up a C++ WASM module and provide a simple API
to implement a module with all necessary boilerplate code.

It allows to avoid having multiple WASM files which all add to the startup time
of the flight in MSFS. 

With this framework it is easy to have multiple gauges and WASM modules in one 
WASM file. See details below. 

This part does not take care of any data or logic from or to the simulator. If 
a developer chooses to only use this part of the framework, MSFS SDK and 
SimConnect have to be used directly.

### DataManager / Data Objects 
The DataManager is a central data store which allows to store and retrieve data
from the simulator. It provides different kind of data objects / variables which abstract the 
sim's data types and allows to easily retrieve and send data from the simulator.

Details see below.

## Components

### Gauge
A gauge is the central entry point for the simulator into the WASM module.
It basically provides a callback function the sim calls with different messages 
(service_ids) which will be handled accordingly. 

In this framework the gauge code can be found in the Gauge_Extra_Backend.cpp file:<br/>
<span style="color:cyan">src/extra-backend/src/Gauge_Extra_Backend.cpp</span>

Gauges need to be configured into the panel.cfg file:<br/>
<span style="color:cyan">flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/panel.cfg</span>

The Gauge_Extra_Backend.cpp also instantiates the MsfsHandler and the custom 
modules - this is the only place a new module has to be added.

```cpp 
... 
MsfsHandler msfsHandler("Gauge_Extra_Backend");
LightingPresets lightingPresets(&msfsHandler);
Pushback pushback(&msfsHandler);
AircraftPresets aircraftPresets(&msfsHandler);
...
```

It is not expected that a Module-developer will have to modify the gauge other 
than adding new Modules.

Also see:
- [MFSF SDK Documentation: C/C++ GAUGES](https://docs.flightsimulator.com/html/Content_Configuration/SimObjects/Aircraft_SimO/Instruments/C_C++_Gauges.htm?rhhlterm=_gauge_callback&rhsearch=_gauge_callback)

### MsfsHandler
<span style="color:cyan">src/extra-backend/src/MsfsHandler/MsfsHandler.h</span>

The MsfsHandler is the central component acts as a dispatcher for the custom 
module. It manages the SimConnect connection, all module updates, owns the 
DataManager and provides some imported core data variables to the modules.

Each module has to be registered with the MsfsHandler (done automatically in the
Module's constructor). The MsfsHandler will then call the update functions of the
module and provides access to the DataManager and the raw sim-data if required. 

It provides the following calls to the module at the appropriate time:
- initialize() - called once at the start of the flight session
- preUpdate() - called before the update() call
- update() - called every frame
- postUpdate() - called after the update() call
- shutdown() - called once at the end of the flight session

It is not expected that a Module-developer will have to modify the MsfsHandler.

### DataManager

The DataManager is a central data store which allows to store and retrieve data
from the simulator. It provides different kinds of variables which abstract the 
various sim SDK API elements and data types.

It currently provides the following data types:

- AircraftVariable: a variable which is directly mapped to a simvar
- NamedVariable: a variable which is mapped to a LVAR
- DataDefinitionVariable: Custom defined SimObjects base on custom C++ structs
- Event: a SimConnect event

Currently missing:
- ClientDataArea Variable: Custom defined SimObjects base on memory mapped data 
  between clients
  - not yet implemented
                           
The below described variables can be used without the DataManager, however the 
DataManager provides not only automatic updates and writing of the variables, 
but also convenience functions to create and register variables and events in 
the DataManager itself and also de-duplicating variables. 
                          
#### DataObjectBase

The base class for all data objects.

#### ManagedDataObjectBase
MSFS SDK and SimConnect provide different kinds of variable each with different
APIs on how to read and write them to the sim. 

The idea of variables in this framework is to provide a relatively consistent
interface to the data from the sim.

Each variable has various ways to be updated and written back to the sim:

- Manual read/write: The developer can manually read and write the variable from and to 
  the sim at any time
- Auto read: The variable can be configured to be automatically read from the sim (preUpdate) via the DataManager
- Auto write: The variable can be configured to be automatically written to the sim (postUpdate) via the DataManager
- Max Age in Ticks: The variable can be configured to be automatically read from the sim 
  if it is older than a certain number of ticks (preUpdate)
- Max Age in Seconds: The variable can be configured to be automatically read from the sim if 
  it is older than a certain number of seconds (preUpdate)

##### CacheableVariable
The CacheableVariable is the base class for AircraftVariable and NamedVariable
which can be cached to avoid multiple calls to the sim for the same variable.

It is still possible to explicitly read and write the variable from and to the 
sim if required. 

**Reading**
               
| method           | description                                                                                              |
|:-----------------|:---------------------------------------------------------------------------------------------------------|
| get()            | Returns cached value - never reads directly from sim                                                     |
| updateFromSim()  | Returns updated cached value - reads from sim if update criteria are met (maxAge)                        |
| readFromSim()    | Reads the value from the sim, updates cache, clears dirty flag - does not check update criteria (maxAge) |
| rawReadFromSim() | The raw MSFS SDK call to read from the sim. **Must be implemented by specialized classes**               | 

See the documentation of CacheableVariable for more details.

**Writing**
              
| method             | description                                                                                                          |
|--------------------|----------------------------------------------------------------------------------------------------------------------|
| set()              | Sets cached value - never writes directly to sim - sets dirty flag if set with a different value as the cached value |
| updateDataToSim()  | Updates a value to the sim if it is dirty.                                                                           |
| writeDataToSim()   | Writes the current cached value to the sim. Clears the dirty flag.                                                   |
| setAndWriteToSim() | Sets the current value and writes it to the sim. Clears the dirty flag.                                              |
| rawWriteToSim()    | The raw MSFS SDK call to write the sim. **Must be implemented by specialized classes**                               |
                
See the documentation of CacheableVariable for more details.

##### NamedVariable
The NamedVariable is a variable which is mapped to a LVAR. It is the simplest
variable type and can be used to store and retrieve custom numeric data from the 
sim.

It is based on the CacheableVariable - see above. 

OBS: A prefix is added to the variable name to distinguish different aircraft 
(e.g. A32NX_ or A380X_).

It is defined in the build script as a compile-time variable and **must not be added
manually to the variable name.**<br/>

```sh
...
AIRCRAFT="A32NX"
...
clang++ \
  -c \
  -D${AIRCRAFT} \
...  
```

##### AircraftVariable
The AircraftVariable is a variable which is mapped to a aircraft simvar. As simvars 
are read-only it is required to use an event to write the variable back to the sim.

It allows to specify either an event-name or an instance of an Event object to
write data back to the sim.

It is based on the CacheableVariable - see above.

No prefix is added to the variable name.

#### DataDefinitionVariable (Custom SimObjects)
The DataDefinitionVariable is a variable (in fact a set of variables) which 
is mapped to a custom SimObject which can be defined by adding separate data 
definition for single variables (objects) to a container of data definitions 
(custom SimObject).

As data definition sim objects use memory mapped data between clients they are 
very efficient but a bit harder to set up and use.

A data definition variable consisting of only writable simvars can be used to
write data back to the sim without the need to define an event.

Writing back a read only simvar will produce an error (visible in the console). 

See the DataDefinitionVariable class documentation for more details.

A DataDefinitionVariable requires unique IDs for the data definition and the
request. These IDs are used to identify the data definition and the data received 
from the sim. Make sure these IDs are unique with the gauge.

Use the DataManager to create these variables, and it will automatically assign
unique IDs.

Also see:
- Example and Pushback modules for examples of custom writable sim objects
- [MFSF SDK Documentation: SimConnect Data Definition](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_AddToClientDataDefinition.htm)

#### ClientDataAreaVariable (Custom SimObject)
<span style="color:yellow">Not yet implemented</span>
THe MSFS SDK also allows to define custom SimObjects using memory mapped data 
between clients to send and receive arbitrary data to and from the sim.

#### Events
The Event class is a  wrapper around the SimConnect event API. It allows 
to map client events to sim events via registering the clients event id with
the sim.

An event can be triggered (send to the sim) or registered with the sim to receive
events from the sim. Callbacks can be added to the Event object to handle the
events.

## Example Code
Good examples of how to use the framework can be found in the modules:

- LightingPresets
  - Uses NamedVariable and writeable AircraftVariables
  - Uses the one update tick set read a request as set the light levels accordingly.
- Pushback
  - Uses NamedVariable, writeable AircraftVariables and DataDefinitionVariable
  - The NamesVariables and AircraftVariables are used to control the pushback process. 
  - Events and DataDefinitionVariables are used to actually control the pushback
    movement
- AircraftPresets
  - Uses NamedVariable and writeable AircraftVariables to control the loading of 
    aircraft presets
  - Uses several update ticks to load the preset and set the various variables
    accordingly
  - Uses the MSFS SDK API call to execute calculator code directly for reading 
    and setting the state of aircraft systems. 

- ExampleModule
  - Is used to demonstrate various features of the framework and also to debug 
    and test it
  
## Building
Assuming you are able to build the aircraft as a whole this describes how to add
a new module (classes/headers) to the project.

When adding new module please place the in a new folder in the Modules folder:<br/>
<span style="color:cyan">src/extra-backend/src/Modules</span>

Add it to the following files:
- <span style="color:cyan">src/extra-backend/build.sh</span>
- <span style="color:cyan">src/extra-backend/CMakeLists.txt</span>
- <span style="color:cyan">src/extra-backend/src/Gauge_Extra_Backend.cpp</span>

To build it separately you can use the following commands:
                                            
```pwsh 
.\scripts\dev-env\run.cmd npm run build:extra-backend`
```
                                                                       
If you want debug information in the build use:<br/>
```pwsh
`.\scripts\dev-env\run.cmd npm run build:extra-backend-debug`
```
