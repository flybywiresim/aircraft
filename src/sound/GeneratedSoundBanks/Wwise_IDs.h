/////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Audiokinetic Wwise generated include file. Do not edit.
//
/////////////////////////////////////////////////////////////////////////////////////////////////////

#ifndef __WWISE_IDS_H__
#define __WWISE_IDS_H__

#include <AK/SoundEngine/Common/AkTypes.h>

namespace AK
{
    namespace EVENTS
    {
        static const AkUniqueID PLAY_ASOBO_A320_NEO_AVVENT = 3576698749U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_AVVENTLOOP = 2141756415U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_BATRELAY = 4189686749U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_BETTERWIND = 2383051621U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_CABIN_CREW_SEATS_LANDING = 2291548167U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_CABIN_CREW_SEATS_TAKEOFF = 548293890U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_CIDSCHIMES = 1054525165U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_COCKPIT_CABIN_CALL_AFT = 1216914367U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_COCKPIT_CABIN_CALL_FWD = 1199592215U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_CRC = 2836225853U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_FMGCTEST = 2883622772U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_FUELPUMP = 3063011407U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_GEARDOWNWIND = 1163974770U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_GROLL = 3751190317U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_IMPROVED_TONE_CAUTION = 39660050U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_LIGHT_SWITCH_SEATBELT = 1143436301U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_LOUDRELAY = 2822123028U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_NWHEELSPINABOVEGROUND = 886207320U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_ROLLRATTLE = 276993210U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_ROLLRATTLE2 = 3079676156U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_STARTBEEP = 2328628459U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_TAXIBUMP = 2692782905U;
        static const AkUniqueID PLAY_ASOBO_A320_NEO_TAXIRATTLE = 2073073335U;
    } // namespace EVENTS

    namespace STATES
    {
        namespace ACTIVITIES_FLOW_STATE
        {
            static const AkUniqueID GROUP = 501856623U;

            namespace STATE
            {
                static const AkUniqueID BUSHTRIP = 2251871486U;
                static const AkUniqueID COMMERCIAL_FLIGHT = 3750132932U;
                static const AkUniqueID FREE_FLIGHT = 2378245948U;
                static const AkUniqueID LANDING_CHALLENGE = 2995574756U;
                static const AkUniqueID NAT_GEO = 636895100U;
                static const AkUniqueID NONE = 748895195U;
                static const AkUniqueID PRIVATE_FLIGHT = 2288825991U;
                static const AkUniqueID SIGHTING = 2742496556U;
                static const AkUniqueID TUTORIAL = 3762955427U;
                static const AkUniqueID VFR_CHALLENGE = 897584739U;
            } // namespace STATE
        } // namespace ACTIVITIES_FLOW_STATE

        namespace DEFAULT_FLOW_STATE
        {
            static const AkUniqueID GROUP = 2682214721U;

            namespace STATE
            {
                static const AkUniqueID BOOT = 1761500993U;
                static const AkUniqueID ENDLEVEL = 1054659462U;
                static const AkUniqueID GAME = 702482391U;
                static const AkUniqueID LOADING_BOOT = 1928657066U;
                static const AkUniqueID LOADING_TO_GAME = 2930658582U;
                static const AkUniqueID LOADING_TO_MENU = 1571531645U;
                static const AkUniqueID MENU = 2607556080U;
                static const AkUniqueID NONE = 748895195U;
                static const AkUniqueID PAUSE = 3092587493U;
            } // namespace STATE
        } // namespace DEFAULT_FLOW_STATE

        namespace ENDLEVEL_FLOW_STATE
        {
            static const AkUniqueID GROUP = 1614915587U;

            namespace STATE
            {
                static const AkUniqueID NONE = 748895195U;
                static const AkUniqueID REWARD_SCREEN_CRASH = 962446319U;
                static const AkUniqueID REWARD_SCREEN_DEFAULT = 3213183853U;
                static const AkUniqueID REWARD_SCREEN_FAILED = 1552746105U;
                static const AkUniqueID REWARD_SCREEN_NONE = 2568653936U;
                static const AkUniqueID REWARD_SCREEN_WON = 1985034998U;
            } // namespace STATE
        } // namespace ENDLEVEL_FLOW_STATE

        namespace GAME_FLOW_STATE
        {
            static const AkUniqueID GROUP = 1775417280U;

            namespace STATE
            {
                static const AkUniqueID APPROACH = 2291412309U;
                static const AkUniqueID CLIMB = 1819394456U;
                static const AkUniqueID CRUISE = 856143216U;
                static const AkUniqueID DESCENT = 1596760925U;
                static const AkUniqueID FINAL = 565529991U;
                static const AkUniqueID FREEFLIGHT = 407484361U;
                static const AkUniqueID GATE = 1121922920U;
                static const AkUniqueID GROUNDROLL = 3015851369U;
                static const AkUniqueID HOLDSHORT = 1325762608U;
                static const AkUniqueID INTRO = 1125500713U;
                static const AkUniqueID NONE = 748895195U;
                static const AkUniqueID PUSHBACK = 981942172U;
                static const AkUniqueID RUNWAY = 3965271245U;
                static const AkUniqueID TAXI = 2837639985U;
                static const AkUniqueID TOUCHDOWN = 1857823434U;
            } // namespace STATE
        } // namespace GAME_FLOW_STATE

        namespace GAME_RTC_STATE
        {
            static const AkUniqueID GROUP = 926009373U;

            namespace STATE
            {
                static const AkUniqueID NON_RTC = 1761167878U;
                static const AkUniqueID NONE = 748895195U;
                static const AkUniqueID RTC = 728939322U;
                static const AkUniqueID RTC_IN_FLIGHT = 1591940009U;
            } // namespace STATE
        } // namespace GAME_RTC_STATE

