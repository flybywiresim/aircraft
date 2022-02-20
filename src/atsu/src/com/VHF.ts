//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@shared/MathUtils';

/*
 * Interface to get all NPC traffic
 */
interface NPCPlane {
    name: string,
    uId: number,
    lat: number,
    lon: number,
    alt: number,
    heading: number
}

class Aircraft {
    public Latitude = 0.0;

    public Longitude = 0.0;

    public Altitude = 0.0;
}

class OwnAircraft extends Aircraft {
    public AltitudeAboveGround = 0.0;

    public PressureAltitude = 0.0;
}

class RemoteAircraft extends Aircraft {
    public UniqueId = '';

    public Seen = false;

    constructor(traffic: NPCPlane) {
        super();
        this.UniqueId = traffic.uId.toFixed(0);
        this.Latitude = traffic.lat;
        this.Longitude = traffic.lon;
        this.Altitude = traffic.alt;
    }
}

class Airport {
    public Latitude = 0.0;

    public Longitude = 0.0;

    public Icao = 0.0;
}

/*
 * Simulates the physical effects of the VHF communication
 * - Aircrafts and stations in the area are taken into acount
 * - Altitude and therefore a simulated multi-path reflection is simulated
 */
export class Vhf {
    // worldwide international airports
    // assumptions: international airports provide VHDL communication (i.e. USA)
    // not perfectly realistic, but realistic enough for a frequency occupancy calculation
    private static VhfDatalinkAirports: string[] = [
        'DAUA', 'DAAG', 'DABB', 'DABT', 'DAAE', 'DAUB', 'DAOI', 'DABC', 'DAUH', 'DAAV', 'DAOO', 'DAAS', 'DAAT', 'DAON', 'HEBA', 'HEAT', 'HESN', 'HECA',
        'HEAR', 'HEAL', 'HEGN', 'HELX', 'HEMA', 'HEMM', 'HESC', 'HESH', 'HEMK', 'HETB', 'HLLB', 'HLLS', 'HLLT', 'HLLM', 'GMAD', 'GMMN', 'GMFF', 'GMMX',
        'GMMW', 'GMFO', 'GMME', 'GMTT', 'GMTN', 'GMMH', 'GMML', 'HSSS', 'HSPN', 'DTTJ', 'DTNH', 'DTMB', 'DTTX', 'DTKA', 'DTTZ', 'DTTA', 'HBBA', 'FMCH',
        'HFFF', 'HHAS', 'HAAB', 'HADR', 'HKED', 'HKMO', 'HKKI', 'HKJK', 'FMMI', 'FMNA', 'FMNM', 'FMNN', 'FMMT', 'FMSD', 'FMST', 'FWCL', 'FWLI', 'FIMP',
        'FMCZ', 'FQMA', 'FQBR', 'FQIN', 'FQNP', 'FQPB', 'FQTT', 'FQVL', 'FMEE', 'HRYR', 'FSIA', 'HCMF', 'HCMH', 'HCMK', 'HCMM', 'HSSJ', 'HTAR', 'HTDA',
        'HTKJ', 'HTMW', 'HTZA', 'HUAR', 'HUEN', 'HUGU', 'FLLI', 'FLLS', 'FLND', 'FVHA', 'FVFA', 'FVBU', 'FNLU', 'FNUB', 'FKKD', 'FKYS', 'FEFF', 'FTTJ',
        'FZNA', 'FZAA', 'FZIC', 'FZQA', 'FCBB', 'FCPP', 'FGSL', 'FOON', 'FOOL', 'FOOG', 'FPST', 'DBBB', 'RKND', 'FXMM', 'FYWH', 'FYWB', 'FACT', 'FADN',
        'FAJS', 'FAKN', 'FABL', 'FAEL', 'FBSK', 'FBMN', 'FBFT', 'FBKE', 'DFOO', 'DFFD', 'GVBA', 'GVAC', 'GVFM', 'GVSV', 'DIAP', 'GBYD', 'DGAA', 'DGSI',
        'DGTK', 'DGSN', 'DGLW', 'DGLE', 'GUCY', 'GGOV', 'GGBU', 'GLRB', 'GABS', 'GQNN', 'GQPP', 'DRRN', 'DNAA', 'DNCA', 'DNAS', 'DNKN', 'DNMM', 'DNPO',
        'DNEN', 'DNSO', 'FHSH', 'GOBD', 'GFLL', 'DXXX', 'TQPF', 'TAPA', 'TNCA', 'MYNN', 'MYBC', 'MYEF', 'MYGF', 'MYER', 'TBPB', 'TUPJ', 'TNCB', 'TNCE',
        'TNCS', 'MWCB', 'MWCR', 'MUCM', 'MUOC', 'MUCL', 'MUCF', 'MUHA', 'MUHG', 'MUSC', 'MUCU', 'MUVR', 'TNCC', 'TDPD', 'MDBH', 'MDLR', 'MDPC', 'MDCY',
        'MDPP', 'MDST', 'MDSD', 'TGPY', 'TFFR', 'MTCH', 'MTPP', 'MKJP', 'MKJS', 'TFFF', 'TRPG', 'TJBQ', 'TJSJ', 'TFFJ', 'TKPK', 'TLPL', 'TVSV', 'TVSC',
        'TNCM', 'TTPP', 'TTCP', 'MBPV', 'TIST', 'TISX', 'MZBZ', 'MRLB', 'MROC', 'MSLP', 'MGTK', 'MGGT', 'MHLC', 'MHRO', 'MHLM', 'MHTG', 'MNMG', 'MNBL',
        'MNCI', 'MPBO', 'MPDA', 'MPTO', 'TXKF', 'CYXX', 'CYYC', 'CYEG', 'CYFC', 'CYQX', 'CYHZ', 'CYHM', 'CYLW', 'CYXU', 'CYQM', 'CYUL', 'CYOW', 'CYQB',
        'CYQR', 'CYXE', 'CYYT', 'CYQT', 'CYYZ', 'CYVR', 'CYYJ', 'CYXY', 'CYHA', 'CYWG', 'BGSF', 'BGGH', 'BGJN', 'BGBW', 'MMAA', 'MMAS', 'MMUN', 'MMCU',
        'MMCE', 'MMCZ', 'MMCL', 'MMDO', 'MMGL', 'MMHO', 'MMBT', 'MMZH', 'MMLO', 'MMLT', 'MMSD', 'MMZO', 'MMMZ', 'MMMD', 'MMMX', 'MMMY', 'MMMM', 'MMOX',
        'MMPB', 'MMPR', 'MMQT', 'MMRX', 'MMIO', 'MMSP', 'MMTM', 'MMTJ', 'MMTO', 'MMTC', 'MMTG', 'MMPN', 'MMVR', 'MMVA', 'MMZC', 'LFVP', 'KAKR', 'KALB',
        'KABQ', 'PANC', 'KATW', 'KATL', 'KACY', 'KAUS', 'KBWI', 'KBGR', 'KBLI', 'KBHM', 'KBOI', 'KBOS', 'KBUF', 'KCLT', 'KCHS', 'KMDW', 'KCVG', 'KCLE',
        'KCMH', 'KDFW', 'KDAY', 'KDEN', 'KDSM', 'KDTW', 'KELP', 'PAFA', 'KFLL', 'KRSW', 'KFAT', 'KGRR', 'KGRB', 'KGSO', 'KMDT', 'KBDL', 'PHTO', 'PHNL',
        'KIAH', 'KHSV', 'KIND', 'KJAN', 'KJAX', 'PAJN', 'KMCI', 'PAKT', 'KEYW', 'PHKO', 'KTYS', 'KLAL', 'KLAN', 'KLAS', 'KLIT', 'KLAX', 'KSDF', 'KMLB',
        'KMEM', 'KMIA', 'KMAF', 'KMKE', 'KMSP', 'KMYR', 'KBNA', 'KMSY', 'KJFK', 'KEWR', 'KSWF', 'KORF', 'KOAK', 'KOKC', 'KOMA', 'KONT', 'KSNA', 'KMCO',
        'KSFB', 'KPSP', 'KECP', 'KPNS', 'KPHL', 'KPHX', 'KIWA', 'KPIT', 'KPWM', 'KPDX', 'KPVD', 'KRAC', 'KRDU', 'KRNO', 'KRIC', 'KRST', 'KROC', 'KRFD',
        'KSMF', 'KSLC', 'KSAT', 'KSBD', 'KSAN', 'KSFO', 'KSJC', 'KSRQ', 'KSAV', 'KSBM', 'KPAE', 'KGEG', 'KSTL', 'KPIE', 'KSYR', 'KTLH', 'KTPA', 'KTUS',
        'KTUL', 'KDCA', 'KPBI', 'KAVP', 'KILM', 'SAEZ', 'SAZS', 'SACO', 'SAME', 'SARI', 'SARE', 'SAWG', 'SAWH', 'SLLP', 'SLVR', 'SLCB', 'SBAR', 'SBBE',
        'SBCF', 'SBBV', 'SBBR', 'SBKP', 'SBCG', 'SBCY', 'SBCT', 'SBFL', 'SBFZ', 'SBFI', 'SBGO', 'SBJP', 'SBMO', 'SBEG', 'SBNT', 'SBPL', 'SBPA', 'SBPV',
        'SBRF', 'SBRB', 'SBGL', 'SBSV', 'SBSL', 'SBSP', 'SBTE', 'SBUL', 'SBVT', 'SCFA', 'SCIE', 'SCTE', 'SCCI', 'SCEL', 'SKAR', 'SKBQ', 'SKBO', 'SKBG',
        'SKBU', 'SKCL', 'SKCG', 'SKCC', 'SKIB', 'SKIP', 'SKFL', 'SKLT', 'SKAO', 'SKMZ', 'SKRG', 'SKMU', 'SKMR', 'SKNV', 'SKPS', 'SKPE', 'SKPP', 'SKPV',
        'SKUI', 'SKRH', 'SKSP', 'SKTL', 'SKCO', 'SKSM', 'SKCZ', 'SKVP', 'SKVV', 'SKYP', 'SECU', 'SETN', 'SEGU', 'SERO', 'SEMT', 'SEQU', 'SETU', 'EGYP',
        'SOCA', 'SYCJ', 'SGAS', 'SGES', 'SPQU', 'SPZO', 'SPIM', 'SMJP', 'SUMU', 'SULS', 'SURV', 'SVMI', 'SVMC', 'SVVA', 'UATE', 'UATT', 'UAAA', 'UATG',
        'UAKK', 'UACK', 'UAUU', 'UAOO', 'UACC', 'UARR', 'UASK', 'UASP', 'UACP', 'UASS', 'UAII', 'UADD', 'UAFM', 'UCFL', 'UAFO', 'UTDT', 'UTDD', 'UTDL',
        'UTDK', 'UTAA', 'UTAT', 'UTAM', 'UTAK', 'UTAV', 'UTFA', 'UTSB', 'UTKF', 'UTSL', 'UTFN', 'UTSA', 'UTNN', 'UTSS', 'UTTT', 'UTST', 'UTNU', 'ZKPY',
        'RJSK', 'RJSA', 'RJFF', 'RJCH', 'RJFK', 'RJNK', 'RJOA', 'RJFR', 'RJFU', 'ROAH', 'RJGG', 'RJSN', 'RJFO', 'RJOB', 'RJBB', 'RJCC', 'RJSS', 'RJNS',
        'RJTT', 'RJAA', 'ZMUB', 'ZBOW', 'ZGBH', 'ZBAA', 'ZYCC', 'ZGHA', 'ZSCG', 'ZUUU', 'ZUCK', 'ZYTL', 'ZYDD', 'ZBDT', 'ZLDH', 'ZHES', 'ZSFZ', 'ZSGZ',
        'ZGGG', 'ZGKL', 'ZUGY', 'ZJHK', 'ZSHC', 'ZYHB', 'ZSOF', 'ZYHE', 'ZBHH', 'ZSSH', 'ZSTX', 'ZBLA', 'ZYJM', 'ZGOW', 'ZSJN', 'ZPPP', 'ZLAN', 'ZULS',
        'ZSLG', 'ZPLJ', 'ZSLY', 'ZHLY', 'ZPMS', 'ZBMZ', 'ZGMX', 'ZYMD', 'ZSCN', 'ZSNJ', 'ZGNN', 'ZSNT', 'ZSNB', 'ZBDS', 'ZSQD', 'ZBDH', 'ZYQQ', 'ZSQZ',
        'ZGSY', 'ZSSS', 'ZYTX', 'ZGSZ', 'ZBSJ', 'ZBYN', 'ZBTJ', 'ZWWW', 'ZUWX', 'ZSWH', 'ZSWZ', 'ZHHH', 'ZSWX', 'ZSWY', 'ZSAM', 'ZLXY', 'ZLXN', 'ZBXZ',
        'ZPJH', 'ZSXZ', 'ZSYN', 'ZSYA', 'ZYYJ', 'ZSYT', 'ZHYC', 'ZLIC', 'ZSYW', 'ZBYC', 'ZGDY', 'ZGZJ', 'ZHCC', 'ZGSD', 'ZUZY', 'VHHH', 'VMMC', 'RCYU',
        'RCKH', 'RCMQ', 'RCNN', 'RCSS', 'RCTP', 'RKPK', 'RKTN', 'RKPC', 'RKSS', 'RKSI', 'RKTU', 'RKJB', 'RKNY', 'VGEG', 'VGHS', 'VGSY', 'VQPR', 'VEAT',
        'VAAH', 'VIAR', 'VOBG', 'VEBS', 'VOMM', 'VOCB', 'VIDP', 'VAGO', 'VEGY', 'VEGT', 'VOHY', 'VEIM', 'VAID', 'VIJP', 'UELL', 'VOCI', 'VECC', 'VOCL',
        'VILK', 'VOMD', 'VOML', 'VABB', 'VANP', 'VAPO', 'VEBD', 'VISR', 'VASU', 'VOTV', 'VOTR', 'VABO', 'VIBN', 'VOBZ', 'VEVZ', 'VRMM', 'VRMG', 'VRMH',
        'VNKT', 'OPBW', 'OPFA', 'OPGD', 'OPRN', 'OPKC', 'OPLA', 'OPMT', 'OPPS', 'OPQT', 'OPRK', 'OPST', 'OPTU', 'VCBI', 'VCRI', 'VCCJ', 'WBSB', 'VDPP',
        'VDSR', 'VDSV', 'WPDL', 'WALL', 'WITT', 'WIIT', 'WIIB', 'WRBB', 'WADY', 'WIKB', 'WABB', 'WADD', 'WIIH', 'WRKK', 'WAAA', 'WAMM', 'WADL', 'WIMM',
        'WIPT', 'WIPP', 'WIBB', 'WIOO', 'WIIS', 'WIMN', 'WRSJ', 'WRSQ', 'WIKD', 'WRLR', 'WAHI', 'VLLB', 'VLPS', 'VLSK', 'VLVT', 'WMKA', 'WMKI', 'WMKJ',
        'WMKC', 'WBKK', 'WMKK', 'WMKN', 'WMKD', 'WBGG', 'WMKL', 'WMKP', 'WMSA', 'VYCZ', 'VYYY', 'VYNT', 'RPUO', 'RPLH', 'RPVM', 'RPLC', 'RPMD', 'RPMR',
        'RPVI', 'RPVK', 'RPLI', 'RPLL', 'RPVT', 'RPVP', 'RPLB', 'RPMZ', 'WSSS', 'VTBD', 'VTBD', 'VTCC', 'VTCT', 'VTUD', 'VTSS', 'VTSG', 'VTSP', 'VTSB',
        'VTSM', 'VTUD', 'VVDN', 'VVNB', 'VVTS', 'VVCT', 'VVCI', 'VVPB', 'VVPQ', 'VVCR', 'VVCA', 'OAKB', 'OAHR', 'OAKN', 'OAMS', 'OBBI', 'OIAA', 'OIAW',
        'OIHR', 'OITL', 'OIBP', 'OIKB', 'OIMB', 'OIBB', 'OING', 'OIHH', 'OICI', 'OIFM', 'OIKK', 'OICC', 'OIBK', 'OIZC', 'OISR', 'OISL', 'OIMM', 'OIKQ',
        'OIGG', 'OINZ', 'OISS', 'OITT', 'OIIE', 'OITR', 'OIYY', 'OIZH', 'ORNI', 'ORBI', 'ORMM', 'ORER', 'ORBM', 'ORTL', 'ORSU', 'LLER', 'LLHA', 'LLBG',
        'OJAQ', 'OJAI', 'OKBK', 'OLBA', 'OOMS', 'OOSA', 'OOSH', 'OTBD', 'OEAB', 'OEAH', 'OESK', 'OEGS', 'OEDF', 'OEHL', 'OEJN', 'OEGN', 'OEMA', 'OENG',
        'OERK', 'OETB', 'OETF', 'OEYN', 'OSAP', 'OSDI', 'OSLK', 'OSKL', 'OMAA', 'OMAL', 'OMDW', 'OMRK', 'OMSJ', 'OYAA', 'OYSN', 'OYSY', 'EBAW', 'EBBR',
        'EBCI', 'EBLG', 'EBOS', 'LFKJ', 'LFKB', 'LFOB', 'LFBE', 'LFMU', 'LFBZ', 'LFBD', 'LFRB', 'LFMK', 'LFOK', 'LFLB', 'LFRD', 'LFKF', 'LFLS', 'LFBH',
        'LFQQ', 'LFBL', 'LFLL', 'LFML', 'LFSB', 'LFRS', 'LFMN', 'LFTW', 'LFPG', 'LFBP', 'LFMP', 'LFBI', 'LFCR', 'LFMH', 'LFST', 'LFTH', 'LFBO', 'LFOT',
        'LXGB', 'EGJA', 'EGJB', 'EGJJ', 'EICK', 'EIDW', 'EIKY', 'EIKN', 'EINN', 'EGNS', 'ELLX', 'EHAM', 'EHEH', 'EHGG', 'EHBK', 'EHRD', 'LOWG', 'LOWK',
        'LOWI', 'LOWL', 'LOWS', 'LOWW', 'LKTB', 'LKKV', 'LKMT', 'LKPR', 'LKPD', 'EDSB', 'EDDB', 'EDDW', 'EDDK', 'EDLW', 'EDDL', 'EDDF', 'EDNY', 'EDDH',
        'EDDV', 'EDDP', 'EDHL', 'EDJA', 'EDDM', 'EDDN', 'EDDS', 'EDLV', 'LHBP', 'LHDC', 'LHSM', 'LHPR', 'LZIB', 'LZKZ', 'LZPP', 'LZTT', 'LZSL', 'LZZI',
        'LFSB', 'LSZB', 'LSGG', 'LSZA', 'LSZR', 'LSZH', 'EPBY', 'EPGD', 'EPKT', 'EPKK', 'EPLB', 'EPLL', 'EPPO', 'EPRZ', 'EPSC', 'EPWA', 'EPWR', 'LDSB',
        'LDDU', 'LDLO', 'LDOS', 'LDPL', 'LDRI', 'LDSP', 'LDZD', 'LDZA', 'LCLK', 'LCPH', 'LCEN', 'LGAV', 'LGKF', 'LGSA', 'LGHI', 'LGKR', 'LGIR', 'LGKL',
        'LGKP', 'LGKV', 'LGKO', 'LGMK', 'LGMT', 'LGPZ', 'LGRP', 'LGSM', 'LGSR', 'LGSK', 'LGSY', 'LGTS', 'LGBL', 'LGZA', 'LIEA', 'LIPY', 'LIBD', 'LIME',
        'LIPE', 'LIPO', 'LIBR', 'LIEE', 'LICC', 'LIMZ', 'LIRQ', 'LIMJ', 'LICA', 'LIML', 'LIRN', 'LIEO', 'LICJ', 'LIMP', 'LIRZ', 'LIBP', 'LIRP', 'LIPR',
        'LIRF', 'LICT', 'LIPQ', 'LIMF', 'LIPZ', 'LIPX', 'LMML', 'LPBJ', 'LPFR', 'LPMA', 'LPPS', 'LPPT', 'LPPR', 'LPPD', 'LPLA', 'LJLJ', 'LJMB', 'LJPZ',
        'LECO', 'LEAL', 'LEAM', 'LEAS', 'LEBL', 'LEBB', 'LECS', 'GCFV', 'LEGE', 'GCLP', 'LEGR', 'LEHC', 'LEIB', 'LEJR', 'GCLA', 'GCRR', 'LEDA', 'LEMD',
        'LEMG', 'LEMH', 'LEMI', 'LEPA', 'LEPP', 'LERS', 'LEXJ', 'LEST', 'LEZL', 'GCXO', 'LEVC', 'LEVD', 'LEVX', 'LEVT', 'LEZG', 'LATI', 'LAKU', 'UGEE',
        'UDSG', 'UBBB', 'UBBG', 'UBBN', 'UBBQ', 'UBBL', 'UBBY', 'UMMG', 'UMGG', 'UMMS', 'LQBK', 'LQSA', 'LQTZ', 'LQMO', 'LBBG', 'LBPD', 'LBSF', 'LBWN',
        'EETN', 'EETU', 'UGSB', 'UGKO', 'UGSS', 'UGGG', 'LYPR', 'EVRA', 'EVVA', 'EYKA', 'EYPA', 'EYSA', 'EYVI', 'LUKK', 'LRAR', 'LRBC', 'LRBM', 'LROP',
        'LRCL', 'LRCK', 'LRCV', 'LRIA', 'LROD', 'LRSM', 'LRSB', 'LRSV', 'LRTM', 'LRTR', 'LYPG', 'LYTV', 'LWOH', 'LWSK', 'UNAA', 'UHMA', 'URKA', 'ULAA',
        'URWA', 'UNBB', 'UUOB', 'UHBB', 'UIBB', 'UUBP', 'UWKS', 'USCC', 'ULWC', 'UIAA', 'URWI', 'UUII', 'URMG', 'UMKK', 'UWKD', 'UHHH', 'UHKK', 'URKK',
        'UNKL', 'UUOK', 'UHMM', 'USCM', 'URML', 'URMM', 'UUDD', 'ULMM', 'URMN', 'USNN', 'UWKE', 'UWGG', 'UNWW', 'UNNT', 'UNOO', 'UWOO', 'UWOR', 'USPP',
        'ULPB', 'UHMD', 'UHPP', 'ULOO', 'URRR', 'ULLI', 'UWWW', 'URSS', 'URMT', 'USRR', 'UUYY', 'UNTT', 'USTR', 'UIUU', 'UWLL', 'UWUU', 'UHWW', 'URMO',
        'URWW', 'UUOO', 'UEEE', 'UUDL', 'USSS', 'UHSS', 'LYBE', 'LYNI', 'LYKV', 'LTAF', 'LTFG', 'LTAC', 'LTAI', 'LTFE', 'LTBR', 'LTBS', 'LTAY', 'LTCC',
        'LTCA', 'LTAJ', 'LTBA', 'LTBJ', 'LTAU', 'LTAN', 'LTBZ', 'LTAT', 'LTAZ', 'LTFH', 'LTCG', 'LTAS', 'UKLN', 'UKDD', 'UKLI', 'UKHH', 'UKDR', 'UKBB',
        'UKLL', 'UKON', 'UKOO', 'UKHP', 'UKFF', 'UKLU', 'UKDE', 'EKYT', 'EKAH', 'EKBI', 'EKCH', 'EKVG', 'EFMA', 'EFHK', 'EFKT', 'EFKU', 'EFKS', 'EFLP',
        'EFOU', 'EFRO', 'EFTP', 'EFTU', 'EFVA', 'BIAR', 'BIKF', 'ENAL', 'ENBR', 'ENBO', 'ENHD', 'ENCN', 'ENGM', 'ENZV', 'ENTC', 'ENVA', 'ESGG', 'ESPA',
        'ESMS', 'ESSP', 'ESPC', 'ESSA', 'ESNN', 'ESNU', 'ESMX', 'ESSV', 'EGBB', 'EGHH', 'EGGD', 'EGFF', 'EGCN', 'EGNV', 'EGNX', 'EGTE', 'EGNM', 'EGGP',
        'EGLC', 'EGCC', 'EGNT', 'EGDQ', 'EGSH', 'EGHI', 'EGPD', 'EGPH', 'EGPF', 'EGPE', 'EGAA', 'EGAE', 'NSTU', 'YPAD', 'YBBN', 'YBRM', 'YBCS', 'YSCB',
        'YPDN', 'YAVV', 'YBCG', 'YMHB', 'YMML', 'YWLM', 'YPPH', 'YPPD', 'YBMC', 'YSSY', 'YBTL', 'YPXM', 'YPCC', 'NCRG', 'SCIP', 'NFFN', 'NFNA', 'NTAA',
        'PGUM', 'PLCH', 'NGTA', 'PKWA', 'PKMJ', 'PTKK', 'PTSA', 'PTPN', 'PTYA', 'ANAU', 'NWWW', 'NZAA', 'NZCH', 'NZQN', 'NZWN', 'YSNF', 'PGRO', 'PGSN',
        'PGWT', 'NIUE', 'PTRO', 'AYPY', 'AYMH', 'NSFA', 'AGGH', 'NFTF', 'NFTV', 'NGFU', 'NVSS', 'NVVV', 'NLWF', 'NLWW'];

