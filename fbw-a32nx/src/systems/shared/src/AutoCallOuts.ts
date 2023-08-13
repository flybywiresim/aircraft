// Note there is a copy of these flags in `fbw-a32nx\src\base\flybywire-aircraft-a320-neo\html_ui\Pages\A32NX_Core\A32NX_GPWS.js` for legacy JS.
// Please keep that up to date if making any changes here.

/** Bit flags for the radio auto call outs (for CONFIG_A32NX_RADIO_AUTO_CALL_OUTS). */
export enum RadioAutoCallOutFlags {
    TwoThousandFiveHundred = 1 << 0,
    TwentyFiveHundred = 1 << 1,
    TwoThousand = 1 << 2,
    OneThousand = 1 << 3,
    FiveHundred = 1 << 4,
    FourHundred = 1 << 5,
    ThreeHundred = 1 << 6,
    TwoHundred = 1 << 7,
    OneHundred = 1 << 8,
    Fifty = 1 << 9,
    Forty = 1 << 10,
    Thirty = 1 << 11,
    Twenty = 1 << 12,
    Ten = 1 << 13,
    Five = 1 << 14,
}

/** The default (Airbus basic configuration) radio altitude auto call outs. */
export const DEFAULT_RADIO_AUTO_CALL_OUTS = RadioAutoCallOutFlags.TwoThousandFiveHundred | RadioAutoCallOutFlags.OneThousand | RadioAutoCallOutFlags.FourHundred
    | RadioAutoCallOutFlags.Fifty | RadioAutoCallOutFlags.Forty | RadioAutoCallOutFlags.Thirty | RadioAutoCallOutFlags.Twenty
    | RadioAutoCallOutFlags.Ten | RadioAutoCallOutFlags.Five;