        namespace MENU_FLOW_STATE
        {
            static const AkUniqueID GROUP = 4018043625U;

            namespace STATE
            {
                static const AkUniqueID ACTIVITIES = 4020296482U;
                static const AkUniqueID ADDONS = 2557865568U;
                static const AkUniqueID HANGAR = 2192450996U;
                static const AkUniqueID HOMEPAGE = 3448223925U;
                static const AkUniqueID LOGO = 556785088U;
                static const AkUniqueID MAIN = 3161908922U;
                static const AkUniqueID MARKET = 1313304937U;
                static const AkUniqueID NONE = 748895195U;
                static const AkUniqueID OPTIONS = 4141130937U;
                static const AkUniqueID PRESSSTART = 3540125970U;
                static const AkUniqueID PROFILE = 4126331248U;
                static const AkUniqueID SHOWCASE = 2056233290U;
                static const AkUniqueID WORLDMAP = 482361971U;
            } // namespace STATE
        } // namespace MENU_FLOW_STATE

        namespace VIEWPOINT
        {
            static const AkUniqueID GROUP = 4185053780U;

            namespace STATE
            {
                static const AkUniqueID INSIDE = 3553349781U;
                static const AkUniqueID NONE = 748895195U;
                static const AkUniqueID OUTSIDE = 438105790U;
            } // namespace STATE
        } // namespace VIEWPOINT

    } // namespace STATES

    namespace SWITCHES
    {
        namespace AILERON_LEFT_MOVEMENT
        {
            static const AkUniqueID GROUP = 350724691U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace AILERON_LEFT_MOVEMENT

        namespace AILERON_RIGHT_MOVEMENT
        {
            static const AkUniqueID GROUP = 1845612916U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace AILERON_RIGHT_MOVEMENT

        namespace CANOPY_MOVEMENT
        {
            static const AkUniqueID GROUP = 3568692327U;

            namespace SWITCH
            {
                static const AkUniqueID CLOSE = 1451272583U;
                static const AkUniqueID OPEN = 3072142513U;
            } // namespace SWITCH
        } // namespace CANOPY_MOVEMENT

        namespace COWLFLAPS_LEVER_POSITION
        {
            static const AkUniqueID GROUP = 1891174899U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace COWLFLAPS_LEVER_POSITION

        namespace ELEVATOR_MOVEMENT
        {
            static const AkUniqueID GROUP = 2775976461U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace ELEVATOR_MOVEMENT

        namespace EXIT_DOOR_DIRECTION
        {
            static const AkUniqueID GROUP = 2856463398U;

            namespace SWITCH
            {
                static const AkUniqueID CLOSE = 1451272583U;
                static const AkUniqueID OPEN = 3072142513U;
            } // namespace SWITCH
        } // namespace EXIT_DOOR_DIRECTION

        namespace EXIT_DOOR_MOVEMENTS
        {
            static const AkUniqueID GROUP = 3861039171U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace EXIT_DOOR_MOVEMENTS

        namespace FLAPS_LEFT_MOVE_GENERIC
        {
            static const AkUniqueID GROUP = 3436671897U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace FLAPS_LEFT_MOVE_GENERIC

        namespace FLAPS_LEFT_UP_DOWN
        {
            static const AkUniqueID GROUP = 2519629830U;

            namespace SWITCH
            {
                static const AkUniqueID DOWN = 2280510569U;
                static const AkUniqueID UP = 1551306158U;
            } // namespace SWITCH
        } // namespace FLAPS_LEFT_UP_DOWN

        namespace FLAPS_LEVER_DIRECTION
        {
            static const AkUniqueID GROUP = 1235872788U;

            namespace SWITCH
            {
                static const AkUniqueID DROP = 1878686274U;
                static const AkUniqueID RAISE = 2112858883U;
            } // namespace SWITCH
        } // namespace FLAPS_LEVER_DIRECTION

        namespace FLAPS_LEVER_MOVEMENT
        {
            static const AkUniqueID GROUP = 1551376142U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace FLAPS_LEVER_MOVEMENT

        namespace FLAPS_LEVER_POSITION
        {
            static const AkUniqueID GROUP = 4014844960U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace FLAPS_LEVER_POSITION

        namespace FLAPS_RIGHT_MOVE_GENERIC
        {
            static const AkUniqueID GROUP = 1300675030U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace FLAPS_RIGHT_MOVE_GENERIC

        namespace FLAPS_RIGHT_UP_DOWN
        {
            static const AkUniqueID GROUP = 2784615739U;

            namespace SWITCH
            {
                static const AkUniqueID DOWN = 2280510569U;
                static const AkUniqueID UP = 1551306158U;
            } // namespace SWITCH
        } // namespace FLAPS_RIGHT_UP_DOWN

        namespace GEARS_DIRECTION
        {
            static const AkUniqueID GROUP = 2494887037U;

            namespace SWITCH
            {
                static const AkUniqueID DOWN = 2280510569U;
                static const AkUniqueID UP = 1551306158U;
            } // namespace SWITCH
        } // namespace GEARS_DIRECTION

        namespace GEARS_MOVEMENT
        {
            static const AkUniqueID GROUP = 1586167713U;

            namespace SWITCH
            {
                static const AkUniqueID MOVE = 3011204530U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace GEARS_MOVEMENT

        namespace LEFT_GEARS_DIRECTION
        {
            static const AkUniqueID GROUP = 2262607145U;

