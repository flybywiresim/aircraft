# FlybyWire Simulations - C++ WASM framework

A lightweight framework to abstract the most common aspects when developing
C++ WASM modules using the MSFS SDK and SimConnect.

See [GUIDELINES.md](https://github.com/flybywiresim/a32nx/blob/cpp-msfs-framework/fbw-common/src/wasm/extra-backend/GUIDELINES.md)
for more information on how to write good C++ code for FlyByWire Simulations.

## Purpose

The purpose of this framework is to provide a lightweight abstraction layer
to the MSFS SDK and SimConnect for FlyByWire which encapsulates the most common
aspects of the SDK and SimConnect in C++ objects. This allows developers to focus
on the implementation of the actual module without having to worry about the
boilerplate code required to get the module up and running.

It also helps to avoid doubling of code, variables and multiple calls to retrieve
the same data from the simulator.

On of the main purposes of this framework is to avoid multiple WASM files which
have to be compiled by MSFS at the start of the flight when files have been
updated. Every file adds a significant overhead to the startup time of a flight
in MSFS. Having fewer wasm files is more efficient and allows for faster startup
times.

## Goals

This framework will not cover all aspects of MSFS SDK or SimConnect, but it will
also not limit the developer to use the full SDK or SimConnect directly.
The goal is to make easy things easy and hard things possible.

It is not aimed at any specific use case or systems - it does not abstract the
aircraft or its systems. This will be done in the actual modules.

It helps new developers to get started with C++ WASM development in the FlyByWire
Code base without an overwhelming incomprehensible framework.

The framework should be continuously improved to make it easier to use and more
powerful for additional use cases without making it overly complex.

## Overview and Features

The framework is split into two parts:

### Gauge and Modules

These components simplify setting up a C++ WASM module and provide a simple API
to implement a module with all necessary boilerplate code.

It allows to avoid having multiple WASM files which all add to the startup time
of the flight in MSFS.

With this framework it is easy to have multiple gauges and WASM modules in one
WASM file. See details below.

This part does not take care of any data or logic from or to the simulator. If
a developer chooses to only use this part of the framework, MSFS SDK and
SimConnect have to be used directly.

These components live in the aircraft src folders.

Details see below.

### MsfsHandler and DataManager / Data Objects

MsfsHandler and DataManager are the central components which provide a simple
API to retrieve and send data from and to the simulator.

The MsfsHandler is the central component acting as a dispatcher for the custom
modules. It manages the SimConnect connection, all module updates, owns the
DataManager and provides some imported core data variables to the modules.

The DataManager is a central data store which allows to store and retrieve data
from the simulator. It provides different kind of data objects / variables which abstract the
sim's data types and allows to easily retrieve and send data from the simulator.
One of its main features is de-duplication of variables over all modules and
to automatically update (read/write) the data to and from the simulator.

These components live in the common src folder.

Details see below.

## Components

### Gauge

A gauge is the central entry point for the simulator into the WASM module.
It basically provides a callback function the sim calls with different messages
(service_ids) which will be handled accordingly.

In this framework the gauge code can be found in the Gauge_Extra_Backend.cpp file:<br/>
<span style="color:cyan">/fbw-a32nx/src/wasm/extra-backend-a32nx/src/Gauge_Extra_Backend.cpp</span><br/>
or
<span style="color:cyan">/fbw-a380x/src/wasm/extra-backend-a380x/src/Gauge_Extra_Backend.cpp</span>

Gauges need to be configured into the panel.cfg file:<br/>
<span style="color:cyan">flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/panel.cfg</span>
or the corresponding panel.cfg file of the A380X.

The Gauge_Extra_Backend.cpp also instantiates the MsfsHandler and the custom
modules - this is the only place a new module has to be added.

```cpp 
... 
MsfsHandler msfsHandler("Gauge_Extra_Backend_A32NX", "A32NX_");

// ADD ADDITIONAL MODULES HERE
// This is the only place these have to be added - everything else is handled automatically
LightingPresets_A32NX lightingPresets(msfsHandler);
Pushback pushback(msfsHandler);
AircraftPresets aircraftPresets(msfsHandler, AircraftPresetProcedures_A32NX::aircraftProcedureDefinition);
...
```

It is not expected that a Module-developer will have to modify the gauge other
than adding new Modules.

Also see:

- [MSFS SDK Documentation: C/C++ GAUGES](https://docs.flightsimulator.com/html/Content_Configuration/SimObjects/Aircraft_SimO/Instruments/C_C++_Gauges.htm?rhhlterm=_gauge_callback&rhsearch=_gauge_callback)

### MsfsHandler

<span style="color:cyan">fbw-common/src/wasm/cpp-msfs-framework/MsfsHandler/MsfsHandler.h</span>

The MsfsHandler is the central component acts as a dispatcher for the custom
modules. It manages the SimConnect connection, all module updates, owns the
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
various sim SDK API elements and data types into C++ objects.

It currently provides the following data types:

- **AircraftVariable:** a variable which is directly mapped to a simvar.
- **NamedVariable**: a variable which is mapped to a LVAR.
- **DataDefinitionVariable**: Custom defined SimObjects base on simvars and custom
  C++ structs (with SU12 also LVARs can be part of the data definition).
- **ClientDataAreaVariable**: Custom defined SimObjects base on memory mapped data to
  exchange arbitrary data between SimConnect clients.
- **StreamingClientDataAreaVariable**: Custom defined SimObjects base on memory mapped
  which can be larger than the limit of 8k bytes per ClientDataArea by using a
  streaming buffer approach to send and retrieve data.
- **ClientEvent**: These events are used to either create a custom event or to be mapped
  to a sim event or sim system event. The main feature of a ClientEvent is that it
  has a unique ID which can be used to map and recognize the event. Callbacks can
  then be registered to be called when the event is triggered.

Also, it allows to register callback functions for KeyEvents.

The below described data types can be created via the DataManager's make_... functions.

#### DataObjectBase (abstract base class)

The base class for all data objects providing the variable's name.

#### ManagedDataObjectBase (abstract base class)

MSFS SDK and SimConnect provide different kinds of variables each with different
APIs on how to read and write them to the sim.

The idea of variables in this framework is to provide a relatively consistent
interface to the data from the sim.

Each variable has various ways to be updated and written back to the sim:

- Manual read/write: The developer can manually read and write the variable from and to the sim at any time
- Auto read: The variable can be configured to be automatically read from the sim (preUpdate) via the DataManager
- Auto write: The variable can be configured to be automatically written to the sim (postUpdate) via the DataManager
- Max Age in Ticks: The variable can be configured to be automatically read from the sim
  if it is older than a certain number of ticks (preUpdate)
- Max Age in Seconds: The variable can be configured to be automatically read from the sim if
  it is older than a certain number of seconds (preUpdate)

This base class also provides the means to register and remove callbacks for updates
to the variable. Any time the variable is read and has changed the callbacks will be fired.

See the documentation of ManagedDataObjectBase for more details.

##### CacheableVariable (abstract base class)

The CacheableVariable is the base class for AircraftVariable and NamedVariable
which can be cached to avoid multiple calls to the sim for the same variable.

It is still possible to explicitly read and write the variable from and to the
sim if required.

**Reading**

| method           | description                                                                                              |
|:-----------------|:---------------------------------------------------------------------------------------------------------|
| get()            | Returns cached value - never reads directly from sim                                                     |
| updateFromSim()  | Returns updated cached value - reads once per tick from sim if update criteria are met (maxAge)          |
| readFromSim()    | Reads the value from the sim, updates cache, clears dirty flag - does not check update criteria (maxAge) |
| rawReadFromSim() | The raw MSFS SDK call to read the different variable types from the sim.                                 | 

See the documentation of CacheableVariable for more details.

**Writing**

| method             | description                                                                                                          |
|--------------------|----------------------------------------------------------------------------------------------------------------------|
| set()              | Sets cached value - never writes directly to sim - sets dirty flag if set with a different value as the cached value |
| updateToSim()      | Updates a value to the sim if it is dirty.                                                                           |
| writeToSim()       | Writes the current cached value to the sim. Clears the dirty flag.                                                   |
| setAndWriteToSim() | Sets the current value and writes it to the sim. Clears the dirty flag.                                              |
| rawWriteToSim()    | The raw MSFS SDK call to write the sim.                                                                              |

See the documentation of CacheableVariable for more details.

##### NamedVariable

The NamedVariable is a variable which is mapped to a LVAR (Local Variable). It is the simplest
variable type and can be used to store and retrieve custom numeric data from the
sim.

It is based on the CacheableVariable - see above.

OBS: A prefix is added to the variable name to distinguish different aircraft
(e.g. A32NX_ or A380X_).

The prefix is set via the static variable `AIRCRAFT_PREFIX` in the NamedVariable class.
It is set by the MsfsHandler class' constructor.

_Author note: this is done because of a team decision for this convention. The author does not think
such a preset should be part of the framework API._

##### AircraftVariable

The AircraftVariable is a variable which is mapped to an aircraft simvar. As simvars
are read-only it is required to use an event to write the variable back to the sim.

It allows to specify either an event-name or an instance of an ClientEvent object to
write data back to the sim.

It is based on the CacheableVariable - see above.

No prefix is added to the variable name.

#### SimObjectBase (abstract base class)

The SimObjectBase is the base class for all custom SimObjects.

One major difference of SimObjects to Named or Aircraft Variables is that SimObjects
are read asynchronously from the sim. This means that the data is not available at the
time of the call to the read function. Instead, the data is received via SimConnect Callback
in the next tick. Although this is all handled automatically by the DataManager it is
important to understand this difference.

**Reading**

| method                 | description                                                                              |
|:-----------------------|:-----------------------------------------------------------------------------------------|
| requestDataFromSim()   | Sends a data request to the sim                                                          |
| requestUpdateFromSim() | Sends a data request to the sim if update criteria are met (maxAge)                      |
| processSimData()       | The callback the DataManager used when the requested data has been received from the sim | 

See the documentation of CacheableVariable for more details.

**Writing**

| method           | description                                       |
|------------------|---------------------------------------------------|
| writeDataToSim() | Write the current data struct contents to the sim |

##### DataDefinitionVariable (Custom SimObjects)

The DataDefinitionVariable is a variable (in fact a data structure) which is mapped
to a custom data struct and a SimObject which can be defined by adding separate
data definitions for single sim variables to a container of data definitions.

It requires a local data structure as a template type which is then used to hold the data.

The class is based on ManagedDataObjectBase and therefore supports auto reading and writing of
the data to the sim. It also supports using the SIMCONNECT_PERIOD flags to update the
data by using this method to request the data: requestPeriodicUpdateFromSim().<p/>

As data definition sim objects use memory mapped data between clients they are
very efficient but a bit harder to set up and use.

A data definition variable consisting of only writable simvars can be used to
write data back to the sim without the need to define an event.

Writing back a read only simvar will produce a SimConnect exception (visible in the console)
in the next update tick.

See the DataDefinitionVariable class documentation for more details.

A DataDefinitionVariable requires unique IDs for the data definition and the
request. These IDs are used to identify the data definition and the data received
from the sim. The DataManager will create these variables, and it will automatically
assign unique IDs.

Also see:

- Example and Pushback modules have examples of custom writable sim objects
- [MSFS SDK Documentation: SimConnect Data Definition](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_AddToClientDataDefinition.htm)

#### ClientDataAreaVariable (Custom Data Area)

SimConnect also allows to define custom SimObjects using memory mapped data
between clients to send and receive arbitrary data to and from the sim.

It requires a local data struct as a template type which is used to hold the data.

The client owning the data area is responsible for creating and managing the
data area whereas the other clients can only read and write to the data area.

As client data areas use memory mapped data between clients they are
very efficient but a bit harder to set up and use.

See the ClientDataAreaVariable class documentation for more details.

A ClientDataAreaVariable requires unique IDs for the data area, the data definition
and the request. These IDs are used to identify the data definition and the data
received from the sim. The DataManager will create these variables, and it will automatically
assign unique IDs.

Also see:

- [MSFS SDK Documentation: SimConnect_MapClientDataNameToID](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapClientDataNameToID.htm)

#### StreamingClientDataAreaVariable

The StreamingClientDataAreaVariable class is a special variant of the ClientDataAreaVariable
class which allows to send and receive data larger than the maximum size of a single
SimConnect client data area chunk of 8192 bytes.

The data is split into chunks of a fixed size (default 8192 bytes) and sent and
received in chunks.

The data is stored in a vector of the given type T, which is resized to the number of
bytes expected to be received.

Before receiving data the reserve() method must be called to reset the data and set
the number of bytes to be received.

See the StreamingClientDataAreaVariable class documentation for more details.

#### ClientEvent

The ClientEvent class represents a client event which can be used to:<br/>

- create a custom event (between simconnect clients)
- be mapped to a sim event
- be mapped to a system event

A ClientEvent has a unique id and a name. The name can be used to map the event to a sim event or
to create a custom event.

Custom events must have a name that contains a period (e.g. "Custom.Event") to the sim recognizes
it as a custom event.

To map to sim events the name must be identical to the name of the sim event otherwise there will be
a SimConnect exception that the event is unknown.

If the ClientEvent is intended to be used as a system event then it must be constructed with the
registerToSim parameter set to false. This will prevent the event from being registered to the sim.

See the DataManager::make_xxx_event() functions for more details.

#### Input Event

Input events can be added and mapped to an Event instance to be triggered by the
defined input events.

See [MSFS SDK Documentation: SimConnect_MapInputEventToClientEvent](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapInputEventToClientEvent.htm)
for how to define input events.

These input events can be clustered in groups to be able to enable and disable a set of multiple
input events at once. Use Event::setInputGroupState() to enable or disable a group of input events.

OBS: There are still some inconsistencies in the MSFS SDK regarding input events, esp. when removing
and re-adding input events. It is recommended to only add input events once and not remove them.

For details see the ClientEvent class documentation.

#### Key Event

A Key Event is not a data type which can be created. Use the DataManager to register a callback
to handle key events (addKeyEventCallback). The callback will be called with the key event data.

For details see the DataManager class documentation.

#### Mouse Events

Not yet supported.

## Example Code

Good examples of how to use the framework can be found in the modules:

- ExampleModule
    - Is used to demonstrate various features of the framework and also to debug
      and test it. It is not meant to be used as a real module but rather as a
      playground to test and learn how to use the framework.

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

## Building

Assuming you are able to build the aircraft as a whole this describes how to add
a new module (classes/headers) to the project.

The framework code is split into three parts:

- the common c++ framework code which lives in  <span style="color:cyan">/fbw-common/src/wasm/cpp-msfs-framework</span>
- the instance of a common backend using the c++ framework is in <span style="color:cyan">/fbw-common/src/wasm/extra-backend</span>
- the aircraft specific gauge and modules which live in <span style="color:cyan">/fbw-a32nx/src/wasm/extra-backend-a32nx</span>
  and <span style="color:cyan">/fbw-a380x/src/wasm/extra-backend-a380x</span>

When adding new modules please place them in a new folder in the aircraft's extra-backend folder:<br/>
E.g. <span style="color:cyan">/fbw-a32nx/src/wasm/extra-backend-a32nx</span>

Add it to the following files:

- <span style="color:cyan">/fbw-a32nx/src/wasm/extra-backend-a32nx/CMakeLists.txt</span>
- <span style="color:cyan">/fbw-a32nx/src/wasm/extra-backend-a32nx/src/Gauge_Extra_Backend.cpp</span>
  (or the A380X equivalents)

To build it separately you can use the following commands:

```pwsh 
.\scripts\dev-env\run.cmd npm run build:cpp-wasm-cmake
```

or

```pwsh 
.\scripts\dev-env\run.cmd npm run build:cpp-wasm-cmake-clean
```

If you want debug information in the build use:<br/>

```pwsh
.\scripts\dev-env\run.cmd npm run build:cpp-wasm-cmake-debug
```

or

```pwsh
.\scripts\dev-env\run.cmd npm run build:cpp-wasm-cmake-debug-clean
```
