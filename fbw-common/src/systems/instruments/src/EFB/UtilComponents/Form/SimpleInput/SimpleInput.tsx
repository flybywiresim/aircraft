// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { usePersistentNumberProperty, getRootElement, useSimVar } from '@flybywiresim/fbw-sdk';
import React, { useEffect, useRef, useState, PropsWithChildren } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from '../../../Store/store';
import { setOffsetY } from '../../../Store/features/keyboard';
import { KeyboardWrapper } from '../../KeyboardWrapper';

interface SimpleInputProps {
  placeholder?: string;
  value?: any;
  onChange?: (value: string) => void;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  min?: number;
  max?: number;
  number?: boolean;
  wind?: boolean;
  uppercase?: boolean;
  padding?: number;
  decimalPrecision?: number;
  fontSizeClassName?: string;
  reverse?: boolean; // Flip label/input order;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
}

export const SimpleInput = (props: PropsWithChildren<SimpleInputProps>) => {
  const [guid] = useState(uuidv4());

  const [displayValue, setDisplayValue] = useState(props.value?.toString() ?? '');
  const [focused, setFocused] = useState(false);

  const [autoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);

  const keyboard = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [OSKOpen, setOSKOpen] = useState(false);

  const [isLookingAtLeftEfb] = useSimVar('IS CAMERA RAY INTERSECT WITH NODE:1', 'boolean');
  const [isLookingAtRightEfb] = useSimVar('IS CAMERA RAY INTERSECT WITH NODE:2', 'boolean');

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (keyboard.current) {
      keyboard.current.setInput(displayValue);
    }
  }, [OSKOpen]);

  useEffect(() => {
    if (props.value === undefined || props.value === '') {
      setDisplayValue('');
      return;
    }

    if (focused) return;

    setDisplayValue(getConstrainedValue(props.value));
  }, [props.value]);

  const onChange = (value: string): void => {
    if (props.disabled) return;

    let originalValue = value;

    if (props.number) {
      originalValue = originalValue.replace(/[^\d.-]/g, ''); // Replace all non-numeric characters
    }

    if (props.wind) {
      originalValue = originalValue.toUpperCase();
      const regex = /^(?:H|HD|TL|T|[-+])?\d{0,2}(?:\/\d{2})?$|^\d{1,5}$|^\d{3}\/\d{0,2}$/;
      if (
        !regex.test(originalValue) ||
        (!isNaN(Number(originalValue.slice(0, 3))) && Number(originalValue.slice(0, 3)) > 360)
      ) {
        originalValue = displayValue;
      }
      originalValue = originalValue.replace(/^(\d{3})(\d{2}).*$/, '$1/$2');
    }

    if (props.uppercase) {
      originalValue = originalValue.toUpperCase();
    }

    if (props.maxLength) {
      originalValue = originalValue.substring(0, props.maxLength);
    }

    props.onChange?.(originalValue);

    if (keyboard.current) {
      keyboard.current.setInput(originalValue);
    }
    setDisplayValue(originalValue);
  };

  const onFocus = (event: React.FocusEvent<HTMLInputElement>): void => {
    setFocused(true);
    if (!props.disabled) {
      props.onFocus?.(event.target.value);
    }

    if (autoOSK) {
      setOSKOpen(true);

      if (inputRef.current) {
        // 450 is just a guesstimate of the keyboard height
        const spaceBeforeKeyboard = 1000 - 450;

        if (inputRef.current.getBoundingClientRect().bottom > spaceBeforeKeyboard) {
          const offset = inputRef.current.getBoundingClientRect().bottom - spaceBeforeKeyboard;

          dispatch(setOffsetY(offset));
        }
      }
    }
  };

  const onFocusOut = (event: React.FocusEvent<HTMLInputElement>): void => {
    const { value } = event.currentTarget;
    const constrainedValue = getConstrainedValue(value);

    setDisplayValue(constrainedValue);
    setFocused(false);
    setOSKOpen(false);

    if (!props.disabled) {
      props.onBlur?.(constrainedValue);
    }

    dispatch(setOffsetY(0));
  };

  const getConstrainedValue = (value: string): string => {
    if (!props.number) {
      return value;
    }
    let constrainedValue = value;
    let numericValue = parseFloat(value);

    if (!Number.isNaN(numericValue)) {
      if (props.min !== undefined && numericValue < props.min) {
        numericValue = props.min;
      } else if (props.max !== undefined && numericValue > props.max) {
        numericValue = props.max;
      }

      if (props.decimalPrecision !== undefined) {
        const fixed = numericValue.toFixed(props.decimalPrecision);
        constrainedValue = parseFloat(fixed).toString(); // Have to re-parse to remove trailing 0s
      } else {
        constrainedValue = numericValue.toString();
      }
      constrainedValue = pad(constrainedValue);
    }
    return constrainedValue;
  };

  const pad = (value: string): string => {
    if (props.padding === undefined) return value;
    const split = value.split('.');
    while (split[0].length < props.padding) {
      split[0] = `0${split[0]}`;
    }
    return split.join('.');
  };

  const blurInputField = () => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  useEffect(() => {
    if (focused) {
      Coherent.trigger('FOCUS_INPUT_FIELD', guid, '', '', '', false);
    } else {
      Coherent.trigger('UNFOCUS_INPUT_FIELD', guid);
    }
    return () => {
      Coherent.trigger('UNFOCUS_INPUT_FIELD', guid);
    };
  }, [focused]);

  useEffect(() => {
    // we don't want to update this hook when focused changes so it is not a dep
    // we only want to unfocus when the user was looking at the EFB and then looked away
    if (focused && !isLookingAtLeftEfb && !isLookingAtRightEfb) {
      blurInputField();
    }
  }, [isLookingAtLeftEfb, isLookingAtRightEfb]);

  // unfocus the search field when user presses enter
  getRootElement().addEventListener('keypress', (event: KeyboardEvent) => {
    // 'keyCode' is deprecated but 'key' is not supported in MSFS
    if (event.keyCode === 13) {
      blurInputField();
    }
  });

  return (
    <>
      <input
        className={`px-3 py-1.5 ${props.fontSizeClassName ?? 'text-lg'} rounded-md border-2 border-theme-accent bg-theme-accent
                    text-theme-text transition duration-100 placeholder:text-theme-unselected focus-within:border-theme-highlight focus-within:outline-none
                    ${props.className}
                    ${props.disabled && 'cursor-not-allowed opacity-50'}`}
        value={displayValue}
        placeholder={props.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onFocusOut}
        disabled={props.disabled}
        ref={inputRef}
      />
      {OSKOpen && (
        <KeyboardWrapper
          keyboardRef={keyboard}
          onChangeAll={(v) => onChange(v.default)}
          blurInput={blurInputField}
          setOpen={setOSKOpen}
          onKeyDown={(e) => {
            if (e === '{bksp}') {
              onChange(displayValue.slice(0, displayValue.length - 1));
            }
          }}
        />
      )}
    </>
  );
};
