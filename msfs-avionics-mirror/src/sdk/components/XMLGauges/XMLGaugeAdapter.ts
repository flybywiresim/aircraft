/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />
/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/BaseInstrument" />

import { EventBus } from '../../data';
import * as d from './GaugeDefinitions';
import { XMLTextColumnProps, XMLTextElementProps } from './TextElement';

/**
 * The type of gauges available, as defined in XMLEngineDisplay.js.
 */
export enum XMLGaugeType {
  Circular = 'Circular',
  Horizontal = 'Horizontal',
  DoubleHorizontal = 'DoubleHorizontal',
  Vertical = 'Vertical',
  DoubleVertical = 'DoubleVertical',
  Text = 'Text',
  ColumnGroup = 'ColumnGroup',
  Column = 'Column',
  Cylinder = 'Cylinder',
  TwinCylinder = 'TwinCylinder',
}


/**
 * The specification for a single gauge configuration.
 */
export type XMLGaugeSpec = {
  /** The type of gauge this is. */
  gaugeType: XMLGaugeType,
  /** The correct configuration interface for this gauge type. */
  configuration: d.XMLGaugeProps | d.GaugeColumnProps | d.GaugeColumnGroupProps | XMLTextElementProps
}

/**
 * The data for a function.
 */
export type XMLFunction = {
  /** The function's name. */
  name: string,
  /** The XML logic the function runs. */
  logic: CompositeLogicXMLElement,
}

/**
 * A full set of gauges.
 */
export type XMLExtendedGaugeConfig = {
  /** Whether this should override the temporary enhanced default configs. */
  override: boolean,
  /** Any configured functions. */
  functions: Map<string, XMLFunction>,
  /** The engine page. */
  enginePage: Array<XMLGaugeSpec>,
  /** The lean page, if it exists. */
  leanPage?: Array<XMLGaugeSpec>,
  /** The system page, if it exists. */
  systemPage?: Array<XMLGaugeSpec>
}

/**
 * Parse an XMLEngineDisplay configuration into an array of gauge specs.
 */
export class XMLGaugeConfigFactory {
  private instrument: BaseInstrument;
  private bus: EventBus;

  /**
   * Create an XMLGaugeConfigFactory.
   * @param instrument The instrument that holds this engine display.
   * @param bus An event bus for gauges that need it.
   */
  public constructor(instrument: BaseInstrument, bus: EventBus) {
    this.instrument = instrument;
    this.bus = bus;
  }

  /**
   * Convenience method to take a full XML instrument config and parse out the display config
   * section. This will check first to see if we are using an enhanced, multi-page config by
   * looking for an EnginePage tag in the EngineDisplay element.   If it finds it, it will
   * assume we have an advanced config, and return the content along with that of LeanPage
   * and SystemPag, if present.  If no EnginePage exists, we assume we're dealing with a
   * legacy configuration and just return the content of EngineDisplay itself as our engine
   * page with everything else undefined.
   * @param document The XML configuation document.
   * @returns An XMLEnhancedGaugeConfig with the full gauge configuration.
   */
  public parseConfig(document: Document): XMLExtendedGaugeConfig {
    const gaugeSpecs = new Array<XMLGaugeSpec>();
    const functions = new Map<string, XMLFunction>();
    const displayConfig = document.getElementsByTagName('EngineDisplay');
    if (displayConfig.length == 0) {
      return { override: false, functions: functions, enginePage: gaugeSpecs };
    } else {
      for (const func of document.getElementsByTagName('Function')) {
        const funcSpec = this.makeFunction(func);
        if (funcSpec !== undefined) {
          functions.set(funcSpec.name, funcSpec);
        }
      }
      const override = displayConfig[0].getAttribute('override')?.toLowerCase() === 'true';
      const enginePages = displayConfig[0].getElementsByTagName('EnginePage');
      if (enginePages.length == 0) {
        return { override: override, functions: functions, enginePage: this._parseConfig(displayConfig[0]) };
      }

      const leanPages = displayConfig[0].getElementsByTagName('LeanPage');
      const systemPages = displayConfig[0].getElementsByTagName('SystemPage');

      return {
        override: override,
        functions: functions,
        enginePage: this._parseConfig(enginePages[0]),
        leanPage: leanPages.length > 0 ? this._parseConfig(leanPages[0]) : undefined,
        systemPage: systemPages.length > 0 ? this._parseConfig(systemPages[0]) : undefined
      };
    }
  }

