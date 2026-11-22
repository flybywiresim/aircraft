#!/usr/bin/env python3
# Copyright (c) 2026 FlyByWire Simulations
# SPDX-License-Identifier: GPL-3.0
"""
Imports the voices of the A380X virtual crew into the Wwise sample project of the MSFS 2024 SDK, through the Wwise
Authoring API (WAAPI), following the SDK documentation "Setting Up Wwise":

- a work unit FBW_A380X_VCREW in the AIRCRAFT_PLAYER folder of the Audio and Events hierarchies
- one Sound SFX per WAV file and one Play event per sound, named Play_Asobo_A320_NEO_<sound>
  (e.g. Play_Asobo_A320_NEO_vcrew_male_v_1 for the sound.xml entry WwiseEvent="vcrew_male_v_1"): the simulator
  prefixes every event with the MainPackage of sound.xml, also for the events of an additional package
- a SoundBank FBW_A380X_VCREW in the "aircrafts" work unit containing the events, then generated

Requirements (Windows):
- Wwise, with \\MSFS SDK\\Samples\\Wwise\\WwiseSampleProject open
- WAAPI enabled: Project > User Preferences > "Enable Wwise Authoring API"
- python -m pip install waapi-client

Usage:
    python wwise_import.py <folder containing male\\*.wav and female\\*.wav>

The PC.PCK package is then created with the FilePackager of Wwise, see README.md.
"""

import sys
from pathlib import Path

from waapi import CannotConnectToWaapiException, WaapiClient

BANK = 'FBW_A380X_VCREW'
# MainPackage of the sound.xml of the A380X, prefix of all its Wwise events
MAIN_PACKAGE = 'Asobo_A320_NEO'
EVENT_PREFIX = f'Play_{MAIN_PACKAGE}_'


def find_folder(client: WaapiClient, name: str, *hierarchies: str) -> str:
    """Path of the object named `name` in the first of the hierarchies containing it"""
    result = client.call('ak.wwise.core.object.get', {'waql': f'$ where name = "{name}"'}, options={'return': ['path']})
    paths = [o['path'] for o in (result or {}).get('return', [])]
    for hierarchy in hierarchies:
        for path in paths:
            if path.startswith(hierarchy + '\\'):
                return path
    raise SystemExit(f'"{name}" not found in {hierarchies}: is the WwiseSampleProject of the MSFS SDK open?')


def create(client: WaapiClient, parent: str, object_type: str, name: str) -> str:
    """Creates an object, or reuses it if it already exists"""
    client.call(
        'ak.wwise.core.object.create',
        {'parent': parent, 'type': object_type, 'name': name, 'onNameConflict': 'merge'},
    )
    return f'{parent}\\{name}'


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)

    wav_files = sorted(Path(sys.argv[1]).resolve().glob('*/vcrew_*.wav'))
    if not wav_files:
        raise SystemExit(f'No vcrew_*.wav file in the voice folders of {sys.argv[1]}')

    try:
        client = WaapiClient()
    except CannotConnectToWaapiException:
        raise SystemExit('Cannot connect to Wwise: open the project and enable WAAPI in the user preferences')

    with client:
        # the audio hierarchy is called "Actor-Mixer Hierarchy" up to Wwise 2023 and "Containers" from Wwise 2024
        audio_root = find_folder(client, 'AIRCRAFT_PLAYER', '\\Actor-Mixer Hierarchy', '\\Containers')
        events_root = find_folder(client, 'AIRCRAFT_PLAYER', '\\Events')
        banks_root = find_folder(client, 'aircrafts', '\\SoundBanks')

        audio_unit = create(client, audio_root, 'WorkUnit', BANK)
        events_unit = create(client, events_root, 'WorkUnit', BANK)

        imports = [
            {
                'audioFile': str(wav),
                'objectPath': f'{audio_unit}\\<Sound SFX>{wav.stem}',
                # the last path element is the name of the event, which plays the imported sound
                'event': f'{events_unit}\\{EVENT_PREFIX}{wav.stem}',
            }
            for wav in wav_files
        ]
        client.call(
            'ak.wwise.core.audio.import',
            {'importOperation': 'replaceExisting', 'default': {'importLanguage': 'SFX'}, 'imports': imports},
        )
        print(f'Imported {len(imports)} sounds with their Play events')

        bank = create(client, banks_root, 'SoundBank', BANK)
        client.call(
            'ak.wwise.core.soundbank.setInclusions',
            {
                'soundbank': bank,
                'operation': 'add',
                'inclusions': [{'object': events_unit, 'filter': ['events', 'structures', 'media']}],
            },
        )
        print(f'SoundBank {BANK} contains the events')

        client.call('ak.wwise.core.project.save')
        try:
            client.call('ak.wwise.core.soundbank.generate', {'soundbanks': [{'name': BANK}], 'writeToDisk': True})
            print(f'SoundBank {BANK} generated')
        except Exception as error:  # noqa: BLE001 - older Wwise versions, generate from the SoundBank Manager
            print(f'Generate the SoundBank {BANK} in the SoundBank Manager ({error})')

    print('Next: create the package FBW_A380X_VCREW.PC.PCK with the FilePackager, see README.md')


if __name__ == '__main__':
    main()
