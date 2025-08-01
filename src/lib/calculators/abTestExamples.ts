/**
 * Sample A/B test scenarios for demonstration and learning
 */

import type { TestConfig, TestMetadata, Variation } from "~/types"

export interface TestExample {
  id: string
  name: string
  description: string
  category: "ecommerce" | "saas" | "media" | "mobile" | "general"
  config: TestConfig
  metadata: TestMetadata
  variations: Variation[]
  insights?: string[]
}

export const abTestExamples: TestExample[] = [
  {
    id: "checkout-button-color",
    name: "E-commerce Checkout Button Color",
    description: "Testing whether a green CTA button performs better than the current blue button",
    category: "ecommerce",
    config: {
      testType: "ab",
      metric: "conversion",
      statisticalMethod: "frequentist",
      confidenceLevel: 95,
      testDirection: "two-tailed",
      minimumEffect: 5,
      trafficAllocation: { control: 50, "variant-a": 50 },
      correctionMethod: "none",
    },
    metadata: {
      name: "Checkout Button Color Test",
      hypothesis:
        "By changing the checkout button from blue to green, we expect to see a 10% increase in checkout completion rate because green is associated with 'go' and positive action.",
      owner: "Sarah Johnson",
      stakeholders: ["UX Team", "Product", "Engineering"],
      tags: ["checkout", "cta", "color", "conversion"],
      businessImpact: {
        metric: "revenue",
        estimatedValue: 150000,
        confidence: "medium",
      },
    },
    variations: [
      { id: "control", name: "Blue Button (Control)", visitors: 15000, conversions: 675 },
      { id: "variant-a", name: "Green Button", visitors: 15000, conversions: 743 },
    ],
    insights: [
      "Green button shows +10.1% relative uplift",
      "Result is statistically significant (p < 0.05)",
      "Estimated annual revenue impact: $150,000",
    ],
  },
  {
    id: "pricing-page-layout",
    name: "SaaS Pricing Page Layout",
    description: "Testing a simplified pricing page with fewer options vs current complex layout",
    category: "saas",
    config: {
      testType: "ab",
      metric: "conversion",
      statisticalMethod: "frequentist",
      confidenceLevel: 95,
      testDirection: "two-tailed",
      minimumEffect: 8,
      trafficAllocation: { control: 50, "variant-a": 50 },
      correctionMethod: "none",
    },
    metadata: {
      name: "Pricing Page Simplification",
      hypothesis:
        "By reducing pricing options from 5 to 3 tiers, we expect to reduce analysis paralysis and increase sign-ups by 15% based on the paradox of choice principle.",
      owner: "Michael Chen",
      stakeholders: ["Sales", "Marketing", "Product"],
      tags: ["pricing", "conversion", "simplification"],
      businessImpact: {
        metric: "mrr",
        estimatedValue: 50000,
        confidence: "high",
      },
    },
    variations: [
      { id: "control", name: "5 Pricing Tiers", visitors: 8500, conversions: 255 },
      { id: "variant-a", name: "3 Pricing Tiers", visitors: 8500, conversions: 298 },
    ],
    insights: [
      "Simplified pricing shows +16.9% conversion rate improvement",
      "Statistical power is 85% - very reliable result",
      "Recommend immediate implementation",
    ],
  },
  {
    id: "article-recommendation",
    name: "Media Site Article Recommendations",
    description: "Testing ML-based recommendations vs editorial picks for increasing page views",
    category: "media",
    config: {
      testType: "ab",
      metric: "engagement",
      statisticalMethod: "frequentist",
      confidenceLevel: 95,
      testDirection: "two-tailed",
      minimumEffect: 3,
      trafficAllocation: { control: 50, "variant-a": 50 },
      correctionMethod: "none",
    },
    metadata: {
      name: "ML vs Editorial Recommendations",
      hypothesis:
        "Machine learning recommendations will increase average pages per session by 20% compared to manual editorial picks due to better personalization.",
      owner: "Lisa Wang",
      stakeholders: ["Editorial", "Data Science", "Engineering"],
      tags: ["recommendations", "engagement", "ml", "personalization"],
      businessImpact: {
        metric: "ad_revenue",
        estimatedValue: 200000,
        confidence: "medium",
      },
    },
    variations: [
      { id: "control", name: "Editorial Picks", visitors: 50000, conversions: 12500 },
      { id: "variant-a", name: "ML Recommendations", visitors: 50000, conversions: 14250 },
    ],
    insights: [
      "ML recommendations show +14% engagement increase",
      "Large sample size provides high statistical confidence",
      "Consider A/B/n test to compare different ML models",
    ],
  },
  {
    id: "mobile-onboarding",
    name: "Mobile App Onboarding Flow",
    description: "Testing shorter 3-step onboarding vs current 5-step process",
    category: "mobile",
    config: {
      testType: "ab",
      metric: "conversion",
      statisticalMethod: "frequentist",
      confidenceLevel: 95,
      testDirection: "one-tailed",
      minimumEffect: 10,
      trafficAllocation: { control: 50, "variant-a": 50 },
      correctionMethod: "none",
    },
    metadata: {
      name: "Simplified Mobile Onboarding",
      hypothesis:
        "Reducing onboarding from 5 to 3 steps will increase completion rate by 25% by reducing friction and cognitive load on mobile devices.",
      owner: "David Park",
      stakeholders: ["Mobile Team", "UX", "Product"],
      tags: ["onboarding", "mobile", "friction", "activation"],
      businessImpact: {
        metric: "user_activation",
        estimatedValue: 75000,
        confidence: "high",
      },
    },
    variations: [
      { id: "control", name: "5-Step Onboarding", visitors: 12000, conversions: 7200 },
      { id: "variant-a", name: "3-Step Onboarding", visitors: 12000, conversions: 8880 },
    ],
    insights: [
      "Shorter onboarding increases completion by +23.3%",
      "One-tailed test appropriate for directional hypothesis",
      "Consider segmenting by device type for deeper insights",
    ],
  },
  {
    id: "email-subject-line",
    name: "Email Subject Line Testing",
    description: "Testing personalized vs generic subject lines for email open rates",
    category: "general",
    config: {
      testType: "ab",
      metric: "conversion",
      statisticalMethod: "frequentist",
      confidenceLevel: 99,
      testDirection: "two-tailed",
      minimumEffect: 2,
      trafficAllocation: { control: 50, "variant-a": 50 },
      correctionMethod: "none",
    },
    metadata: {
      name: "Email Personalization Test",
      hypothesis:
        "Adding first name personalization to subject lines will increase open rates by 15% based on industry benchmarks for personalized email marketing.",
      owner: "Amanda Torres",
      stakeholders: ["Marketing", "CRM Team"],
      tags: ["email", "personalization", "open-rate"],
      businessImpact: {
        metric: "engagement",
        estimatedValue: 25000,
        confidence: "low",
      },
    },
    variations: [
      { id: "control", name: "Generic Subject", visitors: 100000, conversions: 18000 },
      { id: "variant-a", name: "Personalized Subject", visitors: 100000, conversions: 19800 },
    ],
    insights: [
      "Personalization shows +10% open rate improvement",
      "Very large sample provides high precision",
      "99% confidence level appropriate for email due to low implementation cost",
    ],
  },
  {
    id: "search-algorithm",
    name: "Search Algorithm A/B/n Test",
    description: "Testing current search vs two new algorithms for result relevance",
    category: "general",
    config: {
      testType: "abn",
      metric: "engagement",
      statisticalMethod: "frequentist",
      confidenceLevel: 95,
      testDirection: "two-tailed",
      minimumEffect: 5,
      trafficAllocation: { control: 33.33, "variant-a": 33.33, "variant-b": 33.34 },
      correctionMethod: "bonferroni",
    },
    metadata: {
      name: "Search Algorithm Comparison",
      hypothesis:
        "New semantic search algorithms will improve result click-through rate by understanding user intent better than keyword matching.",
      owner: "Tech Team",
      stakeholders: ["Search Team", "Product", "Engineering"],
      tags: ["search", "algorithm", "relevance", "abn-test"],
      businessImpact: {
        metric: "user_satisfaction",
        estimatedValue: 100000,
        confidence: "medium",
      },
    },
    variations: [
      { id: "control", name: "Keyword Match", visitors: 30000, conversions: 9000 },
      { id: "variant-a", name: "Semantic Search v1", visitors: 30000, conversions: 9600 },
      { id: "variant-b", name: "Semantic Search v2", visitors: 30000, conversions: 10200 },
    ],
    insights: [
      "Both new algorithms outperform control",
      "Bonferroni correction applied for multiple comparisons",
      "Semantic v2 shows +13.3% improvement and is the clear winner",
    ],
  },
  {
    id: "free-trial-length",
    name: "SaaS Free Trial Duration",
    description: "Testing 14-day vs 30-day free trial for conversion to paid",
    category: "saas",
    config: {
      testType: "ab",
      metric: "conversion",
      statisticalMethod: "frequentist",
      confidenceLevel: 95,
      testDirection: "two-tailed",
      minimumEffect: 10,
      trafficAllocation: { control: 50, "variant-a": 50 },
      correctionMethod: "none",
    },
    metadata: {
      name: "Trial Length Optimization",
      hypothesis:
        "A shorter 14-day trial will create urgency and increase paid conversion rate by 20% compared to 30-day trial, despite lower trial sign-ups.",
      owner: "Growth Team",
      stakeholders: ["Sales", "Customer Success", "Finance"],
      tags: ["trial", "conversion", "pricing", "urgency"],
      businessImpact: {
        metric: "ltv",
        estimatedValue: 300000,
        confidence: "high",
      },
    },
    variations: [
      { id: "control", name: "30-Day Trial", visitors: 5000, conversions: 350 },
      { id: "variant-a", name: "14-Day Trial", visitors: 5000, conversions: 425 },
    ],
    insights: [
      "14-day trial shows +21.4% conversion improvement",
      "Validates urgency hypothesis",
      "Monitor churn rates post-conversion for full picture",
    ],
  },
  {
    id: "video-autoplay",
    name: "Landing Page Video Autoplay",
    description: "Testing autoplay video vs static hero image for engagement",
    category: "media",
    config: {
      testType: "ab",
      metric: "engagement",
      statisticalMethod: "frequentist",
      confidenceLevel: 90,
      testDirection: "two-tailed",
      minimumEffect: 5,
      trafficAllocation: { control: 50, "variant-a": 50 },
      correctionMethod: "none",
    },
    metadata: {
      name: "Hero Video Autoplay Test",
      hypothesis:
        "Autoplay video will increase time on page by 30% but may increase bounce rate on mobile due to data concerns.",
      owner: "Content Team",
      stakeholders: ["Design", "Marketing", "Engineering"],
      tags: ["video", "engagement", "landing-page", "autoplay"],
      businessImpact: {
        metric: "engagement",
        estimatedValue: 40000,
        confidence: "low",
      },
    },
    variations: [
      { id: "control", name: "Static Hero Image", visitors: 20000, conversions: 4000 },
      { id: "variant-a", name: "Autoplay Video", visitors: 20000, conversions: 3600 },
    ],
    insights: [
      "Autoplay video shows -10% engagement (negative result)",
      "Consider segmenting by device type",
      "Static image performs better overall - keep control",
    ],
  },
]

/**
 * Get examples by category
 */
export function getExamplesByCategory(category: TestExample["category"]): TestExample[] {
  return abTestExamples.filter((example) => example.category === category)
}

/**
 * Get a random example
 */
export function getRandomExample(): TestExample {
  const index = Math.floor(Math.random() * abTestExamples.length)
  return abTestExamples[index]
}

/**
 * Search examples by keyword
 */
export function searchExamples(query: string): TestExample[] {
  const lowerQuery = query.toLowerCase()
  return abTestExamples.filter(
    (example) =>
      example.name.toLowerCase().includes(lowerQuery) ||
      example.description.toLowerCase().includes(lowerQuery) ||
      example.metadata.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}