  /**
   * Parse an engine display setup.
   * @param config An instrument XML config document.
   * @returns An array of the gauges defined in the configuration.
   */
  private _parseConfig(config: Element): Array<XMLGaugeSpec> {
    const gaugeSpecs = new Array<XMLGaugeSpec>();
    if (config.children.length == 0) {
      return gaugeSpecs;
    }

    for (const gauge of config.children) {
      switch (gauge.tagName) {
        case 'Gauge':
          switch (gauge.getElementsByTagName('Type')[0]?.textContent) {
            case 'Circular':
              gaugeSpecs.push({
                gaugeType: XMLGaugeType.Circular,
                configuration: this.createCircularGauge(gauge)
              });
              break;
            case 'Horizontal':
              gaugeSpecs.push({
                gaugeType: XMLGaugeType.Horizontal,
                configuration: this.createHorizontalGauge(gauge)
              });
              break;
            case 'DoubleHorizontal':
              gaugeSpecs.push({
                gaugeType: XMLGaugeType.DoubleHorizontal,
                configuration: this.createDoubleHorizontalGauge(gauge)
              });
              break;
            case 'Vertical':
              gaugeSpecs.push({
                gaugeType: XMLGaugeType.Vertical,
                configuration: this.createVerticalGauge(gauge)
              });
              break;
            case 'DoubleVertical':
              gaugeSpecs.push({
                gaugeType: XMLGaugeType.DoubleVertical,
                configuration: this.createDoubleVerticalGauge(gauge)
              });
              break;
            case 'Cylinder':
              gaugeSpecs.push({
                gaugeType: XMLGaugeType.Cylinder,
                configuration: this.createCylinderGauge(gauge)
              });
              break;
            case 'TwinCylinder':
              gaugeSpecs.push({
                gaugeType: XMLGaugeType.TwinCylinder,
                configuration: this.createCylinderGauge(gauge)
              });
              break;
          }
          break;
        case 'Text':
          {
            const textProps: XMLTextElementProps = {};
            const className = gauge.getAttribute('id');
            if (className !== null) {
              textProps.class = className;
            }

            const leftElem = gauge.getElementsByTagName('Left');
            if (leftElem.length > 0) {
              textProps.left = this.makeTextColumn(leftElem[0]);
            }

            const centerElem = gauge.getElementsByTagName('Center');
            if (centerElem.length > 0) {
              textProps.center = this.makeTextColumn(centerElem[0]);
            }

            const rightElem = gauge.getElementsByTagName('Right');
            if (rightElem.length > 0) {
              textProps.right = this.makeTextColumn(rightElem[0]);
            }

            const style = XMLGaugeConfigFactory.parseStyleDefinition(gauge.getElementsByTagName('Style'));
            if (style !== undefined) {
              textProps.style = style;
            }

            gaugeSpecs.push({
              gaugeType: XMLGaugeType.Text,
              configuration: textProps
            });
          }
          break;
        case 'ColumnGroup':
          gaugeSpecs.push({
            gaugeType: XMLGaugeType.ColumnGroup,
            configuration: this.createColumnGroup(gauge)
          });
          break;
        case 'Column':
          gaugeSpecs.push({
            gaugeType: XMLGaugeType.Column,
            configuration: this.createColumn(gauge)
          });
          break;
      }
    }
    return gaugeSpecs;
  }

