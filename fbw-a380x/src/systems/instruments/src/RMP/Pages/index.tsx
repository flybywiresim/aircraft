import { VhfPage } from './VhfPage';
import { HfPage } from './HfPage';
import { SqwkPage } from './SqwkPage';
import { TelPage } from './TelPage';
import { MenuPage } from './Menu/MenuPage';
import { NavPage } from './NavPage';
import { DatalinkRouterPage } from './Menu/Datalink/DatalinkRouterPage';

export const Pages = {
    Vhf: VhfPage,
    Hf: HfPage,
    Tel: TelPage,
    Sqwk: SqwkPage,
    Menu: {
        index: MenuPage,
        DatalinkRouter: DatalinkRouterPage,
    },
    Nav: NavPage,
};