            namespace SWITCH
            {
                static const AkUniqueID DOWN = 2280510569U;
                static const AkUniqueID UP = 1551306158U;
            } // namespace SWITCH
        } // namespace LEFT_GEARS_DIRECTION

        namespace LEFT_GEARS_MOVEMENT
        {
            static const AkUniqueID GROUP = 3881857405U;

            namespace SWITCH
            {
                static const AkUniqueID MOVE = 3011204530U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace LEFT_GEARS_MOVEMENT

        namespace LEVER_REVERSE_THRUST
        {
            static const AkUniqueID GROUP = 1679529309U;

            namespace SWITCH
            {
                static const AkUniqueID OFF = 930712164U;
                static const AkUniqueID ON = 1651971902U;
            } // namespace SWITCH
        } // namespace LEVER_REVERSE_THRUST

        namespace LEVER_SPOILER_MOVEMENT
        {
            static const AkUniqueID GROUP = 2253536988U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace LEVER_SPOILER_MOVEMENT

        namespace MIXTURE_LEVER
        {
            static const AkUniqueID GROUP = 906889442U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace MIXTURE_LEVER

        namespace PARKING_BRAKE
        {
            static const AkUniqueID GROUP = 335191707U;

            namespace SWITCH
            {
                static const AkUniqueID PULL = 1908999728U;
                static const AkUniqueID PUSH = 1758001241U;
            } // namespace SWITCH
        } // namespace PARKING_BRAKE

        namespace PEDALS_MOVEMENT
        {
            static const AkUniqueID GROUP = 1677384734U;

            namespace SWITCH
            {
                static const AkUniqueID MOVE = 3011204530U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace PEDALS_MOVEMENT

        namespace PROPELLER_LEVER
        {
            static const AkUniqueID GROUP = 748307367U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace PROPELLER_LEVER

        namespace RIGHT_GEARS_DIRECTION
        {
            static const AkUniqueID GROUP = 3459523122U;

            namespace SWITCH
            {
                static const AkUniqueID DOWN = 2280510569U;
                static const AkUniqueID UP = 1551306158U;
            } // namespace SWITCH
        } // namespace RIGHT_GEARS_DIRECTION

        namespace RIGHT_GEARS_MOVEMENT
        {
            static const AkUniqueID GROUP = 4212759548U;

            namespace SWITCH
            {
                static const AkUniqueID MOVE = 3011204530U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace RIGHT_GEARS_MOVEMENT

        namespace RUDDER_MOVEMENT
        {
            static const AkUniqueID GROUP = 2685946057U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace RUDDER_MOVEMENT

        namespace SURFACES
        {
            static const AkUniqueID GROUP = 3714303081U;

            namespace SWITCH
            {
                static const AkUniqueID ASPHALT = 4169408098U;
                static const AkUniqueID BITUMINUS = 3546281853U;
                static const AkUniqueID BRICK = 504532776U;
                static const AkUniqueID CONCRETE = 841620460U;
                static const AkUniqueID CORAL = 2451973012U;
                static const AkUniqueID DIRT = 2195636714U;
                static const AkUniqueID ERASE_GRASS = 2290614330U;
                static const AkUniqueID FOREST = 491961918U;
                static const AkUniqueID GRASS = 4248645337U;
                static const AkUniqueID GRASS_BUMPY = 219065481U;
                static const AkUniqueID GRAVEL = 2185786256U;
                static const AkUniqueID HARD_TURF = 503175660U;
                static const AkUniqueID ICE = 344481046U;
                static const AkUniqueID LAKE = 624189772U;
                static const AkUniqueID LAST_FSX = 3544038123U;
                static const AkUniqueID LONG_GRASS = 931372080U;
                static const AkUniqueID MACADAM = 3546707615U;
                static const AkUniqueID OCEAN = 3802555985U;
                static const AkUniqueID OIL_TREATED = 2164569405U;
                static const AkUniqueID PAINT = 3046889023U;
                static const AkUniqueID PLANKS = 1434743578U;
                static const AkUniqueID POND = 1944232204U;
                static const AkUniqueID RIVER = 3605787649U;
                static const AkUniqueID SAND = 803837735U;
                static const AkUniqueID SHALE = 3087554060U;
                static const AkUniqueID SHORT_GRASS = 2721746886U;
                static const AkUniqueID SNOW = 787898836U;
                static const AkUniqueID STEEL_MATS = 3678910036U;
                static const AkUniqueID TARMAC = 3769881715U;
                static const AkUniqueID URBAN = 2997730343U;
                static const AkUniqueID WASTE_WATER = 4192073153U;
                static const AkUniqueID WATER = 2654748154U;
                static const AkUniqueID WATER_FSX = 2894837532U;
                static const AkUniqueID WRIGHT_FLYER_TRACK = 977851081U;
            } // namespace SWITCH
        } // namespace SURFACES

        namespace THROTTLE_LEVER_DERIVED
        {
            static const AkUniqueID GROUP = 3183153134U;

            namespace SWITCH
            {
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace THROTTLE_LEVER_DERIVED

        namespace THROTTLE_MOVEMENT
        {
            static const AkUniqueID GROUP = 3628534847U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace THROTTLE_MOVEMENT

        namespace WATER_RUDDER_MOVEMENT
        {
            static const AkUniqueID GROUP = 2757437141U;

            namespace SWITCH
            {
                static const AkUniqueID DOWN = 2280510569U;
                static const AkUniqueID UP = 1551306158U;
            } // namespace SWITCH
        } // namespace WATER_RUDDER_MOVEMENT

