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
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { currentPrice } from 'lib/auctions';
import { convertOneScaledValue } from 'lib/controllers';
import { formatBigNum, formatDollars } from 'lib/numberFormat';
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
  floorDataPoint: number,
  startStyle: string | number,
  buyNowStyle: string | number,
  topBidStyle: string | number,
  dottedLineStyle: string | number,
  floorInfoStyle: any,
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
    context.dataIndex === floorDataPoint
  ) {
    return topBidStyle;
  } else if (
    context.datasetIndex === 1 &&
    context.dataIndex === floorDataPoint - 1
  ) {
    return dottedLineStyle;
  } else if (
    context.datasetIndex === 1 &&
    context.dataIndex === floorDataPoint - 2
  ) {
    return floorInfoStyle;
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
  auctionUnderlyingPrice: ethers.BigNumber | null;
  liveTimestamp: number;
  timeElapsed: number;
  oracleInfo: OracleInfo;
  latestUniswapPrice: number;
  floorUSDPrice: number;
};

export function AuctionGraph({
  auction,
  auctionUnderlyingPrice,
  liveTimestamp,
  timeElapsed,
  oracleInfo,
  latestUniswapPrice,
  floorUSDPrice,
}: AuctionGraphProps) {
  const controller = useController();
  const timestampAndPricesAllTime = useMemo(() => {
    return generateTimestampsAndPrices(auction, latestUniswapPrice);
  }, [auction, latestUniswapPrice]);
  const timestampAndPricesCurrent = useMemo(() => {
    return generateTimestampsAndPrices(
      auction,
      latestUniswapPrice,
      liveTimestamp,
    );
  }, [auction, latestUniswapPrice, liveTimestamp]);

  const auctionCompleted = useMemo(
    () => !!auction.endPrice,
    [auction.endPrice],
  );

  const timeAgo = useMemo(() => {
    return Math.floor(timeElapsed / 60 / 60) > 24
      ? [Math.floor(timeElapsed / (60 * 60 * 24)), 'days', 'ago'].join(' ')
      : [Math.floor(timeElapsed / 60 / 60), 'hours', 'ago'].join(' ');
  }, [timeElapsed]);

  const floorDataPoint = useMemo(() => {
    const prices = timestampAndPricesAllTime[1];
    const floorPrice = oracleInfo[auction.auctionAssetContract.id].price;
    const closestPoint = Array.from(Array(prices.length).keys()).reduce(
      (prev, curr) => {
        return Math.abs(prices[curr] - floorPrice) <
          Math.abs(prices[prev] - floorPrice)
          ? curr
          : prev;
      },
    );
    return closestPoint;
  }, [oracleInfo, timestampAndPricesAllTime, auction.auctionAssetContract.id]);

  const startLabel = useMemo(() => {
    const floorPriceString =
      oracleInfo[auction.auctionAssetContract.id].price.toFixed(4);
    const floorUSDPriceString = formatDollars(floorUSDPrice);
    const startingString = 'Start @ 3x Floor';
    const paddingForTimeAgo = Array(startingString.length - timeAgo.length)
      .fill('\t')
      .join('');
    const paddingForUSDPrice = Array(
      startingString.length - floorUSDPriceString.toString().length,
    )
      .fill('\t')
      .join('');
    const paddingForFloorPrice = Array(
      startingString.length - (floorPriceString.toString().length + 5),
    )
      .fill('\t')
      .join('');
    return `\n\n\n${startingString}\n${paddingForTimeAgo}${timeAgo}\n${paddingForFloorPrice}${floorPriceString} WETH\n${paddingForUSDPrice}${floorUSDPriceString}`;
  }, [timeAgo, oracleInfo, floorUSDPrice, auction.auctionAssetContract.id]);

  const buyNowLabel = useMemo(() => {
    if (!auctionCompleted)
      return auctionUnderlyingPrice
        ? `Buy now: ${formatBigNum(
            auctionUnderlyingPrice,
            controller.underlying.decimals,
          )} ${controller.underlying.symbol}`
        : 'Buy now: ......';
    else {
      return auctionUnderlyingPrice
        ? `SOLD: ${formatBigNum(
            auctionUnderlyingPrice,
            controller.underlying.decimals,
          )} WETH`
        : 'SOLD: ......';
    }
  }, [auctionUnderlyingPrice, controller.underlying, auctionCompleted]);

  const floorLabel = useMemo(() => {
    const floorPriceString =
      oracleInfo[auction.auctionAssetContract.id].price.toFixed(4);
    const floorUSDPriceString = formatDollars(floorUSDPrice);
    const floorPricePadding = Array(
      floorPriceString.toString().length +
        5 -
        floorUSDPriceString.toString().length,
    )
      .fill('\t')
      .join('');
    return `\n\n\n\n${floorPriceString} WETH\n${floorPricePadding}${floorUSDPriceString}`;
  }, [oracleInfo, floorUSDPrice, auction.auctionAssetContract.id]);

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
              floorDataPoint,
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
              floorDataPoint,
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
              floorDataPoint,
              -160,
              20,
              -176,
              -100,
              -200,
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
              context.dataIndex === floorDataPoint
            ) {
              return 'Top Bid';
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex === floorDataPoint - 1
            ) {
              return '- - - - - - - - - - - - - - - - - - - - - - - - - -';
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex === floorDataPoint - 2
            ) {
              return floorLabel;
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
                context.dataIndex === floorDataPoint) ||
              (context.datasetIndex === 1 &&
                context.dataIndex === floorDataPoint - 1) ||
              (context.datasetIndex === 1 &&
                context.dataIndex === floorDataPoint - 2) ||
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
    [startLabel, buyNowLabel, floorLabel, floorDataPoint, auctionCompleted],
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
