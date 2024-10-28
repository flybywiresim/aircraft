import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsFplnAirways.scss';
import '../../common/style.scss';
import { AbstractMfdPageProps, MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { PendingAirways } from '@fmgc/flightplanning/plans/PendingAirways';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { AirwayFormat, WaypointFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { NXSystemMessages } from 'instruments/src/MFD/shared/NXSystemMessages';
import { FmcInterface } from 'instruments/src/MFD/FMC/FmcInterface';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { Fix } from '@flybywiresim/fbw-sdk';
import { DisplayInterface } from '@fmgc/flightplanning/interface/DisplayInterface';

interface MfdFmsFplnAirwaysProps extends AbstractMfdPageProps {}

export class MfdFmsFplnAirways extends FmsPage<MfdFmsFplnAirwaysProps> {
  private revisedFixIdent = Subject.create<string>('');

  private airwayLinesRef = FSComponent.createRef<HTMLDivElement>();

  private displayFromLine = Subject.create<number>(0);

  private disabledScrollDown = Subject.create(true);

  private disabledScrollUp = Subject.create(true);

  private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private tmpyFplnButtonDiv = FSComponent.createRef<HTMLDivElement>();

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
            pendingAirways={this.loadedFlightPlan.pendingAirways}
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
          pendingAirways={this.loadedFlightPlan.pendingAirways}
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
                  this.loadedFlightPlan.pendingAirways?.finalize();
                  this.loadedFlightPlan.pendingAirways = undefined; // Reset, so it's not finalized twice when performing tmpy insert
                  this.props.fmcService.master?.resetRevisedWaypoint();
                  this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
                }
              }}
              buttonStyle="color: #ffff00;"
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
  mfd: DisplayInterface & MfdDisplayInterface;
  pendingAirways: PendingAirways;
  fromFix: Fix;
  isFirstLine: boolean;
  nextLineCallback: (f: Fix) => void;
}

class AirwayLine extends DisplayComponent<AirwayLineProps> {
  public viaField = Subject.create<string | null>(null);

  private viaFieldDisabled = Subject.create(false);

  public toField = Subject.create<string | null>(null);

  private toFieldDisabled = Subject.create(this.props.isFirstLine);

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
              if (!v) {
                return false;
              }

              if (v === 'DCT' && !this.props.isFirstLine) {
                this.viaFieldDisabled.set(true);
                return true;
              }

              const airways = await NavigationDatabaseService.activeDatabase.searchAirway(v, this.props.fromFix);
              if (airways.length === 0) {
                this.props.fmc.showFmsErrorMessage(FmsErrorType.NotInDatabase);
                return false;
              }

              const success = this.props.pendingAirways.thenAirway(airways[0]);
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
            disabled={this.viaFieldDisabled}
            alignText="center"
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
              if (!v) {
                return false;
              }

              if (this.viaField.get() === null) {
                this.viaField.set('DCT');
                this.viaFieldDisabled.set(true);
              }

              let chosenFix: Fix | undefined = undefined;

              if (this.viaField.get() !== 'DCT') {
                try {
                  chosenFix = await this.props.pendingAirways.fixAlongTailAirway(v);
                } catch (msg: unknown) {
                  if (msg instanceof FmsError) {
                    this.props.fmc.showFmsErrorMessage(msg.type);
                  }
                  return false;
                }
              } else {
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
                }
              }

              if (!chosenFix) {
                return false;
              }

              const success = this.props.pendingAirways.thenTo(chosenFix);
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
            disabled={this.toFieldDisabled}
            alignText="center"
            errorHandler={(e) => this.props.fmc.showFmsErrorMessage(e)}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
          />
        </div>
      </div>
    );
  }
}