        namespace YOKE_X_MOVEMENT
        {
            static const AkUniqueID GROUP = 1844896876U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace YOKE_X_MOVEMENT

        namespace YOKE_Y_MOVEMENT
        {
            static const AkUniqueID GROUP = 2525670351U;

            namespace SWITCH
            {
                static const AkUniqueID MOVEMENT = 2129636626U;
                static const AkUniqueID STOP = 788884573U;
            } // namespace SWITCH
        } // namespace YOKE_Y_MOVEMENT

    } // namespace SWITCHES

    namespace GAME_PARAMETERS
    {
        static const AkUniqueID CAMERA_VIEWPOINT = 147416178U;
        static const AkUniqueID ENV_COCKPIT_INSULATION = 4194702645U;
        static const AkUniqueID ENV_DOPPLERCENTS = 3779073172U;
        static const AkUniqueID ENV_ELEVATION_AGL = 648297999U;
        static const AkUniqueID HEADPHONE_FILTER = 2920878614U;
        static const AkUniqueID HEADPHONE_IN_COCKPIT = 806364695U;
        static const AkUniqueID HEADPHONE_SWITCH = 4173551700U;
        static const AkUniqueID MIXER_AIRCRAFT_AI_VOLUME = 1324482047U;
        static const AkUniqueID MIXER_COCKPIT_VOLUME = 3192538439U;
        static const AkUniqueID MIXER_ENGINE_VOLUME = 1012293574U;
        static const AkUniqueID MIXER_ENVIRONMENT_VOLUME = 2207392583U;
        static const AkUniqueID MIXER_GLOBAL_VOLUME = 3372985139U;
        static const AkUniqueID MIXER_INTERFACE_VOLUME = 1961418929U;
        static const AkUniqueID MIXER_MISCELLANEOUS_VOLUME = 1033908394U;
        static const AkUniqueID MIXER_MUSIC_VOLUME = 3340253669U;
        static const AkUniqueID MIXER_VOICE_VOLUME = 171357120U;
        static const AkUniqueID MIXER_WARNING_VOLUME = 328924114U;
        static const AkUniqueID MUTE_WARNING_OUTSIDE = 1479801155U;
        static const AkUniqueID NPC_ALPHA_PERCENT = 4231049133U;
        static const AkUniqueID PASSENGER_NUMBER = 168543721U;
        static const AkUniqueID SC_AURAL_WARNING = 1288733096U;
        static const AkUniqueID SC_COMBUSTION = 2569770059U;
        static const AkUniqueID SC_ENGINES = 2025464895U;
        static const AkUniqueID SC_RADIO_NOISE = 1796423576U;
        static const AkUniqueID SC_SFX_HIGH = 2217359878U;
        static const AkUniqueID SC_SFX_MID = 2586533568U;
        static const AkUniqueID SC_SFX_THUNDER = 3567933408U;
        static const AkUniqueID SC_VO = 2339006855U;
        static const AkUniqueID SIMVAR_ACCELERATION_BODY_X = 597028126U;
        static const AkUniqueID SIMVAR_ACCELERATION_BODY_Y = 597028127U;
        static const AkUniqueID SIMVAR_ACCELERATION_BODY_Z = 597028124U;
        static const AkUniqueID SIMVAR_AILERON_LEFT_DEFLECTION_PCT = 3664054450U;
        static const AkUniqueID SIMVAR_AILERON_LEFT_DEFLECTION_PCT_DERIVED = 217102336U;
        static const AkUniqueID SIMVAR_AILERON_POSITION = 2706264662U;
        static const AkUniqueID SIMVAR_AILERON_POSITION_DERIVED = 4136779252U;
        static const AkUniqueID SIMVAR_AILERON_RIGHT_DEFLECTION_PCT = 3849071767U;
        static const AkUniqueID SIMVAR_AILERON_RIGHT_DEFLECTION_PCT_DERIVED = 1746861585U;
        static const AkUniqueID SIMVAR_AILERON_TRIM_PCT = 2399365475U;
        static const AkUniqueID SIMVAR_AILERON_TRIM_PCT_DERIVED = 3325244765U;
        static const AkUniqueID SIMVAR_AIRSPEED_INDICATED = 3852284635U;
        static const AkUniqueID SIMVAR_AIRSPEED_TRUE = 2919001772U;
        static const AkUniqueID SIMVAR_AMBIENT_PRECIP_RATE = 1130421863U;
        static const AkUniqueID SIMVAR_AMBIENT_WIND_DIRECTION = 2121926383U;
        static const AkUniqueID SIMVAR_AMBIENT_WIND_VELOCITY = 4154631997U;
        static const AkUniqueID SIMVAR_APU_PCT_RPM = 127634U;
        static const AkUniqueID SIMVAR_APU_PCT_STARTER = 611315644U;
        static const AkUniqueID SIMVAR_AUDIO_PANEL_VOLUME = 2769832386U;
        static const AkUniqueID SIMVAR_BRAKE_LEFT_POSITION = 227288839U;
        static const AkUniqueID SIMVAR_BRAKE_LEFT_POSITION_DERIVED = 2061641313U;
        static const AkUniqueID SIMVAR_BRAKE_PARKING_POSITION = 1561562598U;
        static const AkUniqueID SIMVAR_BRAKE_PARKING_POSITION_DERIVED = 2350559332U;
        static const AkUniqueID SIMVAR_CANOPY_OPEN = 2856966411U;
        static const AkUniqueID SIMVAR_CANOPY_OPEN_DERIVED = 2818097701U;
        static const AkUniqueID SIMVAR_CIRCUIT_ON_A2_R2 = 1128066066U;
        static const AkUniqueID SIMVAR_COM_VOLUME = 3346539780U;
        static const AkUniqueID SIMVAR_ELECTRICAL_BATTERY_BUS_VOLTAGE = 2142437072U;
        static const AkUniqueID SIMVAR_ELECTRICAL_MAIN_BUS_VOLTAGE = 3011087930U;
        static const AkUniqueID SIMVAR_ELECTRICAL_MAIN_BUS_VOLTAGE_A4_R4 = 1330391311U;
        static const AkUniqueID SIMVAR_ELECTRICAL_MASTER_BATTERY = 870701473U;
        static const AkUniqueID SIMVAR_ELECTRICAL_MASTER_BATTERY_INTERPOLATION_A4_R4 = 17277547U;
        static const AkUniqueID SIMVAR_ELECTRICAL_MASTER_BATTERY_INTERPOLATION_A20_R40 = 546703931U;
        static const AkUniqueID SIMVAR_ELECTRICAL_MASTER_BATTERY_INTERPOLATION_A20_R60 = 580259073U;
        static const AkUniqueID SIMVAR_ELEVATOR_POSITION = 2329348688U;
        static const AkUniqueID SIMVAR_ELEVATOR_POSITION_DERIVED = 1757728922U;
        static const AkUniqueID SIMVAR_ELEVATOR_TRIM_POSITION_DERIVED = 2834166043U;
        static const AkUniqueID SIMVAR_ENG_MANIFOLD_PRESSURE = 799415719U;
        static const AkUniqueID SIMVAR_EXIT_OPEN = 2629105351U;
        static const AkUniqueID SIMVAR_EXIT_OPEN_DERIVED = 2134965281U;
        static const AkUniqueID SIMVAR_FLAPS_HANDLE_PERCENT = 744096571U;
        static const AkUniqueID SIMVAR_FLAPS_HANDLE_PERCENT_DERIVED = 917263157U;
        static const AkUniqueID SIMVAR_FLAPS_HANDLE_PERCENT_DERIVED_CUSTOM = 114077385U;
        static const AkUniqueID SIMVAR_G_FORCE = 2634947563U;
        static const AkUniqueID SIMVAR_GEAR_ANIMATION_POSITION_DERIVED = 3531458922U;
        static const AkUniqueID SIMVAR_GEAR_LEFT_POSITION = 2276044951U;
        static const AkUniqueID SIMVAR_GEAR_LEFT_POSITION_DERIVED = 705233425U;
        static const AkUniqueID SIMVAR_GEAR_RIGHT_POSITION = 3775540364U;
        static const AkUniqueID SIMVAR_GEAR_RIGHT_POSITION_DERIVED = 3674907894U;
        static const AkUniqueID SIMVAR_GEAR_STEER_ANGLE = 2561450851U;
        static const AkUniqueID SIMVAR_GEAR_TOTAL_PCT_EXTENDED = 2030875130U;
        static const AkUniqueID SIMVAR_GEAR_TOTAL_PCT_EXTENDED_DERIVED = 1922142312U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_ANTI_ICE_POSITION_DERIVED = 268163784U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_COMBUSTION = 647081781U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_COMBUSTION_A2_R2 = 110458080U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_COMBUSTION_SOUND_PERCENT = 1416776395U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_DAMAGE_PERCENT = 3838835917U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_FAILED = 2536013955U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_FUEL_PUMP_ON = 3588798247U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_FUEL_PUMP_SWITCH = 4094053432U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_FUEL_VALVE = 546271323U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_MIXTURE_LEVER_POSITION = 3965678973U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_MIXTURE_LEVER_POSITION_DERIVED = 4051088531U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_MIXTURE_LEVER_POSITION_DERIVED_A0R0 = 36059659U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_PCT_MAX_RPM = 1004019192U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_PROPELLER_LEVER_POSITION = 3806475050U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_PROPELLER_LEVER_POSITION_DERIVED = 1553582712U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_RPM = 2809322939U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_STARTER = 1531871173U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_THROTTLE_LEVER_POSITION = 177390733U;
        static const AkUniqueID SIMVAR_GENERAL_ENG_THROTTLE_LEVER_POSITION_DERIVED = 2866074243U;
        static const AkUniqueID SIMVAR_GROUND_VELOCITY = 1649214721U;
        static const AkUniqueID SIMVAR_GROUND_VELOCITY_CUSTOM = 3999663173U;
        static const AkUniqueID SIMVAR_GROUND_VELOCITY_ICON_A5 = 1719343144U;
        static const AkUniqueID SIMVAR_INCIDENCE_ALPHA = 3709807603U;
        static const AkUniqueID SIMVAR_INCIDENCE_BETA = 2281158207U;
        static const AkUniqueID SIMVAR_MASTER_IGNITION_SWITCH = 3117047763U;
        static const AkUniqueID SIMVAR_NAV_VOLUME = 1014571212U;
        static const AkUniqueID SIMVAR_OVERSPEED_WARNING = 2648716210U;
        static const AkUniqueID SIMVAR_PLANE_ALT_ABOVE_GROUND = 3763572042U;
        static const AkUniqueID SIMVAR_PLANE_ALTITUDE = 3467647527U;
        static const AkUniqueID SIMVAR_PLANE_BANK_DEGREES = 1985982473U;
        static const AkUniqueID SIMVAR_PLANE_PITCH_DEGREES = 1825331539U;
        static const AkUniqueID SIMVAR_PROP_BETA = 2597494516U;
        static const AkUniqueID SIMVAR_PROP_MAX_RPM_PERCENT = 1828939552U;
        static const AkUniqueID SIMVAR_PROP_RPM = 508195889U;
        static const AkUniqueID SIMVAR_RECIP_ENG_COWL_FLAP_POSITION = 3772140148U;
        static const AkUniqueID SIMVAR_RECIP_ENG_COWL_FLAP_POSITION_DERIVED = 4227664350U;
        static const AkUniqueID SIMVAR_RECIP_ENG_CYLINDER_HEAD_TEMPERATURE = 2502250657U;
        static const AkUniqueID SIMVAR_RECIP_ENG_PRIMER = 2228955890U;
        static const AkUniqueID SIMVAR_RECIP_ENG_PRIMER_DERIVED = 1976135488U;
        static const AkUniqueID SIMVAR_ROTATION_VELOCITY_BODY_X = 147346454U;
        static const AkUniqueID SIMVAR_ROTATION_VELOCITY_BODY_Y = 147346455U;
        static const AkUniqueID SIMVAR_ROTATION_VELOCITY_BODY_Z = 147346452U;
        static const AkUniqueID SIMVAR_RUDDER_PEDAL_POSITION = 3634827275U;
        static const AkUniqueID SIMVAR_RUDDER_PEDAL_POSITION_DERIVED = 275110181U;
        static const AkUniqueID SIMVAR_RUDDER_POSITION = 1713905280U;
        static const AkUniqueID SIMVAR_RUDDER_POSITION_DERIVED = 2033882282U;
        static const AkUniqueID SIMVAR_RUDDER_TRIM_PCT = 767117985U;
        static const AkUniqueID SIMVAR_RUDDER_TRIM_PCT_DERIVED = 184231767U;
        static const AkUniqueID SIMVAR_SPOILERS_HANDLE_POSITION = 1052191296U;
        static const AkUniqueID SIMVAR_SPOILERS_HANDLE_POSITION_DERIVED = 3044535402U;
        static const AkUniqueID SIMVAR_SPOILERS_LEFT_POSITION_DERIVED = 1512932249U;
        static const AkUniqueID SIMVAR_SPOILERS_RIGHT_POSITION_DERIVED = 217860862U;
        static const AkUniqueID SIMVAR_SURFACE_TYPE = 2768021712U;
        static const AkUniqueID SIMVAR_THROTTLE_LOWER_LIMIT = 1730619942U;
        static const AkUniqueID SIMVAR_TRAILING_EDGE_FLAPS_LEFT_PERCENT = 856497213U;
        static const AkUniqueID SIMVAR_TRAILING_EDGE_FLAPS_LEFT_PERCENT_DERIVED = 944916307U;
        static const AkUniqueID SIMVAR_TRAILING_EDGE_FLAPS_RIGHT_PERCENT = 52857248U;
        static const AkUniqueID SIMVAR_TRAILING_EDGE_FLAPS_RIGHT_PERCENT_DERIVED = 373734154U;
        static const AkUniqueID SIMVAR_TURB_ENG_AFTERBURNER = 1125349813U;
        static const AkUniqueID SIMVAR_TURB_ENG_BLEED_AIR = 803931516U;
        static const AkUniqueID SIMVAR_TURB_ENG_CORRECTED_FF = 2362036243U;
        static const AkUniqueID SIMVAR_TURB_ENG_CORRECTED_N1 = 2496257340U;
        static const AkUniqueID SIMVAR_TURB_ENG_CORRECTED_N2 = 2496257343U;
        static const AkUniqueID SIMVAR_TURB_ENG_ITT = 421614992U;
        static const AkUniqueID SIMVAR_TURB_ENG_JET_THRUST = 1426274465U;
        static const AkUniqueID SIMVAR_TURB_ENG_MAX_TORQUE_PERCENT = 1120239162U;
        static const AkUniqueID SIMVAR_TURB_ENG_N1 = 2750389324U;
        static const AkUniqueID SIMVAR_TURB_ENG_N2 = 2750389327U;
        static const AkUniqueID SIMVAR_TURB_ENG_PRESSURE_RATIO = 3562626650U;
        static const AkUniqueID SIMVAR_TURB_ENG_REVERSE_NOZZLE_PERCENT = 895650072U;
        static const AkUniqueID SIMVAR_TURB_ENG_VIBRATION = 3554971247U;
        static const AkUniqueID SIMVAR_VELOCITY_BODY_X = 2381674249U;
        static const AkUniqueID SIMVAR_VELOCITY_BODY_Y = 2381674248U;
        static const AkUniqueID SIMVAR_VELOCITY_BODY_Z = 2381674251U;
        static const AkUniqueID SIMVAR_VELOCITY_WORLD_X = 821010337U;
        static const AkUniqueID SIMVAR_VELOCITY_WORLD_Y = 821010336U;
        static const AkUniqueID SIMVAR_VELOCITY_WORLD_Z = 821010339U;
        static const AkUniqueID SIMVAR_VERTICAL_SPEED = 1038408482U;
        static const AkUniqueID SIMVAR_VERTICAL_SPEED_DERIVED = 2210304272U;
        static const AkUniqueID SIMVAR_VERTICAL_SPEED_DERIVED_CUSTOM = 4278378082U;
        static const AkUniqueID SIMVAR_WATER_LEFT_RUDDER_EXTENDED_DERIVED = 459008602U;
        static const AkUniqueID SIMVAR_WHEEL_RPM = 1091068139U;
        static const AkUniqueID SIMVAR_WHEEL_RPM_DERIVED = 2508714565U;
        static const AkUniqueID SIMVAR_WING_FLEX_PCT = 2580397389U;
        static const AkUniqueID SIMVAR_YOKE_X_POSITION = 2749332365U;
        static const AkUniqueID SIMVAR_YOKE_X_POSITION_DERIVED = 1017211267U;
        static const AkUniqueID SIMVAR_YOKE_Y_POSITION = 3891096118U;
        static const AkUniqueID SIMVAR_YOKE_Y_POSITION_DERIVED = 2646086036U;
        static const AkUniqueID SPP_DISTANCE = 3028259178U;
        static const AkUniqueID SS_AIR_FEAR = 1351367891U;
        static const AkUniqueID SS_AIR_FREEFALL = 3002758120U;
        static const AkUniqueID SS_AIR_FURY = 1029930033U;
        static const AkUniqueID SS_AIR_MONTH = 2648548617U;
        static const AkUniqueID SS_AIR_PRESENCE = 3847924954U;
        static const AkUniqueID SS_AIR_RPM = 822163944U;
        static const AkUniqueID SS_AIR_SIZE = 3074696722U;
        static const AkUniqueID SS_AIR_STORM = 3715662592U;
        static const AkUniqueID SS_AIR_TIMEOFDAY = 3203397129U;
        static const AkUniqueID SS_AIR_TURBULENCE = 4160247818U;
    } // namespace GAME_PARAMETERS

