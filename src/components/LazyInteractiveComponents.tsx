import { lazy, Suspense } from 'react'

// Lazy load all interactive components to reduce initial bundle size
const UnitEconomicsCalculator = lazy(() => import('./UnitEconomicsCalculator'))
const ABTestSimulator = lazy(() => import('./ABTestSimulator'))
const TechnicalDebtSimulator = lazy(() => import('./TechnicalDebtSimulator'))
const PricingPsychologySimulator = lazy(
  () => import('./PricingPsychologySimulator')
)
const SaaSMetricsDashboard = lazy(() => import('./SaaSMetricsDashboard'))
const StartupRunwayCalculator = lazy(() => import('./StartupRunwayCalculator'))
const ProductMarketFitScorer = lazy(() => import('./ProductMarketFitScorer'))
const TAMSAMSOMCalculator = lazy(() => import('./TAMSAMSOMCalculator'))
const GrowthStrategySimulator = lazy(() => import('./GrowthStrategySimulator'))
const HiringCostCalculator = lazy(() => import('./HiringCostCalculator'))
const FeaturePrioritizationMatrix = lazy(
  () => import('./FeaturePrioritizationMatrix')
)
const TechnicalArchitectureVisualizer = lazy(
  () => import('./TechnicalArchitectureVisualizer')
)
const CustomerDevelopmentSimulator = lazy(
  () => import('./CustomerDevelopmentSimulator')
)
const EngineeringVelocityTracker = lazy(
  () => import('./EngineeringVelocityTracker')
)
const RetentionCohortAnalyzer = lazy(() => import('./RetentionCohortAnalyzer'))
const PerformanceBudgetCalculator = lazy(
  () => import('./PerformanceBudgetCalculator')
)
const BuildTimeAnalyzer = lazy(() => import('./BuildTimeAnalyzer'))

// Loading fallback component
const InteractiveLoading = () => (
  <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
    <div className="text-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">
        Loading interactive component...
      </p>
    </div>
  </div>
)

// Export components wrapped in Suspense
export const LazyUnitEconomicsCalculator = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <UnitEconomicsCalculator {...props} />
  </Suspense>
)

export const LazyABTestSimulator = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <ABTestSimulator {...props} />
  </Suspense>
)

export const LazyTechnicalDebtSimulator = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <TechnicalDebtSimulator {...props} />
  </Suspense>
)

export const LazyPricingPsychologySimulator = (
  props: Record<string, unknown>
) => (
  <Suspense fallback={<InteractiveLoading />}>
    <PricingPsychologySimulator {...props} />
  </Suspense>
)

export const LazySaaSMetricsDashboard = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <SaaSMetricsDashboard {...props} />
  </Suspense>
)

export const LazyStartupRunwayCalculator = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <StartupRunwayCalculator {...props} />
  </Suspense>
)

export const LazyProductMarketFitScorer = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <ProductMarketFitScorer {...props} />
  </Suspense>
)

export const LazyTAMSAMSOMCalculator = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <TAMSAMSOMCalculator {...props} />
  </Suspense>
)

export const LazyGrowthStrategySimulator = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <GrowthStrategySimulator {...props} />
  </Suspense>
)

export const LazyHiringCostCalculator = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <HiringCostCalculator {...props} />
  </Suspense>
)

export const LazyFeaturePrioritizationMatrix = (
  props: Record<string, unknown>
) => (
  <Suspense fallback={<InteractiveLoading />}>
    <FeaturePrioritizationMatrix {...props} />
  </Suspense>
)

export const LazyTechnicalArchitectureVisualizer = (
  props: Record<string, unknown>
) => (
  <Suspense fallback={<InteractiveLoading />}>
    <TechnicalArchitectureVisualizer {...props} />
  </Suspense>
)

export const LazyCustomerDevelopmentSimulator = (
  props: Record<string, unknown>
) => (
  <Suspense fallback={<InteractiveLoading />}>
    <CustomerDevelopmentSimulator {...props} />
  </Suspense>
)

export const LazyEngineeringVelocityTracker = (
  props: Record<string, unknown>
) => (
  <Suspense fallback={<InteractiveLoading />}>
    <EngineeringVelocityTracker {...props} />
  </Suspense>
)

export const LazyRetentionCohortAnalyzer = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <RetentionCohortAnalyzer {...props} />
  </Suspense>
)

export const LazyPerformanceBudgetCalculator = (
  props: Record<string, unknown>
) => (
  <Suspense fallback={<InteractiveLoading />}>
    <PerformanceBudgetCalculator {...props} />
  </Suspense>
)

export const LazyBuildTimeAnalyzer = (props: Record<string, unknown>) => (
  <Suspense fallback={<InteractiveLoading />}>
    <BuildTimeAnalyzer {...props} />
  </Suspense>
)
