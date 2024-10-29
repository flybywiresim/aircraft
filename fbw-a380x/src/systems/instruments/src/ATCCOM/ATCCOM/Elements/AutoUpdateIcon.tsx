import React, { FC } from 'react';

type AutoUpdateIconProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export const AutoUpdateIcon: FC<AutoUpdateIconProps> = ({ x = 0, y = 0, width = 38, height = 38 }) => (
  <>
    <path
      d={`M ${x + width * 0.97} ${y + height * 0.68} A ${width * 0.48} ${width * 0.48} 0 1 1 ${x + width * 0.97} ${y + height * 0.33}`}
      fill="none"
      stroke="#0f0"
      strokeWidth={3}
    />
    <polygon
      points={`${x + width * 0.76},${y + height * 0.36} ${x + width},${y + height * 0.36} ${x + width},${y + height * 0.1}`}
      fill="#0f0"
    />
  </>
);