    namespace BANKS
    {
        static const AkUniqueID INIT = 1355168291U;
        static const AkUniqueID ASOBO_A320_NEO_IMPROVED = 3414319756U;
        static const AkUniqueID LOCAL_SOUNDBANK = 2933379036U;
    } // namespace BANKS

    namespace BUSSES
    {
        static const AkUniqueID AIRCRAFT_WWISEDATA = 2778823169U;
        static const AkUniqueID AIRCRAFT_WWISEDATA_AI = 3775981302U;
        static const AkUniqueID AIRCRAFT_WWISEDATA_PLAYER = 79922627U;
        static const AkUniqueID AUX_INSIDE = 925736268U;
        static const AkUniqueID AUX_OUTSIDE = 2517442453U;
        static const AkUniqueID COMBUSTION_AI = 2877058721U;
        static const AkUniqueID COMBUSTION_GENERIC_AI = 2595609767U;
        static const AkUniqueID COMBUSTION_INSIDE = 33744963U;
        static const AkUniqueID COMBUSTION_INSIDE_AMBISONIC = 2287420569U;
        static const AkUniqueID COMBUSTION_INSIDE_GENERIC = 3300222473U;
        static const AkUniqueID COMBUSTION_OUTSIDE = 279718392U;
        static const AkUniqueID COMBUSTION_OUTSIDE_GENERIC = 3716030094U;
        static const AkUniqueID COMBUSTION_OUTSIDE_TURBINE = 3703332428U;
        static const AkUniqueID COMBUSTION_TURBINE_AI = 2965236493U;
        static const AkUniqueID ENGINE_AI = 2916344200U;
        static const AkUniqueID ENGINE_INSIDE = 141468874U;
        static const AkUniqueID ENGINE_OUTSIDE = 622845711U;
        static const AkUniqueID ENV_AMBIENCE = 10182753U;
        static const AkUniqueID ENV_AMBIENCE_AIRPORTS = 884491640U;
        static const AkUniqueID ENV_AMBIENCE_AIRPORTS_VEHICLES = 2578583116U;
        static const AkUniqueID ENV_AMBIENCE_AMBISONIC = 127503807U;
        static const AkUniqueID ENV_AMBIENCE_BIOMES = 3082359155U;
        static const AkUniqueID ENV_AMBIENCE_CUSTOM = 1835685733U;
        static const AkUniqueID ENV_AMBIENCE_ROAD_TRAFFIC = 1715749244U;
        static const AkUniqueID ENV_AMBIENCE_URBANIZATION = 3906847520U;
        static const AkUniqueID ENV_AMBIENCE_WATER = 3901746849U;
        static const AkUniqueID ENV_WEATHER = 1071024731U;
        static const AkUniqueID ENV_WEATHER_AMBISONIC = 3195190449U;
        static const AkUniqueID ENV_WEATHER_CUSTOM = 1145949691U;
        static const AkUniqueID ENV_WEATHER_PRECIPITATION = 1248535515U;
        static const AkUniqueID ENV_WEATHER_THUNDER = 523563888U;
        static const AkUniqueID ENV_WEATHER_WIND_INSIDE = 3345363503U;
        static const AkUniqueID ENV_WEATHER_WIND_OUTSIDE = 3347308156U;
        static const AkUniqueID ENVIRONMENT = 1229948536U;
        static const AkUniqueID GAME = 702482391U;
        static const AkUniqueID GAME_AUX = 3624583984U;
        static const AkUniqueID GAME_SFX = 3672062747U;
        static const AkUniqueID GROUNDS_AI = 868413152U;
        static const AkUniqueID GROUNDS_INSIDE = 570764930U;
        static const AkUniqueID GROUNDS_INSIDE_AMBISONIC = 1373265740U;
        static const AkUniqueID GROUNDS_INSIDE_GENERIC = 324845948U;
        static const AkUniqueID GROUNDS_OUTSIDE = 3365007143U;
        static const AkUniqueID INSIDE = 3553349781U;
        static const AkUniqueID INSTRUMENT_INSIDE_AMBISONIC = 3061640635U;
        static const AkUniqueID INSTRUMENT_INSIDE_GENERIC = 1932523463U;
        static const AkUniqueID INSTRUMENTS_AI = 2406532902U;
        static const AkUniqueID INSTRUMENTS_INSIDE = 1736642064U;
        static const AkUniqueID INSTRUMENTS_OUTSIDE = 3636986689U;
        static const AkUniqueID JETWHINE_AI = 3000506812U;
        static const AkUniqueID JETWHINE_GENERIC_AI = 2497764834U;
        static const AkUniqueID JETWHINE_INSIDE = 277616486U;
        static const AkUniqueID JETWHINE_INSIDE_AMBISONIC = 1460906496U;
        static const AkUniqueID JETWHINE_INSIDE_GENERIC = 3840590584U;
        static const AkUniqueID JETWHINE_OUTSIDE = 904316387U;
        static const AkUniqueID JETWHINE_OUTSIDE_GENERIC = 1732436329U;
        static const AkUniqueID JETWHINE_OUTSIDE_TURBINE = 3657403723U;
        static const AkUniqueID JETWHINE_TURBINE_AI = 2660702396U;
        static const AkUniqueID MASTER_AUDIO_BUS = 3803692087U;
        static const AkUniqueID MASTER_HEADSET_BUS = 2345655123U;
        static const AkUniqueID MISCELLANEOUS_AI = 3660562192U;
        static const AkUniqueID MISCELLANEOUS_INSIDE = 257994322U;
        static const AkUniqueID MISCELLANEOUS_INSIDE_AMBISONIC = 1960530716U;
        static const AkUniqueID MISCELLANEOUS_INSIDE_GENERIC = 4071489356U;
        static const AkUniqueID MISCELLANEOUS_OUTSIDE = 142579863U;
        static const AkUniqueID OUTSIDE = 438105790U;
        static const AkUniqueID PROPELLER_AI = 1206946791U;
        static const AkUniqueID PROPELLER_INSIDE = 2880226385U;
        static const AkUniqueID PROPELLER_INSIDE_AMBISONIC = 503449455U;
        static const AkUniqueID PROPELLER_INSIDE_GENERIC = 4030881699U;
        static const AkUniqueID PROPELLER_OUTSIDE = 1475543058U;
        static const AkUniqueID PROPELLER_OUTSIDE_GENERIC = 2207139852U;
        static const AkUniqueID RAIN_AI = 429248316U;
        static const AkUniqueID RAIN_INSIDE = 3301942502U;
        static const AkUniqueID RAIN_INSIDE_AMBISONIC = 2428461952U;
        static const AkUniqueID RAIN_INSIDE_GENERIC = 1352827000U;
        static const AkUniqueID RAIN_OUTSIDE = 2084472419U;
        static const AkUniqueID RATTLE_INSIDE_AMBISONIC = 2871036816U;
        static const AkUniqueID RATTLE_INSIDE_GENERIC = 185095368U;
        static const AkUniqueID RATTLES_AI = 309952163U;
        static const AkUniqueID RATTLES_INSIDE = 1402637413U;
        static const AkUniqueID RATTLES_OUTSIDE = 1192269166U;
        static const AkUniqueID ROTOR_AI = 191394544U;
        static const AkUniqueID ROTOR_INSIDE = 1930504242U;
        static const AkUniqueID ROTOR_INSIDE_AMBISONIC = 842970940U;
        static const AkUniqueID ROTOR_INSIDE_GENERIC = 3984084332U;
        static const AkUniqueID ROTOR_OUTSIDE = 3612411895U;
        static const AkUniqueID WALLA_AI = 3727292239U;
        static const AkUniqueID WALLA_INSIDE = 2373486617U;
        static const AkUniqueID WALLA_INSIDE_AMBISONIC = 1728532023U;
        static const AkUniqueID WALLA_INSIDE_GENERIC = 3355598651U;
        static const AkUniqueID WALLA_OUTSIDE = 1314679674U;
        static const AkUniqueID WARNING_AI = 3909608288U;
        static const AkUniqueID WARNING_INSIDE = 700771074U;
        static const AkUniqueID WARNING_INSIDE_AMBISONIC = 752697292U;
        static const AkUniqueID WARNING_INSIDE_GENERIC = 646417916U;
        static const AkUniqueID WARNING_OUTSIDE = 2070391975U;
        static const AkUniqueID WARNING_SIGNAL = 3678652918U;
        static const AkUniqueID WARNING_VOICE = 2133196684U;
        static const AkUniqueID WARNINGS = 815321290U;
        static const AkUniqueID WINDS_AI = 1396985903U;
        static const AkUniqueID WINDS_INSIDE = 2197855225U;
        static const AkUniqueID WINDS_INSIDE_AMBISONIC = 4178885975U;
        static const AkUniqueID WINDS_INSIDE_GENERIC = 826990683U;
        static const AkUniqueID WINDS_OUTSIDE = 740322010U;
    } // namespace BUSSES

    namespace AUX_BUSSES
    {
        static const AkUniqueID DISTO_OVERSPEED = 3484564662U;
        static const AkUniqueID REV_INSIDE_CUSTOM = 3722335303U;
        static const AkUniqueID REV_OUTDOOR_AIRCRAFT = 2069837898U;
        static const AkUniqueID REV_OUTDOOR_AIRCRAFT_LOW_END = 3930462003U;
        static const AkUniqueID REV_OUTDOOR_CUSTOM = 1600286681U;
        static const AkUniqueID REV_OUTDOOR_CUSTOM_AI = 1214755710U;
    } // namespace AUX_BUSSES

    namespace AUDIO_DEVICES
    {
        static const AkUniqueID HEADSET = 1065201297U;
        static const AkUniqueID NO_OUTPUT = 2317455096U;
        static const AkUniqueID SYSTEM = 3859886410U;
    } // namespace AUDIO_DEVICES

}// namespace AK

#endif // __WWISE_IDS_H__
