import { DisplayComponent, EventBus, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { FormattedFwcText } from 'instruments/src/EWD/elements/FormattedFwcText';
import { CpiomEwdAvailabilityChecker } from '../EWD';

interface WdCpiomFailedFallbackChecklistComponentProps {
  bus: EventBus;
  visible: Subscribable<boolean>;
  cpiomAvailChecker: CpiomEwdAvailabilityChecker;
}

export class WdCpiomFailedFallbackChecklistComponent extends DestroyableComponent<WdCpiomFailedFallbackChecklistComponentProps> {
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  // 21 lines
  render() {
    return (
      <div class="ProceduresContainer" style={{ display: this.props.visible.map((it) => (it ? 'flex' : 'none')) }}>
        <div class="WarningsColumn">
          <div class="EclLineContainer smaller">
            <div
              class={{
                EclLine: true,
                AbnormalItem: true,
                Headline: true,
              }}
            >
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                width="680"
                height="33"
                style={{
                  display: 'block',
                }}
              >
                <FormattedFwcText x={10} y={24} message={'\x1b<4m\x1b4mFWS\x1bm FWS 1+2 & CPIOM FAULT'} />
              </svg>
            </div>
          </div>
          <EclFallbackLine
            text="-DESCENT TO FL 100/MEA ................INITIATE"
            cyan
            visible={this.props.cpiomAvailChecker.cpiomAFailed}
          />
          <EclFallbackLine
            text="-CAB PRESS MAN MODES : DO NOT USE"
            cyan
            visible={this.props.cpiomAvailChecker.cpiomBFailed}
          />
          <EclFallbackLine
            text="-IN DES,ABV 7000FT: CAB ALT REGULATED TO 7000FT"
            cyan
            visible={this.props.cpiomAvailChecker.cpiomBFailed}
          />
          <EclFallbackLine
            text="-BLW 7000FT: CAB ALT=A/C ALT: AVOID HI DES RATE"
            cyan
            visible={this.props.cpiomAvailChecker.cpiomBFailed}
          />
          <EclFallbackLine
            text="-RAM AIR ....................................ON"
            cyan
            visible={this.props.cpiomAvailChecker.cpiomAFailed}
          />
          <EclFallbackLine
            text="-ALL CROSSFEEDS .............................ON"
            cyan
            visible={this.props.cpiomAvailChecker.cpiomFFailed}
          />
          <EclFallbackLine
            text="-OUTR TK XFR....MAN / EMER OUTR TK XFR"
            cyan
            visible={this.props.cpiomAvailChecker.cpiomFFailed}
          />
          <EclFallbackLine
            text="INR TKS + MID TKS + TRIM TK:NOT USABLE"
            cyan
            visible={this.props.cpiomAvailChecker.cpiomFFailed}
          />
          <EclFallbackLine text="ATC COM VOICE ONLY" cyan visible={this.props.cpiomAvailChecker.cpiomDFailed} />
          <EclFallbackLine
            text="L/G GRVTY EXTN ONLY (MAX SPEED: 220KT)"
            cyan
            visible={this.props.cpiomAvailChecker.cpiomGFailed}
          />
          <EclFallbackLine text="-LDG DIST: COMPUTE" cyan />
          <EclFallbackLine text="-ECAM SD & OVHD PNL ....................MONITOR" cyan />
          <EclFallbackLine text={'\xa0\xa0\xa0FUNCTIONS NOT AVAIL:'} white />
          <EclFallbackLine
            text={'\xa0\xa0\xa0ENG BLEED 1+2+3+4 / WING A-ICE'}
            amber
            visible={this.props.cpiomAvailChecker.cpiomAFailed}
          />
          <EclFallbackLine
            text={'\xa0\xa0\xa0FQMS 1+2 / JETTISON'}
            amber
            visible={this.props.cpiomAvailChecker.cpiomFFailed}
          />
          <EclFallbackLine
            text={'\xa0\xa0\xa0LG CTL 1+2 / A-SKID / N/W + B/W STEER'}
            amber
            visible={this.props.cpiomAvailChecker.cpiomGFailed}
          />
          <EclFallbackLine
            text={'\xa0\xa0\xa0FWD + AFT VENT CTL / TEMP CTL'}
            amber
            visible={this.props.cpiomAvailChecker.cpiomBFailed}
          />
          <EclFallbackLine text={'\xa0\xa0\xa0ECAM WARNINGS & CAUTIONS / ABN PROCEDURES'} amber />
          <EclFallbackLine text={'\xa0\xa0\xa0LIMITATIONS & STATUS / NORM C/L & MEMOS'} amber />
          <EclFallbackLine text={'\xa0\xa0\xa0ALT ALERT & AUTO CALLOUT / F/CTL INDICATIONS'} amber />
        </div>
      </div>
    );
  }
}

interface EclLineProps {
  text: string;
  visible?: Subscribable<boolean>;
  cyan?: boolean;
  amber?: boolean;
  white?: boolean;
}

export class EclFallbackLine extends DisplayComponent<EclLineProps> {
  private readonly invisible = this.props.visible?.map((v) => !(v ?? true));

  render() {
    return (
      <div class={{ EclLineContainer: true, smaller: true, invisible: this.invisible ?? false }}>
        <div
          class={{
            EclLine: true,
            AbnormalItem: true,
            Cyan: this.props.cyan ?? false,
            Amber: this.props.amber ?? false,
            White: this.props.white ?? false,
            LandAnsa: false,
          }}
          style="margin-left: 40px;"
        >
          <span class="EclLineText smaller">{this.props.text}</span>
        </div>
      </div>
    );
  }
}
