import { ChartValue } from 'lib/d3';

interface StrategyTimeSeriesChartData {
  normalizationAPRs: ChartValue[];
  markAPRs: ChartValue[];
  indexAPRs: ChartValue[];
}

export function getStrategyTimeSeriesChartData(): StrategyTimeSeriesChartData {
  return {
    normalizationAPRs: [],
    markAPRs: [],
    indexAPRs: [],
  };
}
