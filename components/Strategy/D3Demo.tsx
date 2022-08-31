import { useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useQuery } from 'urql';
import {
  LendingStrategyByIdDocument,
  LendingStrategyByIdQuery,
  NormFactorUpdatesByStrategyDocument,
  NormFactorUpdatesByStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { ethers } from 'ethers';
import { computeEffectiveAPR } from 'lib/strategies';
import { ONE } from 'lib/strategies/constants';
import { SECONDS_IN_A_YEAR } from 'lib/constants';

const containerId = '#d3demo';
const tickLabels = ['<All', '14 Days', '7 Days', '24h'];

type D3DemoProps = {
  strategy: string;
  targetAnnualGrowth: ethers.BigNumber;
};
export function D3Demo({ strategy, targetAnnualGrowth }: D3DemoProps) {
  const [{ data: strategyData }] = useQuery<LendingStrategyByIdQuery>({
    query: LendingStrategyByIdDocument,
    variables: { id: strategy },
  });
  const [{ data: normData }] = useQuery<NormFactorUpdatesByStrategyQuery>({
    query: NormFactorUpdatesByStrategyDocument,
    variables: { strategy },
  });

  const strategyCreatedAt = useMemo(() => {
    if (strategyData?.lendingStrategy) {
      return ethers.BigNumber.from(strategyData.lendingStrategy.createdAt);
    }
  }, [strategyData]);

  const sortedNormData = useMemo(
    () =>
      normData?.normFactorUpdates.sort(
        (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
      ) || [],
    [normData],
  );

  const aprs = useMemo(() => {
    if (sortedNormData) {
      const aprs: string[] = [];
      for (let i = 1; i < sortedNormData.length; ++i) {
        const prev = sortedNormData[i - 1];
        const current = sortedNormData[i];
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
  }, [sortedNormData]);

  const targets = useMemo(() => {
    if (sortedNormData && strategyCreatedAt) {
      const aprs: string[] = [];
      for (let i = 1; i < sortedNormData.length; ++i) {
        const current = sortedNormData[i];
        const timeDelta = ethers.BigNumber.from(current.timestamp).sub(
          strategyCreatedAt,
        );

        aprs.push(
          targetAnnualGrowth
            .mul(timeDelta.mul(1000).div(SECONDS_IN_A_YEAR))
            .toString(),
        );
      }
      return aprs;
    }
    return [];
  }, [sortedNormData, strategyCreatedAt, targetAnnualGrowth]);

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
