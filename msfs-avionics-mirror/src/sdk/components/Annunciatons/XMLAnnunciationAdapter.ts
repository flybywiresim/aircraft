/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />
/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/BaseInstrument" />

import { Annunciation, AnnunciationType } from './Annunciaton';


/** Create a list of annunciations from the instrument XML config. */
export class XMLAnnunciationFactory {
  private instrument: BaseInstrument;

  /**
   * Create an XMLAnnunciationFactory.
   * @param instrument The instrument that holds this engine display.
   */
  public constructor(instrument: BaseInstrument) {
    this.instrument = instrument;
  }

  /**
   * Parse an panel.xml configuration
   * @param document The configuration as an XML document.
   * @returns An array of Annunciations.
   */
  public parseConfig(document: Document): Array<Annunciation> {
    const annunciations = new Array<Annunciation>();
    const configs = document.getElementsByTagName('Annunciations');
    if (configs.length == 0) {
      return annunciations;
    }

    const config = configs[0];

    for (const ann of config.children) {
      let type: AnnunciationType;
      let suffix: string | undefined;

      // Priority type that this alert has.
      const typeElem = ann.getElementsByTagName('Type');
      if (typeElem.length == 0) {
        continue;
      }
      switch (typeElem[0].textContent) {
        case 'Warning':
          type = AnnunciationType.Warning; break;
        case 'Caution':
          type = AnnunciationType.Caution; break;
        case 'Advisory':
          type = AnnunciationType.Advisory; break;
        case 'SafeOp':
          type = AnnunciationType.SafeOp; break;
        default:
          continue;
      }

      // Get the XML logic condition for state control.
      const condElem = ann.getElementsByTagName('Condition');
      if (condElem.length == 0) {
        continue;
      }
      const condition = new CompositeLogicXMLElement(this.instrument, condElem[0]);

      // The actual text shown when the alert is displayed.
      const textElem = ann.getElementsByTagName('Text');
      if (textElem.length == 0 || textElem[0].textContent == null) {
        continue;
      }
      const text = textElem[0].textContent;


      // A suffix put on the text when it's shown.
      const suffElem = ann.getElementsByTagName('Suffix');
      if (suffElem.length != 0 && suffElem[0].textContent !== null) {
        suffix = suffElem[0].textContent;
      } else {
        suffix = undefined;
      }

      annunciations.push(new Annunciation(type, text, condition, suffix));
    }

    return annunciations;
  }
}