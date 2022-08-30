import { useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useQuery } from 'urql';
import {
  NormFactorUpdatesByStrategyDocument,
  NormFactorUpdatesByStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { ethers } from 'ethers';
import { computeEffectiveAPR } from 'lib/strategies';
import { ONE } from 'lib/strategies/constants';

const containerId = '#d3demo';
const tickLabels = ['<All', '14 Days', '7 Days', '24h'];

type D3DemoProps = {
  strategy: string;
};
export function D3Demo({ strategy }: D3DemoProps) {
  const [{ data: normData }] = useQuery<NormFactorUpdatesByStrategyQuery>({
    query: NormFactorUpdatesByStrategyDocument,
    variables: { strategy },
  });

  const aprs = useMemo(() => {
    if (normData) {
      const sorted = normData.normFactorUpdates.sort(
        (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
      );

      const aprs: any[] = [];
      for (let i = 1; i < sorted.length; ++i) {
        const prev = sorted[i - 1];
        const current = sorted[i];
        aprs.push(
          computeEffectiveAPR(
            ethers.BigNumber.from(current.timestamp),
            ethers.BigNumber.from(prev.timestamp),
            ethers.BigNumber.from(current.newNorm)
              .mul(ONE)
              .div(current.oldNorm),
          )
            .div(100)
            .toString(),
        );
      }
      return aprs;
    }
    return [];
  }, [normData]);

  console.log({ aprs });

  useEffect(() => {
    var margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(containerId)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const extent = d3.extent(aprs);

    // Add X axis --> it is a date format
    var x = d3.scaleLinear().domain([0, aprs.length]).range([0, width]);
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(
        d3
          .axisBottom(x)
          .ticks(4)
          .tickValues([0, 10, 20, 30])
          .tickFormat((_, i) => tickLabels[i])
          .tickSize(-400),
      );

    // Add Y axis
    var y = d3
      .scaleLinear()
      .domain(extent as any)
      .range([height, 0]);
    svg.append('g').call(d3.axisLeft(y));

    svg
      .append('path')
      .datum(aprs)
      .attr('fill', 'none')
      .attr('stroke', '#007155')
      .attr('stroke-width', 1.5)
      .attr(
        'd',
        d3
          .line()
          .curve(d3.curveBasis)
          .x((_, i) => x(i))
          .y((d) => y(d)),
      );

    return () => document.querySelector(`${containerId} svg`)?.remove();
  }, [aprs]);
  return <div id="d3demo" />;
}
