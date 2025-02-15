import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';
import { CDUAocFreeText } from './A320_Neo_CDU_AOC_FreeText';
import { CDUAocInit } from './A320_Neo_CDU_AOC_Init';
import { CDUAocMessagesReceived } from './A320_Neo_CDU_AOC_MessagesReceived';
import { CDUAocMessagesSent } from './A320_Neo_CDU_AOC_MessagesSent';
import { CDUAocRequestsAtis } from './A320_Neo_CDU_AOC_RequestsAtis';
import { CDUAocRequestsWeather } from './A320_Neo_CDU_AOC_RequestsWeather';
import { CDUAtsuMenu } from './A320_Neo_CDU_ATSU_Menu';

export class CDUAocMenu {
  static ShowPage(mcdu: LegacyAtsuPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.AOCMenu;
    mcdu.setTemplate([
      ['AOC MENU'],
      [''],
      ['<INIT/PRES', 'FREE TEXT>'],
      ['', ''],
      ['<WX REQUEST'],
      ['', 'RECEIVED\xa0'],
      ['<ATIS', 'MESSAGES>'],
      ['', 'SENT\xa0'],
      ['', 'MESSAGES>'],
      [''],
      ['', 'DIVERSION>[color]inop'],
      ['\xa0ATSU DLK'],
      ['<RETURN', 'MISC>[color]inop'],
    ]);

    mcdu.leftInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[1] = () => {
      CDUAocRequestsWeather.ShowPage(mcdu);
    };
    mcdu.leftInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[2] = () => {
      CDUAocRequestsAtis.ShowPage(mcdu);
    };
    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUAtsuMenu.ShowPage(mcdu);
    };
    mcdu.rightInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[0] = () => {
      CDUAocFreeText.ShowPage(mcdu);
    };
    mcdu.rightInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[2] = () => {
      CDUAocMessagesReceived.ShowPage(mcdu);
    };
    mcdu.rightInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[3] = () => {
      CDUAocMessagesSent.ShowPage(mcdu);
    };
    mcdu.onLeftInput[0] = () => {
      CDUAocInit.ShowPage(mcdu);
    };
  }
}
