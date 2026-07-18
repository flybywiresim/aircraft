// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Subscribable } from '@microsoft/msfs-sdk';

/**
 * State of an {@link InputField} that determines how an empty value is displayed.
 */
export interface InputFieldDisplayState {
  /** Whether the field is mandatory (empty values are shown as placeholder boxes). */
  mandatory: Subscribable<boolean>;
  /** Whether the field is disabled (rendered as a greyed-out, non-editable input). */
  disabled: Subscribable<boolean>;
  /** Whether the field is inactive (rendered as a static value, e.g. computed by the FMS). */
  inactive: Subscribable<boolean>;
}

export class InputFieldUtils {
  /**
   * Whether an empty mandatory field should render its value as placeholder boxes (`▯`)
   * rather than the raw formatted dashes.
   *
   * A field is shown as boxes when it is mandatory and not inactive. This includes the disabled
   * case: a disabled mandatory field must still show boxes (greyed out via the `disabled` CSS
   * class), not amber dashes. Inactive fields are excluded because they render a static value.
   */
  public static shouldRenderMandatoryPlaceholder(state: InputFieldDisplayState): boolean {
    return state.mandatory.get() && !state.inactive.get();
  }

  /**
   * Whether the amber `mandatory` colour class should be applied to an empty field.
   *
   * The `mandatory` class colours the placeholder amber. It must not be applied when the field is
   * disabled (the placeholder should be grey) or inactive (rendered as a static value).
   */
  public static shouldApplyMandatoryClass(state: InputFieldDisplayState): boolean {
    return state.mandatory.get() && !state.disabled.get() && !state.inactive.get();
  }
}
