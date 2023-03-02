import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { currentPrice } from 'lib/auctions';
import { convertOneScaledValue } from 'lib/controllers';
import { formatBigNum } from 'lib/numberFormat';
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';

import styles from './AuctionGraph.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  ChartDataLabels,
);

export function generateTimestampsAndPrices(
  auction: NonNullable<AuctionQuery['auction']>,
  latestUniswapPrice: number,
  currentTimestamp = 0,
) {
  const chartX: number[] = [];
  const chartY: number[] = [];
  const startTime = auction.start.timestamp;
  const endTime = startTime + 86400 * 3;
  const startPrice = ethers.BigNumber.from(auction.startPrice);

  for (
    let t = startTime;
    t < endTime && (currentTimestamp ? t < currentTimestamp : true);
    t += 900
  ) {
    chartX.push(t);
    chartY.push(
      parseFloat(
        formatBigNum(
          currentPrice(
            startPrice,
            t - startTime,
            parseInt(auction.secondsInPeriod),
            convertOneScaledValue(
              ethers.BigNumber.from(auction.perPeriodDecayPercentWad),
              4,
            ),
          ),
          18,
        ),
      ) * latestUniswapPrice,
    );
  }
  return [chartX, chartY];
}

const baseChartProperties = {
  borderWidth: 2,
  borderCapStyle: 'square' as const,
};

function generateLabelSpecificStyles(
  context: Context,
  topBidDataPoint: number,
  startStyle: string | number,
  buyNowStyle: string | number,
  topBidStyle: string | number,
  dottedLineStyle: string | number,
  topBidInfoStyle: any,
  zeroSignStyle: string | number,
  defaultStyle: string | number,
) {
  if (context.datasetIndex === 1 && context.dataIndex === 0) {
    return startStyle;
  } else if (
    context.datasetIndex === 0 &&
    context.dataIndex === context.chart.data.datasets[0].data.length - 1
  ) {
    return buyNowStyle;
  } else if (
    context.datasetIndex === 1 &&
    context.dataIndex === topBidDataPoint
  ) {
    return topBidStyle;
  } else if (
    context.datasetIndex === 1 &&
    context.dataIndex === topBidDataPoint - 1
  ) {
    return dottedLineStyle;
  } else if (
    context.datasetIndex === 1 &&
    context.dataIndex === topBidDataPoint - 2
  ) {
    return topBidInfoStyle;
  } else if (
    context.datasetIndex === 1 &&
    context.dataIndex === context.chart.data.datasets[1].data.length - 1
  ) {
    return zeroSignStyle;
  } else {
    return defaultStyle;
  }
}

type AuctionGraphProps = {
  auction: NonNullable<AuctionQuery['auction']>;
  auctionPaprPrice: ethers.BigNumber;
  liveTimestamp: number;
  timeElapsed: number;
  topBid: number;
  paprPrice: number;
};

