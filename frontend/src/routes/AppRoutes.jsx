import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import LandingPage from '../pages/public/LandingPage';

// Auth Pages
import RoleSelectionPage from '../pages/auth/RoleSelectionPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Consumer Pages
import ConsumerOverview from '../pages/consumer/ConsumerOverview';
import EnergyAnalytics from '../pages/consumer/EnergyAnalytics';
import BillManagement from '../pages/consumer/BillManagement';
import DemandForecast from '../pages/consumer/DemandForecast';
import TariffSimulator from '../pages/consumer/TariffSimulator';
import CarbonFootprint from '../pages/consumer/CarbonFootprint';
import AIEnergyAdvisor from '../pages/consumer/AIEnergyAdvisor';
import Rewards from '../pages/consumer/Rewards';
import ConsumerProfile from '../pages/consumer/ConsumerProfile';

// Industrial Pages
import IndustrialOverview from '../pages/industrial/IndustrialOverview';
import FacilitiesManagement from '../pages/industrial/FacilitiesManagement';
import EnergyAnalyticsIndustrial from '../pages/industrial/EnergyAnalyticsIndustrial';
import MachineConsumption from '../pages/industrial/MachineConsumption';
import DemandForecastIndustrial from '../pages/industrial/DemandForecastIndustrial';
import AnomalyDetection from '../pages/industrial/AnomalyDetection';
import CostOptimization from '../pages/industrial/CostOptimization';
import IndustrialReports from '../pages/industrial/IndustrialReports';
import IndustrialProfile from '../pages/industrial/IndustrialProfile';

// Government Pages
import NationalOverview from '../pages/government/NationalOverview';
import RegionalAnalytics from '../pages/government/RegionalAnalytics';
import SectorAnalytics from '../pages/government/SectorAnalytics';
import EnergyTrends from '../pages/government/EnergyTrends';
import TariffManagement from '../pages/government/TariffManagement';
import PolicySimulatorGovernment from '../pages/government/PolicySimulatorGovernment';
import CarbonSustainability from '../pages/government/CarbonSustainability';
import ConservationPrograms from '../pages/government/ConservationPrograms';
import GovernmentReports from '../pages/government/GovernmentReports';
import AdminSettings from '../pages/government/AdminSettings';

import { USER_ROLES } from '../config/constants';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Role Selection Screen */}
      <Route path="/select-role" element={<RoleSelectionPage />} />

      {/* Authentication Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Consumer Protected Portal */}
      <Route
        path="/consumer"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.CONSUMER]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ConsumerOverview />} />
        <Route path="analytics" element={<EnergyAnalytics />} />
        <Route path="bills" element={<BillManagement />} />
        <Route path="forecast" element={<DemandForecast />} />
        <Route path="tariffs" element={<TariffSimulator />} />
        <Route path="carbon" element={<CarbonFootprint />} />
        <Route path="advisor" element={<AIEnergyAdvisor />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="profile" element={<ConsumerProfile />} />
      </Route>

      {/* Industrial Protected Portal */}
      <Route
        path="/industrial"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.INDUSTRIAL]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<IndustrialOverview />} />
        <Route path="facilities" element={<FacilitiesManagement />} />
        <Route path="analytics" element={<EnergyAnalyticsIndustrial />} />
        <Route path="machines" element={<MachineConsumption />} />
        <Route path="forecast" element={<DemandForecastIndustrial />} />
        <Route path="anomalies" element={<AnomalyDetection />} />
        <Route path="optimization" element={<CostOptimization />} />
        <Route path="carbon" element={<CarbonFootprint />} />
        <Route path="reports" element={<IndustrialReports />} />
        <Route path="profile" element={<IndustrialProfile />} />
      </Route>

      {/* Government Protected Portal */}
      <Route
        path="/government"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.GOVERNMENT]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<NationalOverview />} />
        <Route path="regional" element={<RegionalAnalytics />} />
        <Route path="sectors" element={<SectorAnalytics />} />
        <Route path="trends" element={<EnergyTrends />} />
        <Route path="tariffs" element={<TariffManagement />} />
        <Route path="policy-simulator" element={<PolicySimulatorGovernment />} />
        <Route path="carbon" element={<CarbonSustainability />} />
        <Route path="conservation" element={<ConservationPrograms />} />
        <Route path="reports" element={<GovernmentReports />} />
        <Route path="admin" element={<AdminSettings />} />
      </Route>

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

