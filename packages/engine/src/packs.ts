/**
 * Category report packs — ready-made, buyer-intent prompt sets per vertical.
 *
 * Each pack has two intent bands:
 *  - `prompts`        — DIRECT intent ("what's the best <category>?") — active shopping.
 *  - `indirectPrompts`— INDIRECT intent — the problem/jobs-to-be-done questions that
 *    drive demand *before* the buyer names the category. Brands that surface here shape
 *    the decision earliest, so measuring both bands shows where demand forms vs. where
 *    you actually appear.
 *
 * TRADEMARK-FREE BY DESIGN: packs contain only generic, descriptive questions. No
 * third-party brand names are ever baked in — the brand under test and its competitors
 * are supplied by the user at runtime. Replace the `<...>` placeholders before running.
 */

export interface CategoryPack {
  id: string;
  label: string;
  description: string;
  /** Direct-intent prompt templates — replace `<...>` placeholders. */
  prompts: string[];
  /** Indirect-intent prompt templates (problem / jobs-to-be-done). */
  indirectPrompts: string[];
}

export const CATEGORY_PACKS: CategoryPack[] = [
  {
    id: "ecommerce",
    label: "E-commerce / Retail",
    description: "Product-discovery and purchase questions buyers ask an LLM before they buy.",
    prompts: [
      "What is the best <product category> to buy right now?",
      "Which brand makes the most reliable <product>?",
      "Best budget <product> for beginners?",
      "What <product> do experts recommend for <use case>?",
      "Most sustainable / ethical <product category> brands?",
      "What's the best <product> under <budget>?",
      "Which <product category> brand has the best warranty and support?",
      "Best <product> with the highest customer satisfaction?",
    ],
    indirectPrompts: [
      "How do I choose the right <product> for <use case>?",
      "Is it worth upgrading my <product>?",
      "How do I make my <product> last longer?",
      "What should I look for when buying a <product>?",
      "Gift ideas for someone who needs a <product>?",
      "How do I solve <problem the product addresses>?",
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
      "Most cost-effective <category> software for a mid-size company?",
    ],
    indirectPrompts: [
      "How do I <job to be done> more efficiently?",
      "How can a small team automate <workflow>?",
      "What's the best way to manage <process> as we scale?",
      "How do I reduce <pain point> in my <function> team?",
      "How do other companies handle <process>?",
      "What's slowing down my <function> team and how do I fix it?",
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
      "Best <device> with the longest warranty?",
      "Best <device> ecosystem for <use case>?",
    ],
    indirectPrompts: [
      "How do I improve my <setup> for <task>?",
      "What gear do I need to start <activity>?",
      "How do I make my <workspace> more <goal>?",
      "Why is my <task> so slow / unreliable, and what helps?",
      "What's the upgrade that makes the biggest difference for <use case>?",
    ],
  },
  {
    id: "travel",
    label: "Travel",
    description: "Trip-planning and booking questions buyers ask an LLM that steer travel spend.",
    prompts: [
      "What are the best places to stay in <destination>?",
      "Recommend a travel booking option for <trip type> trips.",
      "Which loyalty program is best for frequent <trip type> travelers?",
      "Cheapest reliable way to travel to <destination>?",
      "Best travel insurance for <trip type>?",
      "What's the best <transport type> service in <destination>?",
      "Best time to book <trip type> travel for the lowest price?",
      "Safest and most convenient <accommodation type> in <destination>?",
    ],
    indirectPrompts: [
      "How do I plan a <duration> trip to <destination> on a budget?",
      "What's the best way to get around <destination>?",
      "How do I avoid <common travel problem>?",
      "What should I know before visiting <destination>?",
      "How do I make a <trip type> trip less stressful?",
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
      "Best <cuisine> restaurants in <city>?",
      "Most highly rated places to eat near <landmark>?",
      "Family-friendly accommodation in <city>?",
      "Where to stay in <city> on a budget?",
      "Best <amenity> hotels in <city>?",
    ],
    indirectPrompts: [
      "Where should I take <guest type> in <city>?",
      "How do I plan a <occasion> in <city>?",
      "What's a good neighborhood to stay in <city>?",
      "Best way to experience <city> in <duration>?",
      "Where do locals eat in <city>?",
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
      "Best <service> for someone just starting out with <goal>?",
      "Most transparent <service> with no hidden fees?",
      "Which <service> is best rated for customer trust?",
    ],
    indirectPrompts: [
      "How do I manage <financial goal>?",
      "What's the best way to save on <expense>?",
      "How do I start <financial activity>?",
      "How do I reduce fees on <financial activity>?",
      "What should I know before choosing a <service>?",
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
      "Affordable <service type> options for <user type>?",
      "Best <product> recommended by professionals for <goal>?",
      "Highest-rated <service type> for convenience and support?",
      "Best <product category> for sensitive needs?",
    ],
    indirectPrompts: [
      "How do I improve <wellness goal>?",
      "What helps with <general need>?",
      "How do I choose the right <service type>?",
      "What questions should I ask before choosing a <service type>?",
      "How do I build a routine for <wellness goal>?",
    ],
  },
  {
    id: "professional-services",
    label: "Professional Services",
    description: "Firm- and vendor-selection questions buyers ask an LLM for B2B services.",
    prompts: [
      "Best <service> firm for <client type>?",
      "Most reputable <service> agencies for <industry>?",
      "Affordable <service> options for a small business?",
      "Best <service> partner for scaling a <business type>?",
      "Which <service> firm has the best track record in <industry>?",
      "Best boutique vs. large <service> firm for <need>?",
      "Most responsive <service> providers for urgent work?",
      "Best-rated <service> specialists for <use case>?",
    ],
    indirectPrompts: [
      "How do I handle <business need> without hiring full-time?",
      "When should I outsource <function>?",
      "How do I scale <process> without adding headcount?",
      "What's the most cost-effective way to get <outcome>?",
      "How do other <business type> companies handle <function>?",
    ],
  },
];

export function listPacks(): Array<{ id: string; label: string; description: string }> {
  return CATEGORY_PACKS.map(({ id, label, description }) => ({ id, label, description }));
}

export function getPack(id: string): CategoryPack | undefined {
  return CATEGORY_PACKS.find((p) => p.id === id.trim().toLowerCase());
}
