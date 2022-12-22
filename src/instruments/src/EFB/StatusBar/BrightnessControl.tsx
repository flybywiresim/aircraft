// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useRef, useState } from 'react';
import { BrightnessHigh } from 'react-bootstrap-icons';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import Slider from 'rc-slider';
import { t } from '../translation';
import { TooltipWrapper } from '../UtilComponents/TooltipWrapper';

export const BrightnessControl = () => {
    const [showSlider, setShowSlider] = useState(false);
    const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
    const [usingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);

    // To prevent keyboard input (esp. END key for external view) to change
    // the slider position. This is accomplished by a
    // onAfterChange={() => sliderRef.current.blur()}
    // in the Slider component props.
    const brightnessSliderRef = useRef<any>(null);

    return (
        <>
            {!usingAutobrightness && (
                <TooltipWrapper text={t('StatusBar.TT.Brightness')}>
                    <div onClick={() => setShowSlider((old) => !old)}>
                        <BrightnessHigh size={26} />
                    </div>
                </TooltipWrapper>
            )}
            {showSlider
                && (
                    <div
                        className="absolute z-40 px-2 whitespace-nowrap bg-theme-accent rounded-md border border-theme-secondary transition duration-100"
                        style={{ top: '40px', left: '1032px' }}
                    >
                        <Slider
                            ref={brightnessSliderRef}
                            style={{ width: '18rem' }}
                            value={usingAutobrightness ? brightness : brightnessSetting}
                            onChange={setBrightnessSetting}
                            onAfterChange={() => brightnessSliderRef.current.blur()}
                            onBlur={() => setShowSlider(false)}
                        />
                    </div>
                )}
        </>
    );
};
