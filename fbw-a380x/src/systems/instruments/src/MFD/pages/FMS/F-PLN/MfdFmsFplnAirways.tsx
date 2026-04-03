import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsFplnAirways.scss';
import '../../common/style.scss';
import { AbstractMfdPageProps, MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { AirwayFormat, WaypointFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { NXSystemMessages } from 'instruments/src/MFD/shared/NXSystemMessages';
import { FmcInterface } from 'instruments/src/MFD/FMC/FmcInterface';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { Fix } from '@flybywiresim/fbw-sdk';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';

interface MfdFmsFplnAirwaysProps extends AbstractMfdPageProps {}

export class MfdFmsFplnAirways extends FmsPage<MfdFmsFplnAirwaysProps> {
  private readonly revisedFixIdent = Subject.create<string>('');

  private readonly airwayLinesRef = FSComponent.createRef<HTMLDivElement>();

  private readonly displayFromLine = Subject.create<number>(0);

  private readonly disabledScrollDown = Subject.create(true);

  private readonly disabledScrollUp = Subject.create(true);

  private readonly returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private readonly tmpyFplnButtonDiv = FSComponent.createRef<HTMLDivElement>();

  protected onNewData(): void {
    const revWpt = this.props.fmcService.master?.revisedWaypoint();
    if (revWpt) {
      this.revisedFixIdent.set(revWpt.ident);
    }
  }

  private renderNextLine(fromFix: Fix): void {
    if (this.airwayLinesRef.getOrDefault()) {
      // Render max. 10 items for now
      if (
        this.airwayLinesRef.instance.children.length <= 10 &&
        this.props.fmcService.master &&
        this.loadedFlightPlan?.pendingAirways
      ) {
        const line = (
          <AirwayLine
            fmc={this.props.fmcService.master}
            mfd={this.props.mfd}
            tmpyActive={this.tmpyActive}
            loadedFlightPlan={this.loadedFlightPlan}
            fromFix={fromFix}
            isFirstLine={false}
            nextLineCallback={(fix) => this.renderNextLine(fix)}
          />
        );
        FSComponent.render(line, this.airwayLinesRef.instance);
      }
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.tmpyActive.sub((v) => {
        if (this.returnButtonDiv.getOrDefault() && this.tmpyFplnButtonDiv.getOrDefault()) {
          this.returnButtonDiv.instance.style.visibility = v ? 'hidden' : 'visible';
          this.tmpyFplnButtonDiv.instance.style.visibility = v ? 'visible' : 'hidden';
        }
      }, true),
    );

    const revWpt = this.props.fmcService.master?.revisedWaypoint();
    if (
      this.props.fmcService.master &&
      this.loadedFlightPlan?.pendingAirways &&
      revWpt &&
      this.airwayLinesRef.getOrDefault()
    ) {
      const firstLine = (
        <AirwayLine
          fmc={this.props.fmcService.master}
          mfd={this.props.mfd}
          tmpyActive={this.tmpyActive}
          loadedFlightPlan={this.loadedFlightPlan}
          fromFix={revWpt}
          isFirstLine
          nextLineCallback={(fix) => this.renderNextLine(fix)}
        />
      );
      FSComponent.render(firstLine, this.airwayLinesRef.instance);
    }
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="fc" style="margin-top: 15px;">
          <div class="fr aic">
            <span class="mfd-label" style="margin-left: 15px;">
              AIRWAYS FROM
            </span>
            <span
              class={{
                'mfd-value': true,
                bigger: true,
                'mfd-fms-yellow-text': this.tmpyActive,
              }}
              style="margin-left: 20px;"
            >
              {this.revisedFixIdent}
            </span>
          </div>
          <div ref={this.airwayLinesRef} class="mfd-fms-fpln-awy-awy-container" />
        </div>
        <div class="fr jcc">
          <IconButton
            icon="double-down"
            onClick={() => this.displayFromLine.set(this.displayFromLine.get() + 1)}
            disabled={this.disabledScrollDown}
            containerStyle="width: 60px; height: 60px; margin-right: 20px;"
          />
          <IconButton
            icon="double-up"
            onClick={() => this.displayFromLine.set(this.displayFromLine.get() - 1)}
            disabled={this.disabledScrollUp}
            containerStyle="width: 60px; height: 60px;"
          />
        </div>
        <div style="flex-grow: 1" />
        <div class="mfd-fms-bottom-button-row">
          <div ref={this.returnButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
            <Button
              label="RETURN"
              onClick={() => {
                this.props.fmcService.master?.resetRevisedWaypoint();
                this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
              }}
            />
          </div>
          <div ref={this.tmpyFplnButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
            <Button
              label="TMPY F-PLN"
              onClick={async () => {
                if (this.loadedFlightPlan) {
                  await this.loadedFlightPlan.finaliseAirwayEntry();
                  this.loadedFlightPlan.pendingAirways = undefined; // Reset, so it's not finalized twice when performing tmpy insert
                  this.props.fmcService.master?.resetRevisedWaypoint();
                  this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
                }
              }}
              buttonStyle="color: #ffd200;"
            />
          </div>
        </div>
        {/* end page content */}
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}

interface AirwayLineProps extends ComponentProps {
  fmc: FmcInterface;
  mfd: FmsDisplayInterface & MfdDisplayInterface;
  tmpyActive: Subject<boolean>;
  loadedFlightPlan: FlightPlan;
  fromFix: Fix;
  isFirstLine: boolean;
  nextLineCallback: (f: Fix) => void;
}

class AirwayLine extends DisplayComponent<AirwayLineProps> {
  public readonly viaField = Subject.create<string | null>(null);

  private readonly viaFieldDisabled = Subject.create(false);

  public readonly toField = Subject.create<string | null>(null);

  private readonly toFieldDisabled = Subject.create(false);

  render(): VNode {
    return (
      <div class="fr mfd-fms-awy-line-container">
        <div class="fr aic">
          <div class="mfd-label" style="margin-right: 5px;">
            VIA
          </div>
          <InputField<string>
            dataEntryFormat={new AirwayFormat()}
            dataHandlerDuringValidation={async (v) => {
              if (!v || this.viaFieldDisabled.get()) {
                return false;
              }

              if (v === 'DCT') {
                this.viaFieldDisabled.set(!this.props.isFirstLine);
                this.toFieldDisabled.set(false);
                return true;
              }

              const airways = await NavigationDatabaseService.activeDatabase.searchAirway(v, this.props.fromFix);
              if (airways.length === 0) {
                this.props.fmc.showFmsErrorMessage(FmsErrorType.NotInDatabase);
                return false;
              }

              const success = await this.props.loadedFlightPlan.continueAirwayEntryViaAirway(airways[0]);
              if (success) {
                this.viaFieldDisabled.set(true);
                this.toFieldDisabled.set(false);
              } else {
                this.props.fmc.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
              }
              return success;
            }}
            canBeCleared={Subject.create(false)}
            value={this.viaField}
            alignText="center"
            class="yellow-when-disabled"
            disabled={this.viaFieldDisabled}
            errorHandler={(e) => this.props.fmc.showFmsErrorMessage(e)}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
          />
        </div>
        <div class="fr aic">
          <div class="mfd-label" style="margin-right: 5px;">
            TO
          </div>
          <InputField<string>
            dataEntryFormat={new WaypointFormat()}
            dataHandlerDuringValidation={async (v) => {
              if (!v || this.toFieldDisabled.get()) {
                return false;
              }

              if (this.viaField.get() === null) {
                this.viaField.set('DCT');
              }

              let chosenFix: Fix | undefined = undefined;
              const isDct = this.viaField.get() === 'DCT';

              if (this.viaField.get() !== 'DCT') {
                try {
                  chosenFix = this.props.loadedFlightPlan.pendingAirways?.fixAlongTailAirway(v);
                } catch (msg: unknown) {
                  if (msg instanceof FmsError) {
                    this.props.fmc.showFmsErrorMessage(msg.type);
                  }
                  return false;
                }
              } else {
                this.viaFieldDisabled.set(true);
                const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(v);
                if (fixes.length === 0) {
                  this.props.fmc.showFmsErrorMessage(FmsErrorType.NotInDatabase);
                  return false;
                }

                if (fixes.length > 1) {
                  const dedup = await this.props.fmc.deduplicateFacilities(fixes);
                  if (dedup !== undefined) {
                    chosenFix = dedup;
                  }
                } else {
                  chosenFix = fixes[0];
                }
              }

              if (!chosenFix) {
                return false;
              }

              const success = await this.props.loadedFlightPlan.continueAirwayEntryToFix(chosenFix, isDct);
              if (success) {
                this.toFieldDisabled.set(true);
                this.props.nextLineCallback(chosenFix);
              } else {
                this.props.fmc.addMessageToQueue(NXSystemMessages.noIntersectionFound, undefined, undefined);
              }
              return success;
            }}
            canBeCleared={Subject.create(false)}
            value={this.toField}
            alignText="center"
            class="yellow-when-disabled"
            disabled={this.toFieldDisabled}
            errorHandler={(e) => this.props.fmc.showFmsErrorMessage(e)}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
          />
        </div>
      </div>
    );
  }
}
