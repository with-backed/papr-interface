import { curveBasis, line, ScaleLinear, select, Selection } from 'd3';

export type ChartValue = [number, number];

type AttachSVGParams = {
  containerId: string;
  height: number;
  width: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export function attachSVG({
  containerId,
  height,
  margin,
  width,
}: AttachSVGParams) {
  return select(containerId)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
}

type DrawLineParams = {
  svg: Selection<SVGElement, unknown, HTMLElement, any>;
  data: ChartValue[];
  stroke: string;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
};

export function drawLine({
  data,
  svg,
  stroke,
  xScale,
  yScale,
}: DrawLineParams) {
  svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', stroke)
    .attr('stroke-width', 1.5)
    .attr(
      'd',
      line()
        .curve(curveBasis)
        .x((d) => xScale(d[1]))
        .y((d) => yScale(d[0])),
    );
}

export function drawDashedLine({
  data,
  svg,
  stroke,
  xScale,
  yScale,
}: DrawLineParams) {
  svg
    .append('path')
    .datum(data)
    .style('stroke-dasharray', '3, 3')
    .attr('fill', 'none')
    .attr('stroke', stroke)
    .attr('stroke-width', 1.5)
    .attr(
      'd',
      line()
        .curve(curveBasis)
        .x((d) => xScale(d[1]))
        .y((d) => yScale(d[0])),
    );
}
