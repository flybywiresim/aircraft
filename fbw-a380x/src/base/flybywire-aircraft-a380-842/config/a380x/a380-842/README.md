# FlyByWire Unified Config

The goal of this effort is to unify configuration for all FBW based projects, in a way that can be piped to both JS and WASM Gauges,
and in doing so, exposing these variables for both easier visibility for contributors as well as aiding external parties in adapting the
flyPad and other components to other aircraft.

Currently, there is config and hardcoded values spreadout across the repo, sometimes in various configuration (.json, .h, .toml, etc.) files.

The solution to this takes on (at the moment) the form of a VFS stored .json markup files in ``config/<env.AIRCRAFT_PROJECT_PREFIX>/<Variant>/*.json`` that has a format that currently is being decided and iterated upon.

This will (eventually) allow for deep, per-livery/tail number configuration i.e. dynamic passenger seating configurations and cargo loading by providing an override file (based on ATC ID/tailnumber),
i.e. ``<env.AIRCRAFT_PROJECT_PREFIX>/<variant>/<tail_num>/*.json``

This consists of several components and will be expanded upon in stages to facilitate and aid our code review and refactoring processes.

At this stage, if you have any suggestions, input or inquiries in regards to the structure/function of the config ``.json`` files,
then please contact the FlyByWire core development team on discord.

This is still a WIP, so please stay tuned for more details. Thank you for your cooperation, patience and understanding.

**Note:** From this point, any configuration that exists in panel.xml and elsewhere that is left hardcoded should be considered to be left *NOT exposed on purpose*.
Please consult with our core development team before adding more configuration and hardcoded values into the ``config.json`` markup.

### Current Functionality

Note: Before v 1.3, also known as the first published version, you can consider this as a "private" and thus mostly undocumented and unreleased feature, mainly here for the
Benefit of code contributors and developers, both working on this feature and in general.

We will not offer support, warranty or answer help queries based on liveries that have pre-maturely adopted this VFS unified config format structure before this time.

## v 0.1
    - Basic Configuration for EFB pages (Payload, Ground Services, etc.)

### Planned Functionality

## v 0.2
    - Deeper configuration for EFB pages
    - Configuration per-livery (initial stage)
## v 0.3
    - Configuration of EFB graphics (SVGs, etc)
    - Per-livery config (without overriding default json)
    - Further Documentation on the FBW Unified Config format (also into FBW docs format)

## Future
    - Configuration of physical seating in the cabin model
    - Configuration of Persistent Elements (SATCOM)
    - Further Documentation on how the FBW Unified Config backend and middleware pipes configuration into both JS/WASM
