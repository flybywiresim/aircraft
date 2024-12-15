# General Documentation

## Repo Structure

```
├───.github                                                         <GitHub configuration and workflow files>
│   ├───ISSUE_TEMPLATE                                              <templates for issues and pull requests>
│   └───workflows                                                   <GitHub Actions workflow definitions>
|   └───CHANGELOG.md                                                <changelog for the repository to be updated by PRs>
├───docs                                                            <general documentation for the repository>
├───fbw-a32nx                                                       <A32NX aircraft project files>
│   ├───docs                                                        <A32NX project-specific documentation>
│   ├───out                                                         <directory for the final build of the A32NX aircraft package>
│   └───src                                                         <A32NX source code>
│       ├───base                                                    <base files for MSFS package configuration>
│       ├───behavior                                                <behavior logic and configuration files>
│       ├───fonts                                                   <font assets used in the A32NX>
│       ├───localization                                            <localization and translation files>
│       ├───model                                                   <3D model files and assets>
│       ├───systems                                                 <non-WASM system implementation files>
│       │   ├───atsu                                                <ATSU system files>
│       │   ├───extras-host                                         <additional host for non aircraft-systems>
│       │   ├───failures                                            <aircraft failure simulation logic>
│       │   ├───fmgc                                                <Flight Management and Guidance Computer (FMGC) implementation>
│       │   ├───instruments                                         <instrumentation source files>
│       │   │   └───src                                             <instrument source code files>
│       │   │       ├───ATC                                         <Air Traffic Control display and logic>
│       │   │       ├───BAT                                         <battery instrument files>
│       │   │       ├───Clock                                       <clock instrument files>
│       │   │       ├───Common                                      <common instrument files shared across systems>
│       │   │       ├───DCDU                                        <DCDU display logic>
│       │   │       ├───EFB                                         <A32NX specific Electronic Flight Bag implementation>
│       │   │       ├───EWD                                         <Engine Warning Display files>
│       │   │       ├───ISIS                                        <Integrated Standby Instrument System>
│       │   │       ├───MsfsAvionicsCommon                          <common MSFS Avionics Framework files>
│       │   │       ├───ND                                          <Navigation Display logic>
│       │   │       ├───OANC                                        <Onboard Announcements Control system>
│       │   │       ├───PFD                                         <Primary Flight Display logic>
│       │   │       ├───RMP                                         <Radio Management Panel>
│       │   │       ├───RTPI                                        <Real-time Position Indicator>
│       │   │       └───SD                                          <System Display files>
│       │   ├───sentry-client                                       <Sentry client integration for monitoring>
│       │   ├───shared                                              <shared system files>
│       │   ├───simbridge-client                                    <SimBridge client integration for external communication>
│       │   ├───systems-host                                        <systems host for aircraft systems>
│       │   └───tcas                                                <Traffic Collision Avoidance System implementation>
│       ├───textures                                                <texture assets for the A32NX>
│       └───wasm                                                    <WASM-based system source files>
│           ├───extra-backend-a32nx                                 <extra backend logic for A32NX in C++>
│           ├───fadec_a32nx                                         <Full Authority Digital Engine Control (FADEC) for A32NX in C++>
│           ├───fbw_a320                                            <fly-by-wire systems for the A32NX in C++>
│           └───systems                                             <aircraft systems in Rust>
├───fbw-a380x                                                       <A380X aircraft project files>
│   ├───docs                                                        <A380X project-specific documentation>
│   ├───out                                                         <directory for the final build of the A380X aircraft package>
│   └───src                                                         <A380X source code>
│       ├───base                                                    <base files for MSFS package configuration>
│       ├───fonts                                                   <font assets used in the A380X>
│       ├───localization                                            <localization and translation files>
│       ├───systems                                                 <non-WASM system implementation files>
│       │   ├───extras-host                                         <additional host for non aircraft-systems>
│       │   ├───failures                                            <aircraft failure simulation logic>
│       │   ├───instruments                                         <instrumentation source files>
│       │   │   └───src                                             <instrument source code files>
│       │   │       ├───ATCCOM                                      <ATC communication display logic>
│       │   │       ├───BAT                                         <battery instrument files>
│       │   │       ├───Clock                                       <clock instrument files>
│       │   │       ├───Common                                      <common instrument files shared across instruments>
│       │   │       ├───EFB                                         <Electronic Flight Bag implementation>
│       │   │       ├───EWD                                         <Engine Warning Display files>
│       │   │       ├───FCU                                         <Flight Control Unit>
│       │   │       ├───ISISlegacy                                  <legacy Integrated Standby Instrument System>
│       │   │       ├───MFD                                         <Multi-Function Display logic>
│       │   │       ├───MsfsAvionicsCommon                          <common MSFS Avionics Framework files>
│       │   │       ├───ND                                          <Navigation Display logic>
│       │   │       ├───OIT                                         <Onboard Information Terminal>
│       │   │       ├───PFD                                         <Primary Flight Display logic>
│       │   │       ├───RMP                                         <Radio Management Panel>
│       │   │       ├───RTPI                                        <Real-time Position Indicator>
│       │   │       └───SD                                          <System Display files>
│       │   ├───sentry-client                                       <Sentry client integration for monitoring>
│       │   ├───shared                                              <shared system files>
│       │   └───systems-host                                        <systems host for aircraft systems>
│       └───wasm                                                    <WASM-based system source files for A380X>
│           ├───extra-backend-a380x                                 <extra backend logic for A380X in C++>
│           ├───fadec_a380x                                         <Full Authority Digital Engine Control (FADEC) for A380X in C++>
│           ├───fbw_a380                                            <fly-by-wire systems for the A380X in C++>
│           └───systems                                             <aircraft systems in Rust>
├───fbw-common                                                      <shared libraries and common utilities across projects>
│   ├───docs                                                        <documentation for shared components>
│   ├───msfs-avionics-mirror                                        <mirror of MSFS avionics common files>
│   └───src                                                         <source code for common components>
│       ├───jest                                                    <Jest configuration and test files>
│       ├───systems                                                 <common systems implementations>
│       │   ├───datalink                                            <datalink communication systems>
│       │   ├───instruments                                         <common instrumentation components>
│       │       └───src                                             <source files for common instruments>
│       │       ├───BAT                                             <battery instrument files>
│       │       ├───Clock                                           <clock instrument files>
│       │       ├───EFB                                             <Electronic Flight Bag shared components>
│       ├───navdata                                                 <Msfs Navdata Client for navigation data>
│       └───shared                                                  <shared utilities and helper functions>
│       ├───typings                                                 <TypeScript typings specific to MSFS projects>
│       └───wasm                                                    <WASM-based common components>
│           ├───cpp-msfs-framework                                  <C++ framework for MSFS integration>
│           ├───extra-backend                                       <additional backend logic (Pushback, Presets) in C++>
│           ├───fadec_common                                        <common Full Authority Digital Engine Control (FADEC) logic in C++>
│           ├───fbw_common                                          <common fly-by-wire code in C++>
│           ├───systems                                             <common systems code in Rust>
│           ├───terronnd                                            <terrain radar system in C++>
│           └───utils                                               <shared utility functions for WASM components>
├───fbw-ingamepanels-checklist-fix                                  <FlyByWire in-game panel checklist fix project>
│   ├───out                                                         <output folder for the in-game checklist package>
│   └───src                                                         <source code for the checklist fix>
│       └───base                                                    <base files for the in-game checklist package>
│           └───flybywire-ingamepanels-checklist-fix                <configuration for MSFS integration>
├───large-files                                                     <large file storage for assets and models>
│   ├───fbw-a380x                                                   <large files specific to A380X>
│   └───scripts                                                     <build and processing scripts for large files>
├───scripts                                                         <build and processing scripts for the repository>
│   ├───cmake                                                       <CMake configuration files>
│   └───dev-env                                                     <development environment setup scripts>
└───tools                                                           <tools and utilities for development>
    ├───fdr2csv                                                     <tool for converting flight data recorder files to CSV>
    └───heapdump                                                    <tool for capturing and analyzing heap dumps>
```

## Branches

Pull request branches should reside on the developer's fork of the main repository. It is not necessary to push them to the main `flybywiresim/aircraft` repository as GitHub offers the ability for all
maintainers to push to pull request branches even when they reside in another user's fork.

Branches to be retained on the main repository are:

- `master` - The source of truth and main development branch,
- release branches (e.g. `v0.12`),
- in special cases some long-running branches requiring collaboration (make a proposal in the #development channel on Discord).
