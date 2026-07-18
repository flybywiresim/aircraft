// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Subject } from '@microsoft/msfs-sdk';
import { describe, expect, it } from 'vitest';
import { InputFieldDisplayState, InputFieldUtils } from './InputFieldUtils';

function createDisplayState(mandatory: boolean, disabled: boolean, inactive: boolean): InputFieldDisplayState {
  return {
    mandatory: Subject.create(mandatory),
    disabled: Subject.create(disabled),
    inactive: Subject.create(inactive),
  };
}

describe('InputFieldUtils', () => {
  describe('shouldRenderMandatoryPlaceholder', () => {
    it('renders boxes for an active mandatory field', () => {
      expect(InputFieldUtils.shouldRenderMandatoryPlaceholder(createDisplayState(true, false, false))).toBe(true);
    });

    // Regression for #10843: a mandatory + disabled field must show placeholder boxes
    // (greyed out via the disabled class), not the raw amber dashes.
    it('renders boxes for a mandatory field that is also disabled', () => {
      expect(InputFieldUtils.shouldRenderMandatoryPlaceholder(createDisplayState(true, true, false))).toBe(true);
    });

    it('does not render boxes for an inactive field (rendered as static value)', () => {
      expect(InputFieldUtils.shouldRenderMandatoryPlaceholder(createDisplayState(true, false, true))).toBe(false);
    });

    it('does not render boxes for a non-mandatory field', () => {
      expect(InputFieldUtils.shouldRenderMandatoryPlaceholder(createDisplayState(false, false, false))).toBe(false);
      expect(InputFieldUtils.shouldRenderMandatoryPlaceholder(createDisplayState(false, true, false))).toBe(false);
    });
  });

  describe('shouldApplyMandatoryClass', () => {
    it('applies the amber mandatory class for an active mandatory field', () => {
      expect(InputFieldUtils.shouldApplyMandatoryClass(createDisplayState(true, false, false))).toBe(true);
    });

    // Regression for #10843: the amber colour must not be applied to a disabled field;
    // the placeholder should be grey (handled by the disabled CSS class).
    it('does not apply the amber mandatory class when the field is disabled', () => {
      expect(InputFieldUtils.shouldApplyMandatoryClass(createDisplayState(true, true, false))).toBe(false);
    });

    it('does not apply the amber mandatory class when the field is inactive', () => {
      expect(InputFieldUtils.shouldApplyMandatoryClass(createDisplayState(true, false, true))).toBe(false);
    });

    it('does not apply the amber mandatory class for a non-mandatory field', () => {
      expect(InputFieldUtils.shouldApplyMandatoryClass(createDisplayState(false, false, false))).toBe(false);
    });
  });
});