export function AuctionGraph({
  auction,
  auctionPaprPrice,
  liveTimestamp,
  timeElapsed,
  topBid,
  paprPrice,
}: AuctionGraphProps) {
  const controller = useController();
  const timestampAndPricesAllTime = useMemo(() => {
    return generateTimestampsAndPrices(auction, paprPrice);
  }, [auction, paprPrice]);
  const timestampAndPricesCurrent = useMemo(() => {
    return generateTimestampsAndPrices(auction, paprPrice, liveTimestamp);
  }, [auction, paprPrice, liveTimestamp]);

  const auctionCompleted = useMemo(
    () => !!auction.endPrice,
    [auction.endPrice],
  );

  const startPriceUnderlying = useMemo(() => {
    return (
      parseFloat(
        ethers.utils.formatUnits(
          auction.startPrice,
          controller.paprToken.decimals,
        ),
      ) * paprPrice
    );
  }, [auction.startPrice, controller.paprToken.decimals, paprPrice]);

  const timeAgo = useMemo(() => {
    return Math.floor(timeElapsed / 60 / 60) > 24
      ? [Math.floor(timeElapsed / (60 * 60 * 24)), 'days', 'ago'].join(' ')
      : [Math.floor(timeElapsed / 60 / 60), 'hours', 'ago'].join(' ');
  }, [timeElapsed]);

  const topBidDataPoint = useMemo(() => {
    const prices = timestampAndPricesAllTime[1];
    const closestPoint = Array.from(Array(prices.length).keys()).reduce(
      (prev, curr) => {
        return Math.abs(prices[curr] - topBid / paprPrice) <
          Math.abs(prices[prev] - topBid / paprPrice)
          ? curr
          : prev;
      },
    );
    return closestPoint;
  }, [topBid, paprPrice, timestampAndPricesAllTime]);

  const startLabel = useMemo(() => {
    const startPriceUnderlyingString = startPriceUnderlying.toFixed(4);
    const startingString = 'Start @ 3x Top Bid';
    const paddingForTimeAgo = Array(startingString.length - timeAgo.length)
      .fill('\t')
      .join('');

    const paddingForTopBidPrice = Array(
      startingString.length - (startPriceUnderlyingString.length + 5),
    )
      .fill('\t')
      .join('');
    return `\n\n\n${startingString}\n${paddingForTimeAgo}${timeAgo}\n${paddingForTopBidPrice}${startPriceUnderlyingString} WETH`;
  }, [timeAgo, startPriceUnderlying]);

  const buyNowLabel = useMemo(() => {
    if (!auctionCompleted)
      return `Buy now: ${formatBigNum(
        auctionPaprPrice,
        controller.paprToken.decimals,
      )} ${controller.paprToken.symbol}`;
    else {
      return `SOLD: ${formatBigNum(
        auction.endPrice,
        controller.paprToken.decimals,
      )} ${controller.paprToken.symbol}`;
    }
  }, [
    auctionPaprPrice,
    auction.endPrice,
    controller.paprToken,
    auctionCompleted,
  ]);

  const topBidLabel = useMemo(() => {
    const topBidString = topBid.toFixed(4);
    return `\n\n\n${topBidString} WETH`;
  }, [topBid]);

  const chartOptions: ChartOptions = useMemo(
    () => ({
      responsive: true,
      events: [],
      layout: {
        padding: {
          left: 180,
          right: 40,
        },
      },
      animation: {
        duration: 0,
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          font: {
            family: 'Courier Prime, Courier New, monospace',
          },
          align: 'right',
          color: function (context) {
            return generateLabelSpecificStyles(
              context,
              topBidDataPoint,
              'black',
              'white',
              auctionCompleted ? 'black' : '#0064FA',
              '#b1aeae',
              'black',
              'black',
              '',
            );
          },
          backgroundColor: function (context) {
            return generateLabelSpecificStyles(
              context,
              topBidDataPoint,
              'white',
              auctionCompleted ? 'black' : '#0064FA',
              '',
              '',
              '',
              'white',
              '',
            );
          },
          offset: function (context) {
            return generateLabelSpecificStyles(
              context,
              topBidDataPoint,
              -160,
              20,
              -286,
              -110,
              -204,
              10,
              0,
            );
          },
          formatter: function (_value, context) {
            if (context.datasetIndex === 1 && context.dataIndex === 0) {
              return startLabel;
            } else if (
              context.datasetIndex === 0 &&
              context.dataIndex ===
                context.chart.data.datasets[0].data.length - 1
            ) {
              return buyNowLabel;
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex === topBidDataPoint
            ) {
              return 'Highest Collection Bid';
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex === topBidDataPoint - 1
            ) {
              return '- - - - - - - - - - - - - - - - - - - - - - - - - -';
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex === topBidDataPoint - 2
            ) {
              return topBidLabel;
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex ===
                context.chart.data.datasets[1].data.length - 1
            ) {
              return '$0';
            } else {
              return '';
            }
          },
          display: function (context) {
            return (
              (context.datasetIndex === 0 &&
                context.dataIndex ===
                  context.chart.data.datasets[0].data.length - 1) ||
              (context.datasetIndex === 1 &&
                context.dataIndex === topBidDataPoint) ||
              (context.datasetIndex === 1 &&
                context.dataIndex === topBidDataPoint - 1) ||
              (context.datasetIndex === 1 &&
                context.dataIndex === topBidDataPoint - 2) ||
              (context.datasetIndex === 1 && context.dataIndex === 0) ||
              (context.datasetIndex === 1 &&
                context.dataIndex ===
                  context.chart.data.datasets[1].data.length - 1)
            );
          },
        },
      },
      scales: {
        x: { display: false },
        y: { display: false },
      },
      elements: {
        point: {
          radius: 0,
        },
      },
    }),
    [startLabel, buyNowLabel, topBidLabel, topBidDataPoint, auctionCompleted],
  );

  const chartData = useMemo(() => {
    return {
      labels: timestampAndPricesAllTime[0],
      datasets: [
        {
          data: timestampAndPricesCurrent[1],
          borderColor: auctionCompleted ? 'black' : '#0064FA',
          ...baseChartProperties,
          pointRadius: Array(timestampAndPricesCurrent[1].length)
            .fill('')
            .map((_elem, i) =>
              i === timestampAndPricesCurrent[1].length - 1 ? 2 : 0,
            ),
        },
        {
          data: timestampAndPricesAllTime[1],
          borderColor: '#e4e4e4',
          ...baseChartProperties,
        },
      ],
    };
  }, [timestampAndPricesAllTime, timestampAndPricesCurrent, auctionCompleted]);

  return (
    <div className={styles.curve}>
      <Line
        options={chartOptions as any}
        data={chartData}
        height={300}
        width={560}
      />
    </div>
  );
}