  /**
   * Construct a single column of text for a text element.  This can be any
   * one of Left, Right, or Center.
   * @param columnDef The XML definition for the given column.
   * @returns an XMLTextColumn configuration.
   */
  private makeTextColumn(columnDef: Element): XMLTextColumnProps {
    const contentElem = columnDef.getElementsByTagName('Content');
    const config: XMLTextColumnProps = {
      content: new CompositeLogicXMLElement(this.instrument, contentElem.length > 0 ? contentElem[0] : columnDef)
    };

    const colorElem = columnDef.getElementsByTagName('Color');
    if (colorElem.length > 0) {
      config.color = new CompositeLogicXMLElement(this.instrument, colorElem[0]);
    }

    const className = columnDef.getAttribute('id');
    if (className !== null) {
      config.class = className;
    }

    const fontSize = columnDef.getAttribute('fontsize');
    if (fontSize !== null) {
      config.fontSize = fontSize;
    }
    return config;
  }

  /**
   * Make a function.
   * @param functionDef The XML definition for the function.
   * @returns an XMLFunction type or undefined if there's an error
   */
  private makeFunction(functionDef: Element): XMLFunction | undefined {
    const name = functionDef.getAttribute('Name');
    if (!name || functionDef.children.length == 0) {
      return undefined;
    }

    return {
      name: name,
      logic: new CompositeLogicXMLElement(this.instrument, functionDef)
    };
  }

  /**
   * Create a base XMLGaugeProps definition.  This will be combined with the
   * props for a speciific gauge type to fully define the config interface.
   * @param gauge The gauge definition
   * @returns A set of XMLGaugeProps
   */
  private parseGaugeDefinition(gauge: Element): Partial<d.XMLGaugeProps> {
    // TODO Maybe make this use getAndAssign, too?
    const props: Partial<d.XMLGaugeProps> = {};
    /**
     * A closure to make our variable assignments easier.
     * @param prop The property we want to assign.
     * @param tag The HTML tag to get the value from.
     * @param converter A converter function.
     */
    const assign = (prop: keyof d.XMLGaugeProps, tag: string, converter: any = (v: any): any => { return v; }): void => {
      XMLGaugeConfigFactory.getAndAssign(props, gauge, prop, tag, converter);
    };

    const colorZones = this.makeColorZones(gauge.getElementsByTagName('ColorZone'));
    if (colorZones !== undefined) {
      props.colorZones = colorZones;
    }

    const colorLines = this.makeColorLines(gauge.getElementsByTagName('ColorLine'));
    if (colorLines !== undefined) {
      props.colorLines = colorLines;
    }

    const referenceBugs = this.makeReferenceBugs(gauge.getElementsByTagName('ReferenceBug'));
    if (referenceBugs !== undefined) {
      props.referenceBugs = referenceBugs;
    }

    const createLogicElement = (el: Element | undefined): CompositeLogicXMLElement | undefined => {
      if (el !== undefined) {
        return new CompositeLogicXMLElement(this.instrument, el);
      }

      return undefined;
    };

    props.minimum = createLogicElement(gauge.getElementsByTagName('Minimum')[0]);
    props.maximum = createLogicElement(gauge.getElementsByTagName('Maximum')[0]);
    props.value1 = createLogicElement(gauge.getElementsByTagName('Value')[0]);
    props.value2 = createLogicElement(gauge.getElementsByTagName('Value2')[0]);

    assign('title', 'Title', (v: string) => { return v ? v : ''; });
    assign('unit', 'Unit', (v: string) => { return v ? v : ''; });
    assign('graduationLength', 'GraduationLength', parseFloat);
    props.graduationHasText = gauge.getElementsByTagName('GraduationLength')[0]?.getAttribute('text') == 'True';
    assign('beginText', 'BeginText');
    assign('endText', 'EndText');
    assign('cursorText1', 'CursorText', (v: string) => { return v ? v : ''; });
    assign('cursorText2', 'CursorText2', (v: string) => { return v ? v : ''; });
    assign('id', 'ID');
    props.redBlink = createLogicElement(gauge.getElementsByTagName('RedBlink')[0]);
    return props;
  }

