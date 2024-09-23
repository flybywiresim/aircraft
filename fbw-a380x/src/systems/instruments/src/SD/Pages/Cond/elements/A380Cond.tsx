import React from 'react';
import '../../../../index.scss';
import { Triangle } from '@instruments/common/Shapes';

const A380Cond = () => {
  return (
    <>
      <image
        x={16}
        y={60}
        width={725}
        height={460}
        xlinkHref="/Images/fbw-a380x/SD_COND.png"
        preserveAspectRatio="none"
      />
      <text x={77} y={142} className="White F23 MiddleAlign">
        AVNCS
      </text>
      <text x={458} y={152} className="White F23 MiddleAlign">
        TO
      </text>
      <text x={442} y={249} className="White F23 MiddleAlign">
        TO
      </text>
      <text x={77} y={284} className="White F23 MiddleAlign">
        AVNCS
      </text>
      <text x={195} y={305} className="White F23 MiddleAlign">
        CRG
      </text>
      <text x={340} y={305} className="White F23 MiddleAlign">
        REST
      </text>
      <text x={535} y={305} className="White F23 MiddleAlign">
        CRG
      </text>
      <text x={680} y={305} className="White F23 MiddleAlign">
        BULK
      </text>
      <text x={395} y={501} className="White F23 MiddleAlign">
        MIX AIR
      </text>
      <text x={395} y={530} className="White F23 MiddleAlign">
        RAM AIR
      </text>
      <text x={330} y={585} className="White F23 MiddleAlign">
        1
      </text>
      <text x={465} y={585} className="White F23 MiddleAlign">
        2
      </text>
      <text x={395} y={585} className="White F23 MiddleAlign">
        HOT AIR
      </text>

      {/* Arrow into fwd cargo */}
      <path className={'Green Line'} d={`M265,294 l 0,-20`} />
      <Triangle x={265} y={310} colour={'Green'} fill={0} orientation={180} scale={1.1} />

      {/* Arrow into fwd cargo */}
      <path className={'Green Line'} d={`M265,294 l 0,-26`} />
      <Triangle x={265} y={310} colour={'Green'} fill={0} orientation={180} scale={1.1} />

      {/* Arrow into ckpt and main deck */}
      <path className={'Green Line'} d={`M116,235 l 80,0`} />
      <Triangle x={100} y={235} colour={'Green'} fill={0} orientation={270} scale={1.1} />
      <Triangle x={210} y={235} colour={'Green'} fill={0} orientation={90} scale={1.1} />

      {/* Arrow into upper deck */}
      <path className={'Green Line'} d={`M196,145 l -40,0`} />
      <Triangle x={210} y={145} colour={'Green'} fill={0} orientation={90} scale={1.1} />

      {/* Main Line */}
      <path className={'Green Line'} d={`M395,484 l 0,-217 l -240,0 l 0,-122`} fill={'none'} />
      {/* Vertical devider fwd cargo */}
      <path className={'White Line'} d={`M300,408 l 0,-126`} />
      {/* Vertical devider aft cargo */}
      <path className={'White Line'} d={`M638,395 l 0,-97`} />
    </>
  );
};

export default A380Cond;
