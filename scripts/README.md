# Build Scripts

This directory contains the build scripts for the project.

This documentation is s snapshot and things might have changed without this documentation being updated. 
Please check the source code for the latest information.

```
scripts                                         <flybywire monorepo - will be renamed eventually>
├── dev-env 
│   ├── run.cmd                                 Runs any command in the dev-env container (e.g. `.\scripts\dev-env\run.cmd ./scripts/build.sh`)
│   ├── run.sh                                  Runs any command in the dev-env container in a linux environment
│   ├── run-local.cmd                           <used for container development>
│   ├── run-local.sh                            <used for container development>
                                                 
├── build.sh                                    Builds everything e.g. A32NX and A380X
├── build_a32nx.js                              Additional script after igniter build to create layout.json and manifest.json (also does version sticker)                              
├── build_a32nx.sh                              Only builds A32NX
├── build_a380x.sh                              Only builds A380X (only wasm for now)
├── cdn.sh                                      Upload to CDN (bunny - deprecated)
├── cf-cdn.sh                                   Upload to CloudFlare CDN
├── fragment_a32nx.js                           Splits up A32NX downloadable files into fragments
├── install-source_a32nx.js                     Creates A32NX install.json
├── lint-rust.js                                Start the rust linter
├── metadata.js                                 Creates A3xxx_build_info.json
├── pretty-realease-name.js                     Helper to get a better release name
├── setup.sh                                    Prepares the repo for building - mainly cleans and npm install
├── symlink_a32nx.cmd                           To link your out folder to your MSFS Community folder this tools helps build a link
├── test-js.sh                                  Starts npm test
├── test-rust.sh                                Start cargo test

```                                                

