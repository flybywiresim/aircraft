import React, { FC } from 'react';
import { useOITContext } from '../../OnboardInformationTerminal';
import { Button } from '../../Components/Button';

export const LoginPage: FC = () => {
  const { displayPosition } = useOITContext();
  return (
    <>
      <text x={512} y={152} fontSize={22} fill="#fff" textAnchor="middle">
        FLT OPS Domain
      </text>
      <text x={512} y={204} fontSize={17} fill="#fff" textAnchor="middle">
        Login Page
      </text>
      <text x={512} y={260} fontSize={22} fill="#fff" textAnchor="middle">
        {displayPosition}
      </text>
      <Button x={236} y={395} width={121} height={36}>
        PILOT
      </Button>
      <Button x={236} y={439} width={121} height={36}>
        MAINTAINER
      </Button>
      <Button x={15} y={694} width={144} height={64}>
        <tspan dy={-15}>SWITCH OFF</tspan>
        <tspan dy={15}>LAPTOP</tspan>
      </Button>
    </>
  );
};
