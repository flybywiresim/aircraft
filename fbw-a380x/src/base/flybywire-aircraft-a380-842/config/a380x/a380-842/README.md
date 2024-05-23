# FlyByWire Unified Config

!!!!!!!!!!!!

Note: This is a work in progress, consider this a developer-only preview, treat this as a private API and integrate with the current format and values at your own risk. Format at this stage can and will change suddenly without notice, warranty or support provided. Thank you for your cooperation, patience and understanding.


At this stage, if you have any suggestions, input or inquiries in regards to the structure/function of the config ``.json5`` files,
then please contact the FlyByWire core development team on [discord](https://discord.gg/flybywire).

!!!!!!!!!!!!!

The goal of this effort is to unify configuration for all FBW based projects, in a way that can be piped to both JS (completed) and WASM Gauges (pending),
and in doing so, exposing these variables for both easier visibility for contributors as well as aiding external parties in adapting the
flyPad and other components to other aircraft.

Currently, there is config and hardcoded values spreadout across the project repository, sometimes in various configuration (.json, .h, .toml, etc.) files.

The solution to this takes on (at the moment) the form of a VFS stored ``.json5`` markup files in ``config/<env.AIRCRAFT_PROJECT_PREFIX>/<Variant>/*.json5`` that has a format that currently is being decided and iterated upon.

This will (eventually) allow for deep, per-livery/tail number configuration i.e. dynamic passenger seating configurations and cargo loading by providing an override file (based on ATC ID/tailnumber),

i.e. ``<env.AIRCRAFT_PROJECT_PREFIX>/<variant>/<tail_num>/*.json5``

This consists of several components and will be expanded upon in stages to facilitate and aid our code review and refactoring processes.

**Note:** From this point, any configuration that exists in panel.xml and elsewhere that is left hardcoded should be considered to be left *NOT exposed on purpose*.
Please consult with our core development team before adding more configuration and hardcoded values into the ``config.json5`` markup.

Please do NOT add any new configuration to the panel.xml or other configuration files that are not already present in the unified config.
Please do NOT add any new configuration to the panel.cfg or other configuration files that are not already present in the unified config.
Please do NOT move any more configuration or hardcoded values from FlyByWire header files, or other json or markup in the unified config.

Please do NOT draft PRs or add configuration to the unified config, or any of its associated boilerplate and middleware, without first consulting with the core development team.

Please do NOT hesitate to ask questions or seek clarification on the FlyByWire [discord](https://discord.gg/flybywire) server, we are here to help!

**IMPORTANT**

The base configuration location is in ``config/<env.AIRCRAFT_PROJECT_PREFIX>/<Variant>/*.json5``

!!! DO NOT OVERWRITE, ADD, OR MODIFY ANY KEYS OR VALUES IN THE BASE CONFIG FILE. !!!
!!! DO NOT OVERWRITE, ADD, OR MODIFY ANY KEYS OR VALUES IN THE BASE CONFIG FILE. !!!
!!! DO NOT OVERWRITE, ADD, OR MODIFY ANY KEYS OR VALUES IN THE BASE CONFIG FILE. !!!
!!! DO NOT OVERWRITE, ADD, OR MODIFY ANY KEYS OR VALUES IN THE BASE CONFIG FILE. !!!

Doing so can cause issues with the aircraft and will not be supported by the FlyByWire team. If you need to change a value, please do so in the livery specific config file (when this feature is documented and available).

Certain unwritable keys are REQUIRED in order for the flyPad and potentially parts of the aircraft to function. These are usually marked with a _ in the base config, but not always.

Due to how the base configuration files in this folder are read and processed (i.e. ``config/<env.AIRCRAFT_PROJECT_PREFIX>/<Variant>/*.json5``), in relation to our GPLv3 license, these VFS based markup configurations are considered an integral part of the aircraft (as the addon cannot function without them) and is therefore part of the GPLv3 license.

*This means that any changes to the base configuration file must be made available under the same license as per copyleft.* This includes any liveries, plugins, or other modifications that use or override/subsitute specifically the files located in this folder, as they will be linking directly with other boilerplate and middleware which are licensed under GPLv3, *and thus any code which is linked with any modified json5 must also be released under GPLv3*. At this time, this may or may not apply to the livery override files (and has yet to be decided).

If you are unsure about any of this, please ask on our [discord.](https://discord.gg/flybywire)

### Current Functionality

Note: Before v 1.0, also known as the first published version, you can consider this as a "private" and thus mostly undocumented and unreleased feature, mainly here for the
Benefit of code contributors and developers, both working on this feature and in general.

We will not offer support, warranty or answer help queries based on liveries that have pre-maturely adopted this VFS unified config format structure before this time.

## v 0.1
    - Basic Configuration for EFB pages (Payload, Ground Services, etc.)

### Planned Functionality

## v 0.2
    - Deeper configuration for EFB pages
    - Configuration per-livery (initial stage)

### v 0.3
    - Configuration of EFB graphics (SVGs, etc)
    - Further Documentation on the FBW Unified Config format (also into FBW docs format)

## v 1.x
    - Configuration of EFB graphics (SVGs, etc)
    - Per-livery config (without overriding default json)
    - First published release of the FBW Unified Config

## Future
    - Configuration of physical seating in the cabin model
    - Configuration of Persistent Elements (SATCOM)
    - Further Documentation on how the FBW Unified Config backend and middleware pipes configuration into both JS/WASM
