# FBW Common Developer Documentation

## Instrument Setup

Each instrument has a config.json that determines the mach build settings and optionally an "extraDeps" property (array) that will add extra build dependencies to the igniter build task. These can be relative to the config.json directory, or absolute paths (starting with "/") will be treated as relative to the root of the repo.
