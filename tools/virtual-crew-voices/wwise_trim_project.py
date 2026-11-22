#!/usr/bin/env python3
# Copyright (c) 2026 FlyByWire Simulations
# SPDX-License-Identifier: GPL-3.0
"""
Removes the sounds of the sample aircraft from a COPY of the Wwise sample project of the MSFS 2024 SDK, keeping only
the sounds of the A380X virtual crew (work unit FBW_A380X_VCREW).

Without a licence key, Wwise runs in trial mode and refuses to generate SoundBanks when the project contains more than
200 media files. The limit counts the whole project, and the sample project already contains about 720 sounds of the
sample aircraft. Once the project has a licence key, this script is not needed.

Requirements (Windows):
- a copy of the folder WwiseSampleProject_MFS2024, opened in Wwise (never the original of the SDK)
- WAAPI enabled: Project > User Preferences > "Enable Wwise Authoring API"
- python -m pip install waapi-client

Usage:
    python wwise_trim_project.py
"""

from waapi import CannotConnectToWaapiException, WaapiClient

KEEP = 'FBW_A380X_VCREW'
# objects owning media files: the trial limit counts their audio sources
MEDIA_OWNER_TYPES = ('Sound', 'MusicTrack')


def main() -> None:
    try:
        client = WaapiClient()
    except CannotConnectToWaapiException:
        raise SystemExit('Cannot connect to Wwise: open the project and enable WAAPI in the user preferences')

    with client:
        project = client.call('ak.wwise.core.getProjectInfo') or {}
        project_path = str(project.get('path', ''))
        if 'MSFS 2024 SDK' in project_path or 'MSFS SDK' in project_path:
            raise SystemExit(f'{project_path} is the sample project of the SDK: open a copy of it instead')

        doomed = []
        for object_type in MEDIA_OWNER_TYPES:
            result = client.call(
                'ak.wwise.core.object.get',
                {'waql': f'$ from type {object_type}'},
                options={'return': ['id', 'path']},
            )
            doomed += [o for o in (result or {}).get('return', []) if f'\\{KEEP}\\' not in o['path'] + '\\']

        if not doomed:
            print('Nothing to remove')
            return

        print(f'Removing {len(doomed)} sounds of the sample aircraft from {project_path}')
        client.call('ak.wwise.core.undo.beginGroup')
        for obj in doomed:
            client.call('ak.wwise.core.object.delete', {'object': obj['id']})
        client.call('ak.wwise.core.undo.endGroup', {'displayName': 'Remove the sample aircraft sounds'})
        client.call('ak.wwise.core.project.save')
        print(f'Done: generate the SoundBank {KEEP} again')


if __name__ == '__main__':
    main()
