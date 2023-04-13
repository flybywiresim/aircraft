# General Documentation
              
## Repo Structure

```
a32nx (repo)                                     <flybywire monorepo - will be renamed eventually>
├── docs                                         <documentation for the repo - e.g. this structure>
├── fbw-a32nx                                    <A32NX project files>
│   ├── docs                                     <documentation for the A32NX project>
│   ├── out										 <folder the final aircraft package will be build into>
│   └── src                                      <A32NX project source code>
│       ├── base                                 <msfs package base files>
│       │   └── flybywire-aircraft-a320-neo
│       ├── behavior                             <behavior source files>
│       ├── fonts                                <font files>
│       ├── model                                <model source files>
│       ├── systems                              <non-wasm system source files>
│       │   ├── atsu
│       │   ├── failures
│       │   ├── fmgc
│       │   ├── instruments
│       │   ├── sentry-client
│       │   ├── shared
│       │   ├── simbridge-client
│       │   └── tcas
│       ├── textures                             <texture files>
│       └── wasm                                 <wasm system source files>
│           ├── fadec_a320
│           ├── fbw_a320
│           ├── flypad-backend
│           └── systems
│               ├── a320_systems
│               └── a320_systems_wasm
├── fbw-a380x
│   ├── docs                                     <documentation for the A380X project>
│   ├── out                                      <folder the final aircraft package will be build into>
│   └── src                                      <A380X project source code>
│       ├── base                                 <msfs package base files>
│       ├── systems                              <non-wasm system source files>
│       └── wasm                                 <wasm system source files>
│           ├── fadec_a380
│           ├── fbw_a380
│           └── systems
│               ├── a380_systems
│               └── a380_systems_wasm
├── fbw-common                                   <common code and libs>
│   └── src
│       ├── jest
│       ├── typings                              <msfs specific typings>
│       └── wasm
│           ├── fadec_common
│           ├── fbw_common
│           └── systems
│               ├── systems
│               └── systems_wasm
├── scripts                                      <all build scripts>
└── tools                                        <tools files>
    ├── fdr2csv
    └── heapdump
└── ...                                          <repo config files>
```