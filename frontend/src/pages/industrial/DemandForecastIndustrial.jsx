import React from 'react';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { ForecastChart } from '../../components/charts/ForecastChart';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { TrendingUp, Cpu, Factory } from 'lucide-react';

const INDUSTRIAL_SERIES = [
  { day: 'Day 1', actual: 48.2, predicted: 47.9, upperBand: 52.0, lowerBand: 44.0 },
  { day: 'Day 5', actual: 51.0, predicted: 50.4, upperBand: 55.0, lowerBand: 46.0 },
  { day: 'Day 10', actual: 46.8, predicted: 47.2, upperBand: 51.5, lowerBand: 43.0 },
  { day: 'Day 15', actual: 49.5, predicted: 49.0, upperBand: 53.0, lowerBand: 45.0 },
  { day: 'Day 20', actual: null, predicted: 48.0, upperBand: 52.5, lowerBand: 43.5 },
  { day: 'Day 25', actual: null, predicted: 52.4, upperBand: 57.0, lowerBand: 47.0 },
  { day: 'Day 30', actual: null, predicted: 47.0, upperBand: 51.0, lowerBand: 43.0 },
];

export const DemandForecastIndustrial = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Industrial Demand Forecast</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          30-day ahead load curve modeling for production shifts and contract demand capacity planning.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Projected Plant Consumption"
          value="1,460 MWh"
          subtitle="Forecast for next 30 production days"
          trend={-1.7}
          trendLabel="vs previous cycle"
          icon={TrendingUp}
          isDemo
        />
        <StatCard
          title="Maximum Coincident Peak"
          value="4.45 MW"
          subtitle="Expected around Nov 18 shift"
          trend={0.8}
          trendLabel="peak margin"
          isNegativeGood={false}
          icon={Factory}
          isDemo
        />
        <StatCard
          title="ML Confidence Interval"
          value="96.2%"
          subtitle="Trained on 36 months of plant load curves"
          trend={1.1}
          trendLabel="accuracy score"
          isNegativeGood={false}
          icon={Cpu}
          isDemo
        />
      </div>

      <ChartWrapper
        title="Plant Load Forecast & Upper Demand Limits (MWh/Day)"
        subtitle="Operational projection showing historical production vs predictive inference"
        height={340}
        isDemo
      >
        <ForecastChart data={INDUSTRIAL_SERIES} />
      </ChartWrapper>
    </div>
  );
};

export default DemandForecastIndustrial;

