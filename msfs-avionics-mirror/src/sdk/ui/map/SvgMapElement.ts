import { MapElement } from './MapElement';

/**
 * A common class for elements to be drawn on the map.
 */
export class SvgMapElement extends MapElement {
  public position = new Float64Array(2);

  public readonly div: HTMLElement;
  public readonly svg: SVGElement;
  public readonly svggrp: SVGGElement;
  private readonly svgimg: SVGImageElement;


  /**
   * Creates an instance of MapElement.
   * @param parent The HTML element that this element is a child of.
   */
  constructor(private readonly parent: HTMLElement) {
    super();
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.top = '0';
    this.div.style.left = '0';
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svggrp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svgimg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    this.svgimg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/bench_icon.svg');
    this.svgimg.setAttribute('height', '40');
    this.svgimg.setAttribute('width', '40');
    const svgtxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgtxt.textContent = 'Label';
    this.svggrp.appendChild(svgtxt);

    this.svggrp.appendChild(this.svgimg);
    this.svg.appendChild(this.svggrp);
    this.div.appendChild(this.svg);
    svgtxt.setAttribute('x', '0');
    svgtxt.setAttribute('y', '0');
    this.svgimg.setAttribute('x', '0');
    this.svgimg.setAttribute('y', '10');
  }

  /**
   * Updates the map element.
   */
  public update(): void {
    // this.svgimg.setAttribute('x', `${(Math.random() * 700 + 200)}px`);
    // this.svgimg.setAttribute('y', `${(Math.random() * 700 + 200)}px`);
    this.div.style.transform = `translate3d(${(Math.random() * 200 + 200)}px,${(Math.random() * 200 + 200)}px,0)`;
  }

  /**
   * Draws the map element.
   */
  public draw(): void {
    // noops
  }
}
