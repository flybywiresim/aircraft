// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import { usePersistentProperty, useSimVar } from '@flybywiresim/fbw-sdk-react';
import { SelectGroup, SelectInput, SelectItem, SettingItem, SettingsPage, Toggle } from '@flybywiresim/flypad';
import {
  VirtualCrewButtonEvents,
  VirtualCrewButtonLocalVars,
  VirtualCrewButtonNone,
  VirtualCrewCommand,
  VirtualCrewCommandLocalVar,
  VirtualCrewCommandParamLocalVar,
  VirtualCrewDefaults,
  VirtualCrewSettingKeys,
  VirtualCrewSsrPolicies,
  VirtualCrewTestActions,
  VirtualCrewVoices,
  VirtualCrewVoiceSetting,
} from '../../../../shared/src/VirtualCrew';

/** Names of the sim events as shown in the MSFS controls settings */
const ButtonEventLabels: Record<string, string> = {
  [VirtualCrewButtonNone]: 'None',
  SMOKE_TOGGLE: 'Toggle smoke system',
  TOGGLE_TAIL_HOOK_HANDLE: 'Toggle tail hook',
  TOGGLE_WING_FOLD: 'Toggle wing fold',
  TOGGLE_WATER_RUDDER: 'Toggle water rudders',
};

const buttonEventOptions = [VirtualCrewButtonNone, ...VirtualCrewButtonEvents].map((event) => ({
  value: event,
  displayValue: ButtonEventLabels[event] ?? event,
}));

const VoiceLabels: Record<VirtualCrewVoiceSetting, string> = {
  male: 'Male',
  female: 'Female',
};

const VoiceSelect: React.FC<{ value: string; onChange: (value: VirtualCrewVoiceSetting) => void }> = ({
  value,
  onChange,
}) => (
  <SelectGroup>
    {VirtualCrewVoices.map((voice) => (
      <SelectItem key={voice} onSelect={() => onChange(voice)} selected={value === voice}>
        {VoiceLabels[voice]}
      </SelectItem>
    ))}
  </SelectGroup>
);

