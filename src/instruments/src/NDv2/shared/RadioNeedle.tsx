import { FSComponent, DisplayComponent, EventBus, Subject, Subscribable, VNode, MappedSubject } from 'msfssdk';
import { EfisNdMode, EfisSide, NavAidMode } from '@shared/NavigationDisplay';
import { Arinc429Word } from '@shared/arinc429';
import { getSmallestAngle } from 'instruments/src/PFD/PFDUtils';
import { EcpSimVars } from '../../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';
import { VorSimVars } from '../../MsfsAvionicsCommon/providers/VorBusPublisher';
import { AdirsSimVars } from '../../MsfsAvionicsCommon/SimVarTypes';

export interface RadioNeedleProps {
    bus: EventBus,
    headingWord: Subscribable<Arinc429Word>,
    trackWord: Subscribable<Arinc429Word>,
    isUsingTrackUpMode: Subscribable<boolean>,
    index: 1 | 2,
    side: EfisSide,
    mode: EfisNdMode,
}

export class RadioNeedle extends DisplayComponent<RadioNeedleProps> {
    private readonly isVor = Subject.create(false);

    private readonly isAdf = Subject.create(false);

    private readonly trackCorrection = MappedSubject.create(([isUsingTrackUpMode, headingWord, trackWord]) => {
        if (isUsingTrackUpMode) {
            if (headingWord.isNormalOperation() && trackWord.isNormalOperation()) {
                return getSmallestAngle(headingWord.value, trackWord.value);
            }
        }

        return 0;
    }, this.props.isUsingTrackUpMode, this.props.headingWord, this.props.trackWord);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<EcpSimVars>();

        sub.on(`navaidMode${this.props.index}`).whenChanged().handle((mode) => {
            if (mode === NavAidMode.VOR) {
                this.isVor.set(true);
                this.isAdf.set(false);
            } else if (mode === NavAidMode.ADF) {
                this.isAdf.set(true);
                this.isVor.set(false);
            } else {
                this.isAdf.set(false);
                this.isVor.set(false);
            }
        });
    }

    render(): VNode | null {
        return (
            <>
                <VorNeedle
                    bus={this.props.bus}
                    headingWord={this.props.headingWord}
                    trackWord={this.props.trackWord}
                    trackCorrection={this.trackCorrection}
                    index={this.props.index}
                    mode={this.props.mode}
                />
                <AdfNeedle
                    bus={this.props.bus}
                    headingWord={this.props.headingWord}
                    trackWord={this.props.trackWord}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                    index={this.props.index}
                    side={this.props.side}
                    mode={this.props.mode}
                    shown={this.isAdf}
                />
            </>
        );
    }
}

export interface SingleNeedleProps {
    bus: EventBus,
    headingWord: Subscribable<Arinc429Word>,
    trackWord: Subscribable<Arinc429Word>,
    trackCorrection: Subscribable<number>,
    index: 1 | 2,
    mode: EfisNdMode,
}

class VorNeedle extends DisplayComponent<SingleNeedleProps> {
    private readonly ARC_MODE_PATHS = [
        'M384,251 L384,179 M384,128 L384,155 L370,179 L398,179 L384,155 M384,1112 L384,1085 M384,989 L384,1061 L370,1085 L398,1085 L384,1061',
        'M377,251 L377,219 L370,219 L384,195 L398,219 L391,219 L391,251 M384,195 L384,128 M384,1112 L384,1045 M377,989 L377,1045 L391,1045 L391,989',
    ];

    private readonly ROSE_MODE_PATHS = [
        'M384,257 L384,185 M384,134 L384,161 L370,185 L398,185 L384,161 M384,634 L384,607 M384,511 L384,583 L370,607 L398,607 L384,583',
        'M377,257 L377,225 L370,225 L384,201 L398,225 L391,225 L391,256 M384,201 L384,134 M384,634 L384,567 M377,511 L377,567 L391,567 L391,511',
    ];

    private readonly relativeBearing = Subject.create(0);

    private readonly radioAvailable = Subject.create(false);

    // eslint-disable-next-line arrow-body-style
    private readonly availableSub = MappedSubject.create(([radioAvailable, heading, track]) => {
        // TODO in the future we will get the radio values via ARINC429 so this will no longer be needed
        return radioAvailable && heading.isNormalOperation() && track.isNormalOperation();
    }, this.radioAvailable, this.props.headingWord, this.props.trackWord);

    // eslint-disable-next-line arrow-body-style
    private readonly rotationSub = MappedSubject.create(([relativeBearing, trackCorrection]) => {
        return `rotate(${relativeBearing + trackCorrection} 384 ${this.centreHeight})`;
    }, this.relativeBearing, this.props.trackCorrection);

    private readonly needlePaths = Subject.create(['', '']);

    private centreHeight = 0;

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<AdirsSimVars & VorSimVars & EcpSimVars>();

        sub.on(`nav${this.props.index}RelativeBearing`).whenChanged().handle((value) => this.relativeBearing.set(value));
        sub.on(`nav${this.props.index}Available`).whenChanged().handle((value) => this.radioAvailable.set(value));

        switch (this.props.mode) {
        case EfisNdMode.ARC:
            this.needlePaths.set(this.ARC_MODE_PATHS);
            this.centreHeight = 620;
            break;
        case EfisNdMode.ROSE_ILS:
        case EfisNdMode.ROSE_VOR:
        case EfisNdMode.ROSE_NAV:
            this.needlePaths.set(this.ROSE_MODE_PATHS);
            this.centreHeight = 384;
            break;
        default:
            throw new Error(`[VorNeedle] Invalid ND mode: ${this.props.mode}`);
        }
    }

    render(): VNode | null {
        return (
            <g
                visibility={this.availableSub.map((v) => (v ? 'inherit' : 'hidden'))}
                transform={this.rotationSub}
            >
                <path
                    d={this.needlePaths.map((arr) => arr[this.props.index - 1])}
                    strokeWidth={3.7}
                    class="rounded shadow"
                />
                <path
                    d={this.needlePaths.map((arr) => arr[this.props.index - 1])}
                    strokeWidth={3.2}
                    class="rounded White"
                />
            </g>
        );
    }
}

class AdfNeedle extends DisplayComponent<RadioNeedleProps & { shown: Subscribable<boolean> }> {
    render(): VNode | null {
        return <></>;
    }
}
