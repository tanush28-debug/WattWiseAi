import { z } from 'zod';

const idSchema = z.string().trim().min(1).max(80);
const shortText = (max = 160) => z.string().trim().min(1).max(max);

export const industrialFacilitySchema = z.object({
  name: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(160),
  estimatedMonthlyMWh: z.coerce.number().finite().positive().max(1000000).optional(),
  machineCount: z.coerce.number().int().nonnegative().max(100000).optional(),
});

export const industrialMachineSchema = z.object({
  facilityId: z.string().uuid({ message: 'A valid facility id is required.' }),
  name: z.string().trim().min(2).max(120),
  category: shortText(80).default('Machining'),
  powerRatingKW: z.coerce.number().finite().positive().max(1000000),
  operatingHoursPerDay: z.coerce.number().finite().min(0).max(24),
  reportingPeriod: z.enum(['Daily', 'Weekly', 'Monthly']).default('Monthly'),
});

export const industrialReportSchema = z.object({
  reportType: z.string().trim().max(80).optional(),
  period: z.string().trim().max(40).optional(),
});

export const governmentTariffSchema = z.object({
  id: idSchema.optional(),
  code: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(160),
  tierLimitKWh: z.coerce.number().int().nonnegative().max(10000000).optional(),
  ratePerKWh: z.coerce.number().finite().nonnegative().max(1000000).optional(),
  peakSurcharge: z.string().trim().max(40).optional(),
  offPeakDiscount: z.string().trim().max(40).optional(),
  flatSubsidyPercent: z.coerce.number().min(0).max(100).optional(),
  status: z.string().trim().max(40).optional(),
});

export const governmentSimulationSchema = z.object({
  incentiveType: z.string().trim().min(2).max(200),
  targetSector: z.string().trim().min(2).max(80),
  percentageChange: z.coerce.number().finite().min(0).max(100),
  durationYears: z.coerce.number().int().min(1).max(30),
});

export const governmentReportSchema = z.object({
  reportCategory: z.string().trim().max(120).optional(),
  year: z.union([z.string().trim().max(20), z.coerce.number().int().min(1990).max(2200)]).optional(),
});