  // The logic for creating these gauges is a little intricate and repeats a number of times.
  // To avoid having redundant comments, here's the general plan for what's happening.
  //
  // First, we create an instance of the gauge's style interface in several steps. These
  // take advantage of the fact that almost all of the props on on the interfaces are optional
  // to allow us to compose the gauge-specific interface in pieces.
  //
  // 1) The gauge-specific create function passes the Style element to the generic
  //    parseStyleDefinition function, which returns an interface that has all of the
  //    universal style properties.
  // 2) The function then creates its own gauge-specific style interface using parsing logic
  //    unique to the gauge.
  // 3) The values of the generic interface are then assigned to the object-specific one so
  //    that we have one interface with all the styling information needed.
  //
  // Next, we repeat the same process with the rest of the gauge definitions.   At this point,
  // the primary way in which the shapes of the interfaces differ is in what their style
  // definitions look like, so the second phase is just another assignment compositing the
  // custom-derived style and the remainder of the generic definiton as retrieved from the
  // parseGaugeDefinition method.
  //
  // We play a bit fast and loose with properties here and don't really do any confirmation
  // that the gauge definitions we get are valid.  The user could, for example, provide a
  // <Value2> property to a gauge that only has one value and that would be populated in the
  // configuration.   It would be harmless, because it would be ignored by the gauge code,
  // but it's still kind of gross.
  //
  // This models how the standard XMLEngineDisplay.js works.  In the future we might want to
  // tighten this up with better type checking and error throwing, in which case we can expand
  // these functions to use a bit more logic in this second phase when they're composing
  // the final configuration instance.
  //
  // Ok, on with the show.

  /**
   * Create a circular gauge.
   * @param gaugeDef An XML element defining the gauge.
   * @returns The props for this gauge.
   */
  private createCircularGauge(gaugeDef: Element): Partial<d.XMLCircularGaugeProps> {
    const styleElem = gaugeDef.getElementsByTagName('Style');
    const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
    let style: Partial<d.XMLCircularGaugeStyle> = {};
    const innerElem = styleElem[0];
    if (innerElem !== undefined) {
      /**
       * A closure to make our variable assignments easier.
       * @param prop The property we want to assign.
       * @param tag The HTML tag to get the value from.
       * @param converter A converter function.
       */
      const assign = (prop: keyof d.XMLCircularGaugeStyle, tag: string, converter: any = (v: any): any => { return v; }): void => {
        XMLGaugeConfigFactory.getAndAssign(style, innerElem, prop, tag, converter);
      };

      assign('forceTextColor', 'ForceTextColor');
      assign('textIncrement', 'TextIncrement', parseFloat);
      assign('beginAngle', 'BeginAngle', parseFloat);
      assign('endAngle', 'EndAngle', parseFloat);
      assign('cursorType', 'CursorType', (v: string) => { return v == 'Triangle' ? d.XMLCircularGaugeCursor.Triangle : undefined; });
      assign('valuePos', 'ValuePos', (v: string) => { return v == 'End' ? d.XMLCircularGaugeValuePos.End : undefined; });
      assign('valuePrecision', 'ValuePrecision', parseInt);
    }

    style = Object.assign(style, genericStyle);
    return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
  }