    private static MaxDatalinkDistance = 200;

    private static MaxAirportsInRange = 50;

    private presentPosition: OwnAircraft = new OwnAircraft();

    private airportsInRange: Airport[] = [];

    private aircraftsInRange: RemoteAircraft[] = [];

    constructor() {
        this.updatePresentPosition();
        this.updateRelevantAirports();
        this.updateRemoteAircrafts();

        console.log(`Relevant airports: ${this.aircraftsInRange.length}`);
        console.log(`Relevant aircrafts: ${this.aircraftsInRange.length}`);
    }

    private updatePresentPosition() {
        this.presentPosition.Latitude = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        this.presentPosition.Longitude = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
        this.presentPosition.Altitude = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
        this.presentPosition.AltitudeAboveGround = SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND', 'feet');
        this.presentPosition.PressureAltitude = SimVar.GetSimVarValue('INDICATED ALTITUDE:3', 'feet');
    }

    private maximumDistanceLoS(altitude: number): number {
        // use a simple line of sight algorithm to calculate the maximum distance
        // it ignores the topolography, but simulates the earth curvature
        // reference: https://audio.vatsim.net/storage/AFV%20User%20Guide.pdf
        let distance = 1.23 * Math.sqrt(Math.abs(this.presentPosition.PressureAltitude - altitude));
        if (distance > Vhf.MaxDatalinkDistance) {
            distance = Vhf.MaxDatalinkDistance;
        }
        return distance;
    }

