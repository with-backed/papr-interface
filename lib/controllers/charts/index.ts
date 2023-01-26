import { UTCTimestamp } from 'lightweight-charts';

export interface TimeSeriesValue {
  value: number;
  time: UTCTimestamp;
}

export interface ControllerPricesData {
  markValues: TimeSeriesValue[];
  targetValues: TimeSeriesValue[];
  index: number;
}
