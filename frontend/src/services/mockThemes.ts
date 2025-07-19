import type { Theme } from '../types';

export const mockThemes: Theme[] = [
  {
    id: 1,
    theme_name: "Machine Learning Models",
    summary: "Comparison of various machine learning models for loan default risk prediction",
    supporting_documents: ["155_2025017539.pdf"],
    evidence: "The paper compares XGBoost, Logistic Regression, Gradient Boosting, and Random Forest models for predicting loan default risk. XGBoost shows superior performance in handling missing data through regularization."
  },
  {
    id: 2,
    theme_name: "Feature Engineering",
    summary: "Importance of feature engineering in improving model performance",
    supporting_documents: ["155_2025017539.pdf"],
    evidence: "Feature engineering improves model performance by introducing financial ratios (income-to-loan, balance-to-credit, debt-to-income) and polynomial features to reveal nonlinear relationships."
  },
  {
    id: 3,
    theme_name: "Economic Indicators",
    summary: "Role of economic indicators in default risk prediction",
    supporting_documents: ["155_2025017539.pdf"],
    evidence: "Economic indicators like asset-to-liability ratios are key to understanding default risks, with data from sources like the World Bank providing crucial insights for lenders in their decision-making."
  }
]; 