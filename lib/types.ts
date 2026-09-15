export type Category = "Sandwiches" | "Cakes" | "Croissants";

export type Product = {
  id: string;
  name: string;
  category: Category;
  shelfLifeDays: number;
  safetyStock: number;
  targetDays: number;
  active: boolean;
};

export type QuantityMap = Record<string, number>;

export type DailyRecord = {
  id: string;
  date: string;
  time: string;
  reportedBy: string;
  physical: QuantityMap;
  receiving: QuantityMap;
  transferIn: QuantityMap;
  transferOut: QuantityMap;
  waste: QuantityMap;
  returns: QuantityMap;
  adjustments: QuantityMap;
  notes?: string;
  createdAt: string;
};

export type MovementRow = {
  productId: string;
  previousFinal: number | null;
  currentPhysical: number;
  movement: number | null;
  discrepancy: boolean;
  potentialStockout: boolean;
  avg3: number;
  avg7: number;
  avg14: number;
  weeklyMovement: number;
  previousWeeklyAverage: number;
  trend: "Fast" | "Normal" | "Slow" | "Insufficient";
  daysRemaining: number | null;
};

export type OrderRecommendation = {
  productId: string;
  current: number;
  forecast: number;
  safety: number;
  target: number;
  recommended: number;
  confidence: "High" | "Medium" | "Low";
  explanation: string;
  forecastBreakdown: { date: string; value: number }[];
  weeklyMovement: number;
  previousWeeklyAverage: number;
  velocity: "Fast" | "Normal" | "Slow" | "No movement" | "Insufficient";
};

export type CloudOrder = {
  id: string;
  orderFor: string;
  orderType: "tomorrow" | "weekly" | "weekend" | "emergency";
  status: string;
  approvedAt: string | null;
  createdAt: string;
  totalApproved: number;
};

export type OperationType =
  | "receiving"
  | "waste"
  | "adjustment";

export type ForecastAccuracyRow = {
  productId: string;
  productName: string;
  forecastDate: string;
  predicted: number;
  actual: number | null;
  error: number | null;
  absoluteError: number | null;
  percentageError: number | null;
  stockout: boolean;
  overstock: boolean;
  estimatedLostSales: number | null;
  confidence: "High" | "Medium" | "Low" | null;
  reconciledAt: string | null;
};

export type ForecastSummary = {
  overallAccuracy: number | null;
  bestProduct: string | null;
  worstProduct: string | null;
  mostUnderForecast: string | null;
  mostOverForecast: string | null;
  reconciledRows: number;
};
