import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  DollarSign,
  Leaf,
  Award,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { ConsumptionChart } from '../../components/charts/ConsumptionChart';
import { CostBreakdownChart } from '../../components/charts/CostBreakdownChart';
import { DashboardSkeleton } from '../../components/common/DashboardSkeleton';
import { analyticsService } from '../../services/analyticsService';
import { billService } from '../../services/billService';
import { formatCurrency, formatKWh, formatCO2, maskAccountNumber, formatDate } from '../../utils/formatters';

export const ConsumerOverview = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, billsRes] = await Promise.all([
          analyticsService.getConsumerOverview(),
          billService.getBills()
        ]);
        setData(overviewRes.data);
        setRecentBills(billsRes.data.slice(0, 3));
      } catch (err) {
        console.error('Error loading consumer overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton roleLabel="Consumer Portal" />;
  }

  const period = data?.currentPeriod || {};

  return (
    <div className="space-y-8">
      {/* Header Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase text-midnight-500 tracking-wider">
            Current Billing Period: {period.label}
          </span>
          <h2 className="text-2xl font-black text-midnight-900 tracking-tight mt-0.5">
            Household Energy Dashboard
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/consumer/advisor')}
            leftIcon={Sparkles}
          >
            Ask AI Advisor
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/consumer/bills')}
            leftIcon={Zap}
          >
            Upload New Bill
          </Button>
        </div>
      </div>

      {/* Onboarding Empty State Banner for New Users with No Bills Yet */}
      {!data?.hasData && !data?.isDemo && (
        <Card className="border-2 border-dashed border-cobalt-300 bg-cobalt-50/40 p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-cobalt-200 flex items-center justify-center text-cobalt-600 shadow-sm">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-midnight-900">Welcome to WattWise AI!</h3>
              <p className="text-xs text-midnight-600 mt-1 leading-relaxed">
                You haven't uploaded any electricity bills yet. Upload your first utility statement (PDF or photo) to activate automated consumption tracking, AI energy advisory, and carbon metrics.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/consumer/bills')}
              leftIcon={Zap}
              className="mx-auto"
            >
              Upload Your First Bill (+100 Eco-Points)
            </Button>
          </div>
        </Card>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Period Consumption"
          value={formatKWh(period.consumptionKWh)}
          subtitle={`Peak demand: ${period.peakDemandKWh} kW`}
          trend={period.comparisonPercentage}
          trendLabel="vs previous cycle"
          icon={Zap}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Estimated Bill"
          value={formatCurrency(period.estimatedBillINR || period.estimatedBillUSD)}
          subtitle={period.tariffTier}
          trend={period.comparisonPercentage}
          trendLabel="cost variance"
          icon={DollarSign}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Carbon Footprint"
          value={formatCO2(period.carbonEmissionsKg)}
          subtitle="EPA eGRID 0.438 kg/kWh"
          trend={period.comparisonPercentage}
          trendLabel="emissions shift"
          icon={Leaf}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Energy-Saving Score"
          value={`${period.energySavingScore} / 100`}
          subtitle="Top 15% in your community"
          trend={4.5}
          trendLabel="points gained"
          isNegativeGood={false}
          icon={Award}
          isDemo={data?.isDemo}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Consumption Trend Chart */}
        <div className="lg:col-span-8">
          <ChartWrapper
            title="12-Month Consumption Trajectory"
            subtitle="Historical billed kWh versus local residential baseline"
            isDemo={data?.isDemo}
            height={320}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/consumer/analytics')}
                rightIcon={ArrowUpRight}
                className="text-xs"
              >
                Deep Analytics
              </Button>
            }
          >
            <ConsumptionChart data={data?.monthlyUsage} />
          </ChartWrapper>
        </div>

        {/* Appliance Breakdown Donut */}
        <div className="lg:col-span-4">
          <Card
            title="Estimated Load Distribution"
            subtitle="Software-derived breakdown across appliances"
            isDemo={data?.isDemo}
          >
            <CostBreakdownChart data={data?.applianceBreakdown} />
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Recent Bills & Energy-Saving Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Bills Table */}
        <div className="lg:col-span-7">
          <Card
            title="Recent Electricity Bills"
            subtitle="Automated OCR status and key billing metrics"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/consumer/bills')}
                rightIcon={ArrowUpRight}
                className="text-xs"
              >
                View All
              </Button>
            }
          >
            <div className="space-y-3">
              {recentBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3.5 rounded-xl border border-ivory-200 hover:border-ivory-300 bg-ivory-50/50 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-ivory-300 flex items-center justify-center text-midnight-700 shrink-0">
                      <FileText className="w-4 h-4 text-cobalt-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-midnight-900 truncate">{bill.billingMonth}</p>
                      <p className="text-[11px] text-midnight-500 font-mono">
                        Account: {maskAccountNumber(bill.accountNumber)} • Due {formatDate(bill.dueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-midnight-900">{formatCurrency(bill.amount)}</p>
                    <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Actionable Recommendations */}
        <div className="lg:col-span-5">
          <Card
            title="AI Optimization Insights"
            subtitle="Highest-impact savings opportunities this month"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/consumer/advisor')}
                rightIcon={ArrowUpRight}
                className="text-xs"
              >
                Advisor
              </Button>
            }
          >
            <div className="space-y-3">
              {data?.recommendations?.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-ivory-200 bg-white hover:bg-ivory-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-cobalt-500/15 text-cobalt-900 border border-cobalt-500/20">
                      {rec.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      Save ~{formatCurrency(rec.potentialSavingsINR || rec.potentialSavingsUSD)}/mo
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-midnight-900 mt-1.5">{rec.title}</h4>
                  <p className="text-[11px] text-midnight-600 mt-1 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConsumerOverview;

