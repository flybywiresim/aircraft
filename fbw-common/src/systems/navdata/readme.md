# MSFS Navdata Client

By FlyByWire & Synaptic Simulations
- - -
The Msfs Navdata Client is a package to provide a common navigation data API, abstracting away the details of various different database providers. Current providers are the in-sim navigation database (via Coherent calls), and Navigraph DFD data via an HTTP server external to the sim. Typescript typings are provided.

The API aims to mirror ARINC 424 with deviations for convenience as we are not constrained by the encoding scheme of that specification.

## Project Maturity/Status

The project is currently at an alpha state as we build it alongside a new flight planning and guidance system.

## Documentation

JSDoc comments are provided throughout the public API.


## Important Client Classes
- - - -
### `Database`

The database class is the interface between the FMS and the backend. When Intialising a Database you must pass in a Backend for the database to use.
`Please Note: All functions on the database class are asynchronous`

### `MsfsBackend`

This backend provides data from the in-sim facility data. No arguments are required by the constructor, and it operates entirely within the sim.

### `ExternalBackend`

This backend provides data from an external data server (see `src/server`) via HTTP. The base URL for this server is required by the constructor.

## External Server

An HTTP server with support for multiple backends is provided for the `ExternalBackend`.
