'use server';

import { FinancingComparisonService, FinancingParams, FinancingResult } from '@/lib/financing/FinancingComparisonService';

export async function getFinancingComparisonAction(params: FinancingParams): Promise<FinancingResult | null> {
  try {
    return await FinancingComparisonService.getComparison(params);
  } catch (error) {
    console.error("Error fetching financing comparison:", error);
    return null;
  }
}
