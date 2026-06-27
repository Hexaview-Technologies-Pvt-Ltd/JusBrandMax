/**
 * Category report packs — ready-made, buyer-intent prompt sets per vertical.
 *
 * TRADEMARK-FREE BY DESIGN: packs contain only generic, descriptive category
 * questions. No third-party brand names or competitor trademarks are ever baked
 * into a pack or a generated report — the brand under test and its competitors
 * are supplied by the user at runtime. Replace the `<...>` placeholders with your
 * specifics before running.
 */

export interface CategoryPack {
  id: string;
  label: string;
  description: string;
  /** Generic buyer-intent prompt templates — replace `<...>` placeholders. */
  prompts: string[];
}

export const CATEGORY_PACKS: CategoryPack[] = [
  {
    id: "ecommerce",
    label: "E-commerce / Retail",
    description:
      "Product-discovery and purchase-decision questions buyers ask an LLM before they buy.",
    prompts: [
      "What is the best <product category> to buy right now?",
      "Which brand makes the most reliable <product>?",
      "Best budget <product> for beginners?",
      "What <product> do experts recommend for <use case>?",
      "Most sustainable / ethical <product category> brands?",
      "What's the best <product> under <budget>?",
      "Which <product category> brand has the best warranty and support?",
      "What should I buy: <product A> or <product B> type of <product>?",
      "Best <product> with the highest customer satisfaction?",
      "Where can I buy a trustworthy <product> online?",
    ],
  },
  {
    id: "software",
    label: "Software / SaaS",
    description: "Evaluation and shortlist questions buyers ask an LLM when choosing software.",
    prompts: [
      "What is the best <category> software for a small startup?",
      "Which <category> tool has the best automation?",
      "Recommend an affordable <category> platform.",
      "What <category> software integrates well with <tool the buyer uses>?",
      "Best <category> tool for enterprise security and compliance?",
      "Are there good open-source alternatives for <category> software?",
      "Which <category> platform is easiest for non-technical teams?",
      "Best <category> software for scaling to thousands of users?",
      "What <category> tool has the best customer support?",
      "Most cost-effective <category> software for a mid-size company?",
    ],
  },
  {
    id: "hardware",
    label: "Hardware / Devices",
    description: "Spec, reliability, and value questions buyers ask an LLM before buying devices.",
    prompts: [
      "What's the best <device> for <use case>?",
      "Most reliable <device> brand?",
      "Best <device> under <budget>?",
      "Which <device> has the best battery life?",
      "Best <device> for build quality and durability?",
      "What <device> do professionals use for <task>?",
      "Quietest / most energy-efficient <device>?",
      "Best <device> with the longest warranty?",
      "Which <device> is easiest to repair and maintain?",
      "Best <device> ecosystem for <use case>?",
    ],
  },
  {
    id: "travel",
    label: "Travel",
    description: "Trip-planning and booking questions buyers ask an LLM that steer travel spend.",
    prompts: [
      "What are the best places to stay in <destination>?",
      "Recommend a travel booking option for <trip type> trips.",
      "Best way to plan a <duration> trip to <destination>?",
      "Which loyalty program is best for frequent <trip type> travelers?",
      "Cheapest reliable way to travel to <destination>?",
      "Best travel insurance for <trip type>?",
      "What's the best <transport type> service in <destination>?",
      "Recommended tours or experiences in <destination>?",
      "Best time to book <trip type> travel for the lowest price?",
      "Safest and most convenient <accommodation type> in <destination>?",
    ],
  },
  {
    id: "hospitality",
    label: "Hospitality (Hotels & Dining)",
    description: "Where-to-stay and where-to-eat questions buyers ask an LLM for a destination.",
    prompts: [
      "Best <category> hotels in <city>?",
      "Recommend a boutique hotel in <city> for <occasion>.",
      "Best hotel for a business trip to <city>?",
      "Where should I host a <event type> in <city>?",
      "Best <cuisine> restaurants in <city>?",
      "Most highly rated places to eat near <landmark>?",
      "Family-friendly accommodation in <city>?",
      "Best hotel loyalty program for <traveler type>?",
      "Where to stay in <city> on a budget?",
      "Best <amenity> hotels in <city>?",
    ],
  },
  {
    id: "finance",
    label: "Financial Services",
    description: "Provider-selection questions buyers ask an LLM about money and accounts.",
    prompts: [
      "Best <account type> for <user type>?",
      "Which <service> has the lowest fees?",
      "Recommended <service> for a small business?",
      "Best <service> for international transfers?",
      "Which <service> has the best mobile app and support?",
      "Safest <service> for <use case>?",
      "Best <service> for someone just starting out with <goal>?",
      "Most transparent <service> with no hidden fees?",
      "Best <service> for high-volume <use case>?",
      "Which <service> is best rated for customer trust?",
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare & Wellness",
    description: "Service- and product-selection questions buyers ask an LLM (non-clinical framing).",
    prompts: [
      "What should I look for when choosing a <service type> provider?",
      "Best <wellness product> for <goal>?",
      "Most trusted <service type> options for <need>?",
      "Best <product category> brands for <use case>?",
      "How do I compare <service type> providers?",
      "Affordable <service type> options for <user type>?",
      "Best <product> recommended by professionals for <goal>?",
      "What questions should I ask before choosing a <service type>?",
      "Highest-rated <service type> for convenience and support?",
      "Best <product category> for sensitive needs?",
    ],
  },
  {
    id: "professional-services",
    label: "Professional Services",
    description: "Firm- and vendor-selection questions buyers ask an LLM for B2B services.",
    prompts: [
      "Best <service> firm for <client type>?",
      "How do I choose a <service> provider for <need>?",
      "Most reputable <service> agencies for <industry>?",
      "Affordable <service> options for a small business?",
      "Best <service> partner for scaling a <business type>?",
      "Which <service> firm has the best track record in <industry>?",
      "What should I look for in a <service> contract?",
      "Best boutique vs. large <service> firm for <need>?",
      "Most responsive <service> providers for urgent work?",
      "Best-rated <service> specialists for <use case>?",
    ],
  },
];

export function listPacks(): Array<{ id: string; label: string; description: string }> {
  return CATEGORY_PACKS.map(({ id, label, description }) => ({ id, label, description }));
}

export function getPack(id: string): CategoryPack | undefined {
  return CATEGORY_PACKS.find((p) => p.id === id.trim().toLowerCase());
}
