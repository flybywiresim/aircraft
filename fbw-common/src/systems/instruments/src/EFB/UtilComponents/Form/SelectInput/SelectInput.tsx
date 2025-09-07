// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'react-bootstrap-icons';
import { ScrollableContainer } from '../../ScrollableContainer';
import { TooltipWrapper } from '../../TooltipWrapper';

interface Option {
  value: any;
  displayValue: string;
  tooltip?: string;
}

/**
 * Options is array of options. Each option is an array, with the index 0 being the value and 1 being the display value
 * e.g [[0, "Value 1"], [1, "Value 2"]]
 * Options are displayed in order of list
 */
interface SelectInputProps {
  onChange?: (newValue: number | string | boolean) => void;
  defaultValue?: any;
  value?: any;
  reverse?: boolean; // Flips label/input order
  options: Option[];
  dropdownOnTop?: boolean; // Display dropdown above input instead of below
  className?: string;
  forceShowAll?: boolean; // Forces dropdown to show all options
  maxHeight?: number; // max height before it becomes scrollable
  disabled?: boolean;
}

const defaultOptionFallback: Option = { value: 0, displayValue: '' };

export const SelectInput = (props: SelectInputProps) => {
  const defaultOption =
    props.options.find((option) => option.value === (props.defaultValue ?? 0)) ?? defaultOptionFallback;

  const [value, setValue] = useState<any>(defaultOption.displayValue);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (props.value === undefined) return;

    const option = props.options.find((option) => option.value === props.value) ?? defaultOption;

    setValue(option.displayValue);
  }, [props.value]);

  // This useEffect is to support dynamically generated option lists.
  useEffect(() => {
    const option = props.options.find((option) => option.value === props.value) ?? defaultOption;
    setValue(option.displayValue);
  }, [props.options]);

  const onOptionClicked = (option: Option) => {
    if (props.onChange) {
      props.onChange(option.value);
    }
    setValue(option.displayValue);
  };

  const handleToggleDropdown = () => {
    if (props.disabled !== true) {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className="flex flex-row">
      <div
        className={`relative ${props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} rounded-md border-2 border-theme-accent ${props.className} ${' '}
                ${showDropdown && (props.dropdownOnTop ? 'rounded-t-none border-t-theme-body' : 'rounded-b-none border-b-theme-body')}`}
        onClick={handleToggleDropdown}
      >
        <div className="relative flex px-3 py-1.5">
          {value}
          <ChevronDown
            className={`absolute inset-y-0 right-3 h-full duration-100${showDropdown && '-rotate-180'}`}
            size={20}
          />
        </div>
        {showDropdown && (
          <div
            className={`absolute -inset-x-0.5 z-10 flex overflow-hidden border-2 border-theme-accent bg-theme-body pb-2 pr-2 ${' '}
                        ${
                          props.dropdownOnTop
                            ? 'top-0 -translate-y-full flex-col-reverse rounded-t-md border-b-0'
                            : 'bottom-0 translate-y-full flex-col rounded-b-md border-t-0'
                        }
                        `}
          >
            <ScrollableContainer height={props.maxHeight || 40} nonRigid>
              {props.options.map(
                (option) =>
                  (value !== option.displayValue || props.forceShowAll) &&
                  (option.tooltip ? (
                    <TooltipWrapper key={option.value} text={option.tooltip}>
                      <div
                        className="hover:bg-theme-highlight/5 px-3 py-1.5 transition duration-300 hover:text-theme-body"
                        onClick={() => onOptionClicked(option)}
                      >
                        {option.displayValue}
                      </div>
                    </TooltipWrapper>
                  ) : (
                    <div
                      key={option.value}
                      className="hover:bg-theme-highlight/5 px-3 py-1.5 transition duration-300 hover:text-theme-body"
                      onClick={() => onOptionClicked(option)}
                    >
                      {option.displayValue}
                    </div>
                  )),
              )}
            </ScrollableContainer>
          </div>
        )}
      </div>
    </div>
  );
};