export const VirtualCrewPage: React.FC = () => {
  const [enabled, setEnabled] = usePersistentProperty(VirtualCrewSettingKeys.Enabled, VirtualCrewDefaults.enabled);
  const [captainVoice, setCaptainVoice] = usePersistentProperty(
    VirtualCrewSettingKeys.CaptainVoice,
    VirtualCrewDefaults.captainVoice,
  );
  const [firstOfficerVoice, setFirstOfficerVoice] = usePersistentProperty(
    VirtualCrewSettingKeys.FirstOfficerVoice,
    VirtualCrewDefaults.firstOfficerVoice,
  );
  const [primaryEvent, setPrimaryEvent] = usePersistentProperty(
    VirtualCrewSettingKeys.PrimaryButtonEvent,
    VirtualCrewDefaults.primaryButtonEvent,
  );
  const [secondaryEvent, setSecondaryEvent] = usePersistentProperty(
    VirtualCrewSettingKeys.SecondaryButtonEvent,
    VirtualCrewDefaults.secondaryButtonEvent,
  );
  const [ssrPolicy, setSsrPolicy] = usePersistentProperty(
    VirtualCrewSettingKeys.SsrPolicy,
    VirtualCrewDefaults.ssrPolicy,
  );
  const [, setPrimaryButton] = useSimVar(VirtualCrewButtonLocalVars.Primary, 'number');
  const [, setSecondaryButton] = useSimVar(VirtualCrewButtonLocalVars.Secondary, 'number');
  const [, setCommandParam] = useSimVar(VirtualCrewCommandParamLocalVar, 'number');
  const [, sendCommand] = useSimVar(VirtualCrewCommandLocalVar, 'number');

  const testAction = (index: number) => {
    // the parameter first, the virtual crew reads it with the command
    setCommandParam(index);
    sendCommand(VirtualCrewCommand.TestAction);
  };

  const isEnabled = enabled === '1';

  return (
    <SettingsPage name="Virtual Crew">
      <SettingItem name="Virtual crew">
        <Toggle value={isEnabled} onToggle={(value) => setEnabled(value ? '1' : '0')} />
      </SettingItem>

      <SettingItem name="Captain voice" disabled={!isEnabled}>
        <VoiceSelect value={captainVoice} onChange={setCaptainVoice} />
      </SettingItem>

      <SettingItem name="First officer voice" disabled={!isEnabled}>
        <VoiceSelect value={firstOfficerVoice} onChange={setFirstOfficerVoice} />
      </SettingItem>

      <SettingItem name="SSR policy (transponder)" disabled={!isEnabled}>
        <SelectGroup>
          {VirtualCrewSsrPolicies.map((policy) => (
            <SelectItem key={policy} onSelect={() => setSsrPolicy(policy)} selected={ssrPolicy === policy}>
              {policy}
            </SelectItem>
          ))}
        </SelectGroup>
      </SettingItem>

      <SettingItem name="Primary button (sim event)" disabled={!isEnabled}>
        <SelectInput
          className="w-80"
          value={primaryEvent}
          onChange={(value) => setPrimaryEvent(value as string)}
          options={buttonEventOptions}
          disabled={!isEnabled}
        />
      </SettingItem>

      <SettingItem name="Secondary button (sim event)" disabled={!isEnabled}>
        <SelectInput
          className="w-80"
          value={secondaryEvent}
          onChange={(value) => setSecondaryEvent(value as string)}
          options={buttonEventOptions}
          disabled={!isEnabled}
        />
      </SettingItem>

      <SettingItem name="Press button" disabled={!isEnabled}>
        <SelectGroup>
          <SelectItem disabled={!isEnabled} onSelect={() => setPrimaryButton(1)}>
            Primary
          </SelectItem>
          <SelectItem disabled={!isEnabled} onSelect={() => setSecondaryButton(1)}>
            Secondary
          </SelectItem>
        </SelectGroup>
      </SettingItem>

      <div className="py-4">
        <p className="text-2xl">Test the cockpit controls of the first officer</p>
        <p className="mb-3 text-xl text-theme-unselected">
          The first officer operates these controls in the flows. Check in the cockpit that each control moves.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {VirtualCrewTestActions.map((action, index) => (
            <button
              key={action.id}
              type="button"
              disabled={!isEnabled}
              onClick={() => testAction(index)}
              // the background is always explicit: Coherent paints buttons light grey by default
              className={`rounded-md border-2 px-2 py-1 text-lg ${
                isEnabled
                  ? 'border-theme-highlight bg-theme-body text-theme-highlight hover:bg-theme-highlight hover:text-theme-body'
                  : 'cursor-not-allowed border-theme-accent bg-theme-accent text-theme-unselected'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-4 text-xl leading-relaxed text-theme-text">
        <p>
          You are the pilot flying, in the seat of the camera. The virtual crew member is the pilot monitoring and
          follows the FBW A380X SOP. Bind the selected sim events to buttons of your controller in the MSFS controls
          settings.
        </p>
        <p className="mt-2">
          Primary button: does the next thing of the SOP, shown on the Crew page: responds to the checklist items,
          requests the available checklist, starts the line-up flow at the holding point, or gives the next order of the
          pilot flying (e.g. "Takeoff", "Gear up", "Flaps one", "Gear down", "Go around, flaps"). Secondary button:
          stops the checklist being read, "Stop" during the takeoff roll before V1, otherwise skips the pending order.
        </p>
        <p className="mt-2">
          SSR policy: VATSIM, the first officer sets the transponder to AUTO before the start and to STBY at the
          parking. IVAO, to AUTO at the line-up and to STBY after landing.
        </p>
      </div>
    </SettingsPage>
  );
};