  /**
   * Create a horizontal gauge.
   * @param gaugeDef An XML element defining the gauge.
   * @returns The props for this gauge.
   */
  private createHorizontalGauge(gaugeDef: Element): Partial<d.XMLHorizontalGaugeProps> {
    const styleElem = gaugeDef.getElementsByTagName('Style');
    const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
    let style: Partial<d.XMLHorizontalGaugeStyle> = {};
    const innerElem = styleElem[0];
    if (innerElem !== undefined) {
      /**
       * A closure to make our variable assignments easier.
       * @param prop The property we want to assign.
       * @param tag The HTML tag to get the value from.
       * @param converter A converter function.
       */
      const assign = (prop: keyof d.XMLHorizontalGaugeStyle, tag: string, converter: any = (v: any): any => { return v; }): void => {
        XMLGaugeConfigFactory.getAndAssign(style, innerElem, prop, tag, converter);
      };

      assign('valuePos', 'ValuePos', (v: string) => {
        switch (v) {
          case 'Right':
            return d.XMLHorizontalGaugeValuePos.Right;
          case 'End':
            return d.XMLHorizontalGaugeValuePos.End;
          default:
            return undefined;
        }
      });

      assign('textIncrement', 'TextIncrement', parseFloat);
      assign('cursorColor', 'CursorColor');
      assign('width', 'Width', parseFloat);
      assign('reverseY', 'ReverseY', (v: string) => { return v == 'True'; });
      assign('valuePrecision', 'ValuePrecision', parseInt);
    }

    style = Object.assign(style, genericStyle);
    return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
  }

