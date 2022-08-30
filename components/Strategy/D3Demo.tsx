import { useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useQuery } from 'urql';
import {
  NormFactorUpdatesByStrategyDocument,
  NormFactorUpdatesByStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { ethers } from 'ethers';
import { computeEffectiveAPR } from 'lib/strategies';

function rand() {
  return Math.random() * 100;
}

const contract: number[] = [];
const target: number[] = [];
const realized: number[] = [];

for (let i = 0; i < 35; ++i) {
  contract.push(rand());
  target.push(rand());
  realized.push(rand());
}

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
            ethers.BigNumber.from(current.newNorm).div(current.oldNorm),
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

    const extent = d3.extent([...contract, ...target, ...realized]);

    // Add X axis --> it is a date format
    var x = d3.scaleLinear().domain([0, contract.length]).range([0, width]);
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
      .datum(contract)
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

    svg
      .append('path')
      .datum(target)
      .attr('fill', 'none')
      .attr('stroke', '#000000')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '1, 10')
      .attr('stroke-linecap', 'round')
      .attr(
        'd',
        d3
          .line()
          .curve(d3.curveBasis)
          .x((_, i) => x(i))
          .y((d) => y(d)),
      );

    svg
      .append('path')
      .datum(realized)
      .attr('fill', 'none')
      .attr('stroke', '#000000')
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
  }, []);
  return <div id="d3demo" />;
}
