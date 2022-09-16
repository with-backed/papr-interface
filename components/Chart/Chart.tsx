import { useEffect } from 'react';
import { axisBottom, extent, scaleLinear, min, max } from 'd3';
import { humanizedTimestamp } from 'lib/duration';
import { attachSVG, drawLine, drawDashedLine } from 'lib/d3';
import { StrategyPricesData } from 'lib/strategies/charts';

const containerId = '#strategy-d3-chart';

type ChartProps = {
  pricesData: StrategyPricesData;
};

export function Chart({ pricesData }: ChartProps) {
  useEffect(() => {
    var data = pricesData;
    const margin = { top: 0, right: 0, bottom: 20, left: 0 };
    const width = 580 - margin.left - margin.right;
    // TODO dynamically adjust height based on extent of y values
    const height = 270 - margin.top - margin.bottom;

    const svg = attachSVG({ containerId, height, margin, width });
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'white');

    const datasets = [
      ...data.normalizationDPRValues,
      ...data.indexDPRValues,
      ...data.markDPRValues,
    ];
    const yValues: number[] = datasets.map((r) => r[0]);
    var maxY = max(yValues) as number;
    var maxY = max([maxY, 5]) as number;
    var minY = min(yValues) as number;
    // give minY some padding
    if (minY < 0) {
      minY = Math.min(minY * 1.2, -5);
    } else if (minY < 1) {
      minY = -5;
    } else {
      minY = minY * 0.8;
    }
    const dataExtent = extent([minY, maxY]);
    const timestampExtent = extent(datasets, (d) => d[1]);

    var xScale = scaleLinear()
      .domain(timestampExtent as [number, number])
      .range([0, width]);
    var yScale = scaleLinear()
      .domain(dataExtent as [number, number])
      .range([height, minY]);

    // Draw scale lines on chart
    const xAxis = svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')');
    xAxis.call(
      axisBottom(xScale)
        .ticks(3)
        .tickSize(-height)
        .tickFormat((d) => humanizedTimestamp(d.valueOf())),
    );
    xAxis.selectAll('.domain').remove();
    xAxis.selectAll('.tick>line').style('stroke', '#CEECE4');
    xAxis
      .selectAll('.tick>text')
      .style('font-family', 'var(--mono)')
      .style('text-transform', 'uppercase')
      .style('color', 'var(--greentext)')
      .attr('dy', '1.5em');

    drawLine({
      data: data.normalizationDPRValues,
      svg: svg as any,
      stroke: '#007155',
      xScale,
      yScale,
    });

    drawDashedLine({
      data: data.indexDPRValues,
      svg: svg as any,
      stroke: '#000000',
      xScale,
      yScale,
    });

    drawLine({
      data: data.markDPRValues,
      svg: svg as any,
      stroke: '#000000',
      xScale,
      yScale,
    });

    return () => document.querySelector(`${containerId} svg`)?.remove();
  }, [pricesData]);
  return <div id="strategy-d3-chart" />;
}
