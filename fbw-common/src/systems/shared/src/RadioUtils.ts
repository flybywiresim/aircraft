// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export enum RadioChannelType {
  /** 1 kHz channels. */
  Hf1,
  /** 8.33 kHz channels only. */
  VhfCom8_33,
  /** 25 kHz channels only. */
  VhfCom25,
  /** Combination of 8.33 kHz and 25 kHz channels. */
  VhfCom8_33_25,
  /** 50 kHz channels. */
  VhfNavaid50,
  /** 50 kHz ILS channels. */
  IlsNavaid50,
}

interface ChannelParameters {
  /** The mask to apply before checking channel spacing. */
  channelMask: number;
  /** The channel spacings in BCD32 for each frequency spacing. */
  channels: number[];
  /** The minimum valid channel in BCD32. */
  min: number;
  /** The maximum valid channel in BCD32. */
  max: number;
}

export class RadioUtils {
  /**
   * @deprecated Channel types for easier use with legacy JS. For TS use {@link RadioChannelType} directly.
   */
  public static readonly RadioChannelType = RadioChannelType;

  /** The channel spacings in kHz for each frequency spacing. */
  public static readonly CHANNEL_TYPES: Record<RadioChannelType, ChannelParameters> = {
    [RadioChannelType.VhfCom8_33]: {
      channelMask: 0xfff,
      channels: [0x50, 0x100, 0x150, 0x300, 0x350, 0x400, 0x550, 0x600, 0x650, 0x800, 0x850, 0x900],
      min: 0x1180000,
      max: 0x1369750,
    },
    [RadioChannelType.VhfCom25]: {
      channelMask: 0xfff,
      channels: [0, 0x250, 0x500, 0x750],
      min: 0x1180000,
      max: 0x1369750,
    },
    [RadioChannelType.VhfCom8_33_25]: {
      channelMask: 0xfff,
      channels: [
        0, 0x50, 0x100, 0x150, 0x250, 0x300, 0x350, 0x400, 0x500, 0x550, 0x600, 0x650, 0x750, 0x800, 0x850, 0x900,
      ],
      min: 0x1180000,
      max: 0x1369750,
    },
    [RadioChannelType.VhfNavaid50]: {
      channelMask: 0xfff,
      channels: [0, 0x500],
      min: 0x1080000,
      max: 0x1179500,
    },
    [RadioChannelType.IlsNavaid50]: {
      channelMask: 0xfff,
      channels: [0, 0x500],
      min: 0x1080000,
      max: 0x1119500,
    },
    [RadioChannelType.Hf1]: {
      channelMask: 0xff,
      channels: [0, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80, 0x90],
      min: 0x0028000,
      max: 0x0239990,
    },
  };

  /**
   * Packs a VHF com frequency into the data portion of an arinc word.
   * @param frequency The MSFS Bcd32 frequency.
   * @returns The ARINC BCD encoded data.
   */
  public static packBcd32VhfComFrequencyToArinc(bcd32: number): number {
    return (bcd32 >>> 4) & 0x7ffff;
  }

  /**
   * Packs a VHF com frequency into the data portion of an arinc word.
   * @param frequency The MSFS Bcd16 frequency.
   * @returns The ARINC BCD encoded data.
   */
  public static packBcd16VhfComFrequencyToArinc(bcd16: number): number {
    return (bcd16 << 4) & 0x7ffff;
  }

  /**
   * Unpacks a VHF com frequency from the data portion of an arinc word.
   * @param arincValue The BCD encoded ARINC data.
   * @returns the frequency in MSFS BCD32.
   */
  public static unpackVhfComFrequencyFromArincToBcd32(arincValue: number): number {
    return 0x100_000_0 | ((arincValue & 0x7ffff) << 4);
  }

  /**
   * Unpacks a VHF com frequency from the data portion of an arinc word.
   * @param arincValue The BCD encoded ARINC data.
   * @returns the frequency in MSFS BCD16.
   */
  public static unpackVhfComFrequencyFromArincToBcd16(arincValue: number): number {
    return (arincValue & 0x7ffff) >> 4;
  }

  /**
   * Formats A429 BCD data for debugging.
   * @param value The A429 BCD value.
   * @param separator The separator
   * @returns A formatted string, with bits in groups of 4, separated by `separator`.
   */
  public static debugFormatArincBcdData(value: number, separator = '|'): string {
    return value
      .toString(2)
      .padStart(20, '0')
      .match(/.{1,4}/g)
      .join(separator)
      .slice(1);
  }

  /**
   * Unpacks a VHF COM frequency from the data portion of an arinc word.
   * @param arincValue The BCD encoded ARINC data.
   * @returns the frequency in hertz.
   */
  public static unpackVhfComFrequencyFromArincToHz(arincValue: number): number {
    return (
      100_000_000 +
      10_000_000 * ((arincValue >>> 16) & 0x7) +
      1_000_000 * ((arincValue >>> 12) & 0xf) +
      100_000 * ((arincValue >>> 8) & 0xf) +
      10_000 * ((arincValue >>> 4) & 0xf) +
      1_000 * ((arincValue >>> 0) & 0xf)
    );
  }

