import { useCallback, useEffect, useState } from 'react';
import { axisBottom, extent, scaleLinear, min, max } from 'd3';
import { humanizedTimestamp } from 'lib/duration';
import { attachSVG, drawLine, drawDashedLine } from 'lib/d3';
import { StrategyPricesData } from 'lib/strategies/charts';

const containerId = '#strategy-d3-chart';

type ChartValue = [number, number];

type ChartProps = {
  pricesData: StrategyPricesData;
};

export function Chart({ pricesData }: ChartProps) {
  const [annualize, setAnnualize] = useState(false);

  // leaving this because would be nice to have, but not working right now
  // I think the annual values got too big to plot on my example
  const transformToAnnual = useCallback(
    (pData: StrategyPricesData): StrategyPricesData => {
      const markValues: ChartValue[] = pData.markDPRValues.map((v) => {
        return [v[0] * 365, v[1]];
      });
      const normValues: ChartValue[] = pData.normalizationDPRValues.map((v) => {
        return [v[0] * 365, v[1]];
      });
      const indexValues: ChartValue[] = pData.indexDPRValues.map((v) => {
        return [v[0] * 365, v[1]];
      });

      return {
        indexDPR: pricesData.indexDPR,
        index: pricesData.index,
        markDPRValues: markValues,
        normalizationDPRValues: normValues,
        indexDPRValues: indexValues,
        markValues: pricesData.markValues,
        normalizationValues: pricesData.normalizationValues,
      };
    },
    [pricesData],
  );

  useEffect(() => {
    var data = pricesData;
    if (annualize) {
      data = transformToAnnual(pricesData);
      console.log(pricesData);
      console.log(data);
    }
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
  }, [annualize, pricesData, transformToAnnual]);
  return <div id="strategy-d3-chart" />;
}