    private async updateRelevantAirports(): Promise<void> {
        this.airportsInRange = [];

        // prepare the request with the information
        const requestBatch = new SimVar.SimVarBatch('C:fs9gps:NearestAirportItemsNumber', 'C:fs9gps:NearestAirportCurrentLine');
        requestBatch.add('C:fs9gps:NearestAirportSelectedLatitude', 'degree latitude');
        requestBatch.add('C:fs9gps:NearestAirportSelectedLongitude', 'degree longitude');
        requestBatch.add('C:fs9gps:NearestAirportCurrentICAO', 'string', 'string');
        requestBatch.add('C:fs9gps:WaypointAirportElevation', 'feet');

        const acLat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        const acLon = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

        await SimVar.SetSimVarValue('C:fs9gps:NearestAirportCurrentLatitude', 'degree latitude', acLat);
        await SimVar.SetSimVarValue('C:fs9gps:NearestAirportCurrentLongitude', 'degree longitude', acLon);
        await SimVar.SetSimVarValue('C:fs9gps:NearestAirportMaximumItems', 'number', Vhf.MaxAirportsInRange);
        await SimVar.SetSimVarValue('C:fs9gps:NearestAirportMaximumDistance', 'nautical miles', Vhf.MaxDatalinkDistance);

        // get all airports
        SimVar.GetSimVarArrayValues(requestBatch, (airports) => {
            airports.forEach((fetched) => {
                // found an international airport
                if (Vhf.VhfDatalinkAirports.findIndex((elem) => elem === fetched[2])) {
                    // use a simple line of sight algorithm to calculate the maximum distance
                    // it ignores the topolography, but simulates the earth curvature
                    // reference: https://audio.vatsim.net/storage/AFV%20User%20Guide.pdf
                    const maxDistance = 1.23 * Math.sqrt(Math.abs(this.presentPosition.PressureAltitude - fetched[3]));
                    const distance = MathUtils.computeDistance3D(fetched[0], fetched[1], fetched[3],
                        this.presentPosition.Latitude, this.presentPosition.Longitude, this.presentPosition.PressureAltitude);

                    if (maxDistance >= distance) {
                        const airport = new Airport();
                        airport.Latitude = fetched[0];
                        airport.Longitude = fetched[1];
                        airport.Icao = fetched[2];

                        this.airportsInRange.push(airport);
                    }
                }
            });
        });
    }

