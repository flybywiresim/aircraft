import React from 'react';
import { PageTitle } from '../Generic/PageTitle';
import BleedEngine from './elements/BleedEngine';
import BleedPack from './elements/BleedPack';
import BleedCrossbleed from './elements/BleedCrossbleed';
import BleedApu from './elements/BleedApu';
import BleedHotAir from './elements/BleedHotAir';
import BleedMixerUnit from './elements/BleedMixerUnit';

import '../../../index.scss';

export const BleedPage = () => {
  const sdacDatum = true;

  return (
    <>
      <PageTitle x={6} y={29}>
        BLEED
      </PageTitle>

      <BleedMixerUnit x={384} y={30} sdacDatum={sdacDatum} />

      <text x={344} y={70} className="White F23 MiddleAlign">
        RAM
      </text>
      <text x={404} y={70} className="White F23 MiddleAlign">
        AIR
      </text>

      {/* Hot Air */}
      <BleedHotAir x={238} y={204} hotAir={1} sdacDatum={sdacDatum} />
      <BleedHotAir x={514} y={204} hotAir={2} sdacDatum={sdacDatum} />

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
      <BleedPack x={115} y={90} pack={1} />
      <BleedPack x={525} y={90} pack={2} />

      {/* Crossbleed */}
      <BleedCrossbleed />

      {/* APU */}
      <BleedApu />
    </>
  );
};