  /**
   * Packs a VHF COM frequency into the data portion of an arinc word.
   * Primarily useful for debugging (use BCD encoding for systems code).
   * @param frequency The frequency in hertz with precision of 1 kHz max.
   * @returns The ARINC BCD encoded data.
   */
  public static packVhfComFrequencyToArinc(frequency: number): number {
    return RadioUtils.packBcd32VhfComFrequencyToArinc(RadioUtils.packBcd32(frequency));
  }

  /**
   * Packs a frequency into MSFS BCD32 format.
   * Primarily useful for debugging (use BCD encoding for systems code).
   * @param frequency Frequency in hertz with precision of 1 kHz max.
   * @returns Frequency in MSFS BCD32
   */
  public static packBcd32(frequency: number): number {
    const freq = Math.round(frequency / 1_000);
    return (
      (freq % 10 << 4) +
      (Math.trunc(freq / 10) % 10 << 8) +
      (Math.trunc(freq / 100) % 10 << 12) +
      (Math.trunc((freq / 1000) % 10) << 16) +
      (Math.trunc((freq / 10000) % 10) << 20) +
      (Math.trunc((freq / 100000) % 10) << 24)
    );
  }

  /**
   * Packs a frequency into MSFS BCD16 format.
   * Primarily useful for debugging (use BCD encoding for systems code).
   * @param frequency Frequency in hertz, with precision of 10 kHz max.
   * @returns Frequency in MSFS BCD16
   */
  public static packBcd16(frequency: number): number {
    return (this.packBcd32(frequency) >>> 8) & 0xffff;
  }

  /**
   * Converts MSFS BCD16 to BCD32.
   * @param bcd16 The frequency in BCD16 format.
   * @returns The frequency in BCD32 format.
   */
  public static bcd16ToBcd32(bcd16: number): number {
    return 0x100_000_0 | (bcd16 << 8);
  }

  /**
   * Unpacks a frequency from MSFS BCD32 format into hertz.
   * Primarily useful for debugging (use BCD encoding for systems code).
   * @param bcd32 The freqeuncy in BCD32 format.
   * @returns Frequency in hertz.
   */
  public static unpackBcd32(bcd32: number): number {
    return (
      100_000_000 * ((bcd32 >>> 24) & 0xf) +
      10_000_000 * ((bcd32 >>> 20) & 0xf) +
      1_000_000 * ((bcd32 >>> 16) & 0xf) +
      100_000 * ((bcd32 >>> 12) & 0xf) +
      10_000 * ((bcd32 >>> 8) & 0xf) +
      1_000 * ((bcd32 >>> 4) & 0xf)
    );
  }

  /**
   * Unpacks a frequency from MSFS BCD16 format into hertz.
   * Primarily useful for debugging (use BCD encoding for systems code).
   * @param frequency Frequency in hertz, with precision of 10 kHz max.
   * @returns Frequency in hertz.
   */
  public static unpackBcd16(frequency: number): number {
    return this.unpackBcd32(RadioUtils.bcd16ToBcd32(frequency));
  }

  /**
   * Formats an MSFS BCD32 VHF freqeuncy into the format nnn.nnn
   * @param bcd32 The freqeuncy in BCD32 format.
   * @returns The formatted string.
   */
  public static formatBcd32(bcd32: number, separator = '.'): string {
    const digits = ((bcd32 >>> 4) & 0xffffff).toString(16).padStart(6, '0');
    return `${digits.slice(0, 3)}${separator}${digits.slice(3)}`;
  }

  /**
   * Formats an MSFS BCD16 VHF freqeuncy into the format nnn.nnn
   * @param bcd16 The freqeuncy in BCD16 format.
   * @returns The formatted string.
   */
  public static formatBcd16(bcd16: number, separator = '.'): string {
    const digits = ((bcd16 << 4) & 0xffffff).toString(16).padStart(5, '0');
    return `1${digits.slice(0, 2)}${separator}${digits.slice(2)}`;
  }

  /**
   * Validates that a radio frequency lies in the the valid range, and channel spacing.
   * @param bcd32 The frequency in MSFS BCD32 format.
   * @param type The channel type.
   * @returns whether the freqeuncy is valid.
   */
  public static isValidFrequency(bcd32: number, type = RadioChannelType.VhfCom8_33_25): boolean {
    return RadioUtils.isValidRange(bcd32, type) && RadioUtils.isValidSpacing(bcd32, type);
  }

  /**
   * Checks that a radio frequency is in the valid frequency range.
   * @param bcd32 The frequency in MSFS BCD32 format.
   * @param type The channel type.
   * @returns whether the frequency is in range.
   */
  public static isValidRange(bcd32: number, type: RadioChannelType): boolean {
    const channelInfo = RadioUtils.CHANNEL_TYPES[type];
    return bcd32 >= channelInfo.min && bcd32 <= channelInfo.max;
  }

  /**
   * Checks that a radio frequency has valid channel spacing.
   * @param bcd32 The frequency in MSFS BCD32 format.
   * @param type The channel type.
   * @returns whether the frequency is a valid channel.
   */
  public static isValidSpacing(bcd32: number, type: RadioChannelType): boolean {
    const channelInfo = RadioUtils.CHANNEL_TYPES[type];
    return channelInfo.channels.includes(bcd32 & channelInfo.channelMask);
  }
}
