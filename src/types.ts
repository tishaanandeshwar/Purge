export type InputCategory = 'message' | 'link' | 'qr' | 'job' | 'trading' | 'image';

export type RiskLevel = 'Safe' | 'Low Risk' | 'Medium Risk' | 'High Risk';

export interface AnalysisFactor {
  title: string;
  percentage: number;
  description: string;
  isPositive?: boolean;
}

export interface RecommendedAction {
  title: string;
  description: string;
  type: 'safe' | 'warning' | 'danger';
}

export interface AnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  category: string;
  summary: string;
  keyWarnings: string[];
  factors: AnalysisFactor[];
  recommendedAction: RecommendedAction;
  rawInput?: string;
  inputType: InputCategory;
  meta?: {
    detectedUrl?: string;
    isUpi?: boolean;
    domain?: string;
    qrType?: string;
  };
}
