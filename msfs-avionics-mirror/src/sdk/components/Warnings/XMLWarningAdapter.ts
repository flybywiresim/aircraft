/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />
/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/BaseInstrument" />

import { Warning, WarningType } from './Warning';

/** Create a list of system warnings. */
export class XMLWarningFactory {
  private instrument: BaseInstrument;

  /**
   * Create an XMLWarningFactory.
   * @param instrument The instrument that the warnings run in.
   */
  public constructor(instrument: BaseInstrument) {
    this.instrument = instrument;
  }

  /**
   * Parse a panel.xml configuration to create a list of warnings.  The warning
   * priority is defined by their order in panel.xml, with higher priority
   * warnings coming sooner in the file.
   * @param document The configuration as an XML document.
   * @returns An array of Warnings
   */
  public parseConfig(document: Document): Array<Warning> {
    const warnings = new Array<Warning>();
    const configs = document.getElementsByTagName('VoicesAlerts');
    if (configs.length == 0) {
      return warnings;
    }

    const config = configs[0];
    for (const warn of config.children) {
      let type: WarningType;

      const typeElem = warn.getElementsByTagName('Type');
      if (typeElem.length == 0) {
        continue;
      }

      switch (typeElem[0].textContent) {
        case 'Warning':
          type = WarningType.Warning; break;
        case 'Caution':
          type = WarningType.Caution; break;
        case 'Test':
          type = WarningType.Test; break;
        case 'SoundOnly':
          type = WarningType.SoundOnly; break;
        default:
          continue;
      }

      let textElem = warn.getElementsByTagName('Condition');
      if (textElem.length == 0) {
        continue;
      }
      const condition = new CompositeLogicXMLElement(this.instrument, textElem[0]);

      textElem = warn.getElementsByTagName('ShortText');
      let shortText = undefined;
      if (textElem.length > 0 && textElem[0].textContent !== null) {
        shortText = textElem[0].textContent;
      }

      textElem = warn.getElementsByTagName('LongText');
      let longText = undefined;
      if (textElem.length > 0 && textElem[0].textContent !== null) {
        longText = textElem[0].textContent;
      }

      textElem = warn.getElementsByTagName('SoundEvent');
      let soundEvent = undefined;
      if (textElem.length > 0 && textElem[0].textContent !== null) {
        soundEvent = textElem[0].textContent;
      }


      textElem = warn.getElementsByTagName('Once');
      let once = false;
      if (textElem.length > 0 && textElem[0].textContent == 'True') {
        once = true;
      }

      warnings.push(new Warning(type, condition, shortText, longText, soundEvent, once));
    }

    return warnings;
  }
}