    private async updateRemoteAircrafts(): Promise<void> {
        await Coherent.call('GET_AIR_TRAFFIC').then((obj: NPCPlane[]) => {
            this.aircraftsInRange.forEach((aircraft) => aircraft.Seen = false);

            obj.forEach((traffic) => {
                // skip invalid aircraft
                if (!traffic.lat || !traffic.lon || !traffic.alt || !traffic.uId) {
                    return;
                }

                let aircraft: RemoteAircraft | undefined = this.aircraftsInRange.find((elem) => elem && elem.UniqueId === traffic.uId.toFixed(0));
                if (!aircraft) {
                    aircraft = new RemoteAircraft(traffic);
                    this.aircraftsInRange.push(aircraft);
                }

                aircraft.Seen = true;
            });

            if (obj.length !== 0) {
                this.aircraftsInRange = this.aircraftsInRange.filter((aircraft) => {
                    if (aircraft.Seen === true) {
                        const distance = MathUtils.computeDistance3D(aircraft.Latitude, aircraft.Longitude, aircraft.Altitude,
                            this.presentPosition.Latitude, this.presentPosition.Longitude, this.presentPosition.PressureAltitude);
                        return distance <= Vhf.MaxDatalinkDistance;
                    }
                    return false;
                });
            }

            return obj.length !== 0;
        });
    }
}