  /**
   * Create a double horizontal gauge.
   * @param gaugeDef An XML element defining the gauge.
   * @returns The props for this gauge.
   */
  private createDoubleHorizontalGauge(gaugeDef: Element): Partial<d.XMLDoubleHorizontalGaugeProps> {
    const styleElem = gaugeDef.getElementsByTagName('Style');
    const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
    let style: Partial<d.XMLDoubleHorizontalGaugeStyle> = {};
    if (styleElem[0] !== undefined) {
      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'textIncrement', 'TextIncrement', parseFloat);
      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'valuePrecision', 'ValuePrecision', parseInt);

      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'valuePos', 'ValuePos', (v: string): any => {
        return v == 'Right' ? d.XMLDoubleHorizontalGaugeValuePos.Right : undefined;
      });
      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'pointerStyle', 'PointerStyle', (v: string): any => {
        return v == 'Arrow' ? 'arrow' : 'standard';
      });
    }
    style = Object.assign(style, genericStyle);
    return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
  }

  /**
   * Create a single vertical gauge.
   * @param gaugeDef An XML element defining the gauge.
   * @returns The props for this gauge.
   */
  private createVerticalGauge(gaugeDef: Element): Partial<d.XMLVerticalGaugeProps> {
    const styleElem = gaugeDef.getElementsByTagName('Style');
    const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
    let style: Partial<d.XMLVerticalGaugeStyle> = {};
    if (styleElem[0] !== undefined) {
      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'textIncrement', 'TextIncrement', parseFloat);
    }
    style = Object.assign(style, genericStyle);
    return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
  }

  /**
   * Create a double vertical gauge.
   * @param gaugeDef An XML element defining the gauge.
   * @returns The props for this gauge.
   */
  private createDoubleVerticalGauge(gaugeDef: Element): Partial<d.XMLDoubleVerticalGaugeProps> {
    const styleElem = gaugeDef.getElementsByTagName('Style');
    const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
    let style: Partial<d.XMLDoubleVerticalGaugeStyle> = {};
    if (styleElem[0] !== undefined) {
      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'textIncrement', 'TextIncrement', parseFloat);
      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'height', 'Height', parseFloat);
    }
    style = Object.assign(style, genericStyle);
    return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
  }

  /**
   * Create a cylinder gauge.
   * @param gaugeDef An XML element defining the gauge.
   * @returns The props for this gauge.
   */
  private createCylinderGauge(gaugeDef: Element): Partial<d.XMLCylinderGaugeProps> {
    const styleElem = gaugeDef.getElementsByTagName('Style');
    const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
    const columnElems = gaugeDef.getElementsByTagName('Columns');
    const rowElems = gaugeDef.getElementsByTagName('Rows');
    const config: Partial<d.XMLCylinderGaugeProps> = this.parseGaugeDefinition(gaugeDef);
    config.bus = this.bus;
    let style: Partial<d.XMLCylinderGaugeStyle> = {};
    if (styleElem[0] !== undefined) {
      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'textIncrement', 'TextIncrement', parseFloat);
      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'redline', 'ShowRedline', (text: string) => { return text == 'True'; });
      XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'peakTemps', 'ShowPeak', (text: string) => { return text == 'True'; });
    }
    style = Object.assign(style, genericStyle);
    config.style = style;


    if (columnElems.length > 0) {
      config.numColumns = new CompositeLogicXMLElement(this.instrument, columnElems[0]);
    }

    if (rowElems.length > 0) {
      config.numRows = new CompositeLogicXMLElement(this.instrument, rowElems[0]);
    }

    XMLGaugeConfigFactory.getAndAssign(config, gaugeDef, 'tempOrder', 'TempOrder', (text: string) => {
      const tempOrder = new Array<number>();
      for (const item of text.split(',')) {
        tempOrder.push(parseInt(item));
      }
      return tempOrder;
    });


    return config;
  }

  /**
   * Create a column group.
   * @param gaugeDef AN XML element defining the group.
   * @returns The props for the group with all contained columns.
   */
  private createColumnGroup(gaugeDef: Element): d.GaugeColumnGroupProps {
    const columns = new Array<d.GaugeColumnProps>();
    const children = gaugeDef.children;
    for (const child of children) {
      if (child.tagName == 'Column') {
        columns.push(this.createColumn(child));
      }
    }
    const group: d.GaugeColumnGroupProps = {
      bus: this.bus,
      columns: columns
    };
    XMLGaugeConfigFactory.getAndAssign(group, gaugeDef, 'id', 'id');
    return group;
  }

  /**
   * Create a column of gauges.
   * @param gaugeDef An XML element defining the column.
   * @returns The props of the column with all contained gauges.
   */
  private createColumn(gaugeDef: Element): d.GaugeColumnProps {
    const column: d.GaugeColumnProps = { gauges: this._parseConfig(gaugeDef) };
    XMLGaugeConfigFactory.getAndAssign(column, gaugeDef, 'id', 'id');
    XMLGaugeConfigFactory.getAndAssign(column, gaugeDef, 'width', 'width', parseFloat);
    return column;
  }

  // Utility functions.

  /**
   * Check the value of a setting and, if it's defined, assign it to the
   * property of an object with optional type conversion.
   * @param obj The object to manipulate.
   * @param elem The element to get the value from.
   * @param prop The name of the property to set.
   * @param tag The tag name to retrieve.
   * @param converter A type conversion used if the value is defined.
   */
  private static getAndAssign<P extends Partial<d.XMLGaugeProps> | Partial<d.XMLGaugeStyle>, K extends keyof P>(
    obj: P,
    elem: Element,
    prop: K,
    tag: string,
    converter: (val: any) => P[K] | undefined = (val: any): P[K] => { return val; }
  ): void {
    const value = elem.getElementsByTagName(tag)[0]?.textContent;
    if (value === null || value === undefined) {
      return;
    }
    const newVal = converter(value);
    if (newVal !== undefined) {
      obj[prop] = newVal;
    }
  }

  /**
   * Create a basic XML style from a gauge definition.
   * @param styleDoc A style definition block
   * @returns An XMLGaugeStyle
   */
  private static parseStyleDefinition(styleDoc: HTMLCollectionOf<Element>): Partial<d.XMLGaugeStyle> {
    const style: Partial<d.XMLGaugeStyle> = {};
    if (styleDoc.length > 0) {
      XMLGaugeConfigFactory.getAndAssign(style, styleDoc[0], 'sizePercent', 'SizePercent', parseFloat);

      const marginsElem = styleDoc[0].getElementsByTagName('Margins');
      if (marginsElem.length > 0 && marginsElem[0]?.textContent !== null) {
        XMLGaugeConfigFactory.getAndAssign(style, marginsElem[0], 'marginLeft', 'Left', parseFloat);
        XMLGaugeConfigFactory.getAndAssign(style, marginsElem[0], 'marginRight', 'Right', parseFloat);
        XMLGaugeConfigFactory.getAndAssign(style, marginsElem[0], 'marginTop', 'Top', parseFloat);
        XMLGaugeConfigFactory.getAndAssign(style, marginsElem[0], 'marginBottom', 'Bottom', parseFloat);
      }
    }
    return style;
  }

  /**
   * Get the SmoothFactor value from a gauge definition if present.
   * @param element The HTML element to search for the parameter.
   * @returns The smoothing factor as a number, or undefined if not found.
   */
  private parseSmoothFactor(element: Element): number | undefined {
    const smoothElem = element.getElementsByTagName('SmoothFactor');
    if (smoothElem.length > 0 && smoothElem[0]?.textContent !== null) {
      return smoothElem.length > 0 ? parseFloat(smoothElem[0].textContent) : undefined;
    }
  }

  /**
   * Create an array of color zones if a definition exists.
   * @param zones An array of color zone definitions.
   * @returns An array of XMLGaugeColorZones
   */
  private makeColorZones(zones: HTMLCollectionOf<Element>): Array<d.XMLGaugeColorZone> | undefined {
    const zoneArray = new Array<d.XMLGaugeColorZone>();
    for (let i = 0; i < zones.length; i++) {
      let color = 'white';
      const colorElem = zones[i].getElementsByTagName('Color');
      if (colorElem.length > 0) {
        color = colorElem[0]?.textContent ? colorElem[0]?.textContent : 'white';
      }
      zoneArray.push({
        color: color,
        begin: new CompositeLogicXMLElement(this.instrument, zones[i].getElementsByTagName('Begin')[0]),
        end: new CompositeLogicXMLElement(this.instrument, zones[i].getElementsByTagName('End')[0]),
        smoothFactor: this.parseSmoothFactor(zones[i])
      });
    }
    return zoneArray.length > 0 ? zoneArray : undefined;
  }

  /**
   * Create an array of color lines if a definition exists.
   * @param lines An array of color line definitions.
   * @returns An array of XMLGaugeColorLines
   */
  private makeColorLines(lines: HTMLCollectionOf<Element>): Array<d.XMLGaugeColorLine> | undefined {
    const lineArray = new Array<d.XMLGaugeColorLine>();
    for (let i = 0; i < lines.length; i++) {
      let color = 'white';
      const colorElem = lines[i].getElementsByTagName('Color');
      if (colorElem.length > 0) {
        color = colorElem[0]?.textContent ? colorElem[0]?.textContent : 'white';
      }
      lineArray.push({
        color: color,
        position: new CompositeLogicXMLElement(this.instrument, lines[i].getElementsByTagName('Position')[0]),
        smoothFactor: this.parseSmoothFactor(lines[i])
      });
    }
    return lineArray.length > 0 ? lineArray : undefined;
  }

  /**
   * Create an array of reference bugs if a definition exists.
   * @param bugs An array of reference bug definitions.
   * @returns An array of XMLGaugeReferenceBugs
   */
  private makeReferenceBugs(bugs: HTMLCollectionOf<Element>): Array<d.XMLGaugeReferenceBug> | undefined {
    const bugArray = new Array<d.XMLGaugeReferenceBug>();
    for (let i = 0; i < bugs.length; i++) {
      const styleElem = bugs[i].getElementsByTagName('Style');
      const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
      let bugStyle: Partial<d.XMLGaugeReferenceBugStyle> = {};
      const innerElem = styleElem[0];
      if (innerElem !== undefined) {
        XMLGaugeConfigFactory.getAndAssign(bugStyle, innerElem, 'color', 'Color');
      }
      bugStyle = Object.assign(bugStyle, genericStyle);
      bugArray.push({
        position: new CompositeLogicXMLElement(this.instrument, bugs[i].getElementsByTagName('Position')[0]),
        displayLogic: new CompositeLogicXMLElement(this.instrument, bugs[i].getElementsByTagName('DisplayLogic')[0]),
        style: bugStyle,
        smoothFactor: this.parseSmoothFactor(bugs[i])
      });
    }
    return bugArray;
  }
}