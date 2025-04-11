import React from 'react';
import { PageTitle } from '../Generic/PageTitle';
import BleedEngine from './elements/BleedEngine';
import BleedPack from './elements/BleedPack';
import BleedCrossbleed from './elements/BleedCrossbleed';
import BleedApu from './elements/BleedApu';
import BleedHotAir from './elements/BleedHotAir';
import BleedMixerUnit from './elements/BleedMixerUnit';
import BleedGnd from './elements/BleedGnd';

import '../../../index.scss';
import { useArinc429Var } from '@instruments/common/arinc429';

export const BleedPage = () => {
  const sdacDatum = true;

  const agsB1DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B1_AGS_DISCRETE_WORD');
  const agsB2DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B2_AGS_DISCRETE_WORD');
  const agsB3DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B3_AGS_DISCRETE_WORD');
  const agsB4DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B4_AGS_DISCRETE_WORD');

  const isPack1Operative = agsB1DiscreteWord.bitValueOr(
    13,
    agsB2DiscreteWord.bitValueOr(13, agsB3DiscreteWord.bitValueOr(13, agsB4DiscreteWord.bitValueOr(13, false))),
  );
  const isPack2Operative = agsB1DiscreteWord.bitValueOr(
    14,
    agsB2DiscreteWord.bitValueOr(14, agsB3DiscreteWord.bitValueOr(14, agsB4DiscreteWord.bitValueOr(14, false))),
  );

  return (
    <>
      <PageTitle x={6} y={29}>
        BLEED
      </PageTitle>

      <BleedMixerUnit x={384} y={30} _sdacDatum={sdacDatum} />

      <text x={344} y={70} className="White F23 MiddleAlign">
        RAM
      </text>
      <text x={404} y={70} className="White F23 MiddleAlign">
        AIR
      </text>

      {/* Hot Air */}
      <BleedHotAir x={238} y={204} hotAir={1} _sdacDatum={sdacDatum} />
      <BleedHotAir x={514} y={204} hotAir={2} _sdacDatum={sdacDatum} />

      <text x={344} y={190} className="White F23 MiddleAlign">
        HOT
      </text>
      <text x={404} y={190} className="White F23 MiddleAlign">
        AIR
      </text>

      <BleedEngine x={75} y={525} engine={1} sdacDatum={sdacDatum} />
      <BleedEngine x={209} y={525} engine={2} sdacDatum={sdacDatum} />
      <BleedEngine x={485} y={525} engine={3} sdacDatum={sdacDatum} />
      <BleedEngine x={619} y={525} engine={4} sdacDatum={sdacDatum} />

      {/* Packs */}
      <BleedPack x={115} y={90} pack={1} isPackOperative={isPack1Operative} />
      <BleedPack x={525} y={90} pack={2} isPackOperative={isPack2Operative} />

      {/* Crossbleed */}
      <BleedCrossbleed />

      {/* GND indication */}
      <BleedGnd />

      {/* APU */}
      <BleedApu isPack1Operative={isPack1Operative} isPack2Operative={isPack2Operative} />
    </>
  );
};
