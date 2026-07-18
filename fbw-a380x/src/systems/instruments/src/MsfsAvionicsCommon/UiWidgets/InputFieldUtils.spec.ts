// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { shouldApplyMandatoryClass, shouldRenderMandatoryPlaceholder } from './InputFieldUtils';

describe('InputFieldUtils', () => {
  describe('shouldRenderMandatoryPlaceholder', () => {
    it('renders boxes for an active mandatory field', () => {
      expect(shouldRenderMandatoryPlaceholder({ mandatory: true, disabled: false, inactive: false })).toBe(true);
    });

    // Regression for #10843: a mandatory + disabled field must show placeholder boxes
    // (greyed out via the disabled class), not the raw amber dashes.
    it('renders boxes for a mandatory field that is also disabled', () => {
      expect(shouldRenderMandatoryPlaceholder({ mandatory: true, disabled: true, inactive: false })).toBe(true);
    });

    it('does not render boxes for an inactive field (rendered as static value)', () => {
      expect(shouldRenderMandatoryPlaceholder({ mandatory: true, disabled: false, inactive: true })).toBe(false);
    });

    it('does not render boxes for a non-mandatory field', () => {
      expect(shouldRenderMandatoryPlaceholder({ mandatory: false, disabled: false, inactive: false })).toBe(false);
      expect(shouldRenderMandatoryPlaceholder({ mandatory: false, disabled: true, inactive: false })).toBe(false);
    });
  });

  describe('shouldApplyMandatoryClass', () => {
    it('applies the amber mandatory class for an active mandatory field', () => {
      expect(shouldApplyMandatoryClass({ mandatory: true, disabled: false, inactive: false })).toBe(true);
    });

    // Regression for #10843: the amber colour must not be applied to a disabled field;
    // the placeholder should be grey (handled by the disabled CSS class).
    it('does not apply the amber mandatory class when the field is disabled', () => {
      expect(shouldApplyMandatoryClass({ mandatory: true, disabled: true, inactive: false })).toBe(false);
    });

    it('does not apply the amber mandatory class when the field is inactive', () => {
      expect(shouldApplyMandatoryClass({ mandatory: true, disabled: false, inactive: true })).toBe(false);
    });

    it('does not apply the amber mandatory class for a non-mandatory field', () => {
      expect(shouldApplyMandatoryClass({ mandatory: false, disabled: false, inactive: false })).toBe(false);
    });
  });
});
