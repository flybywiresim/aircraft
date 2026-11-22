#!/usr/bin/env python3
# Copyright (c) 2026 FlyByWire Simulations
# SPDX-License-Identifier: GPL-3.0
"""
Renames the events created by the earlier versions of wwise_import.py to the name expected by the simulator.

MSFS prefixes every Wwise event of an aircraft with the name of the MainPackage of its sound.xml, also for the events
of an additional package. The MainPackage of the A380X is Asobo_A320_NEO, so the event of WwiseEvent="vcrew_male_v_1"
must be named Play_Asobo_A320_NEO_vcrew_male_v_1, not Play_FBW_A380X_VCREW_vcrew_male_v_1.

Requirements: Wwise with the project open and WAAPI enabled, python -m pip install waapi-client
Usage: python wwise_fix_event_names.py
"""

from waapi import CannotConnectToWaapiException, WaapiClient

from wwise_import import BANK, EVENT_PREFIX

WRONG_PREFIXES = (f'_Event_Play_{BANK}_', f'Play_{BANK}_')


def main() -> None:
    try:
        client = WaapiClient()
    except CannotConnectToWaapiException:
        raise SystemExit('Cannot connect to Wwise: open the project and enable WAAPI in the user preferences')

    with client:
        result = client.call('ak.wwise.core.object.get', {'waql': '$ from type Event'}, options={'return': ['id', 'name']})
        renamed = 0
        for event in (result or {}).get('return', []):
            prefix = next((p for p in WRONG_PREFIXES if event['name'].startswith(p)), None)
            if prefix is None:
                continue
            name = EVENT_PREFIX + event['name'][len(prefix):]
            client.call('ak.wwise.core.object.setName', {'object': event['id'], 'value': name})
            if renamed == 0:
                print(f'e.g. {event["name"]} -> {name}')
            renamed += 1

        client.call('ak.wwise.core.project.save')
        print(f'Renamed {renamed} events' if renamed else 'No event to rename')


if __name__ == '__main__':
    main()
