/**
 * Green Score Recommendation Engine
 * Frontend-only utility; does not touch the scoring API.
 *
 * Priority rules (per spec):
 *   score < 40  → high
 *   40–69       → medium
 *   ≥ 70        → low   (framing shifts to "maintain / improve further")
 *
 * Output: up to 6 recommendations, sorted weakest category first.
 */

export type RecommendationCategory =
  | "energy"
  | "water"
  | "transportation"
  | "certifications";

export type RecommendationPriority = "high" | "medium" | "low";

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: RecommendationPriority;
  impact: string;
  action: string;
}

export interface CategoryInput {
  score: number;
  weight?: number;
}

export interface GetRecommendationsInput {
  sector: string;
  categories: Partial<Record<RecommendationCategory, CategoryInput>>;
  assessmentData?: {
    renewable_percentage?: number;
  };
}

/* ─── Helpers ───────────────────────────────────────────────── */

function scoreToPriority(score: number): RecommendationPriority {
  if (score < 40) return "high";
  if (score < 70) return "medium";
  return "low";
}

/** When score ≥ 70 we prepend a "maintain" framing note to the description. */
function frameDescription(description: string, score: number): string {
  if (score >= 70) return "Good performance — " + description.charAt(0).toLowerCase() + description.slice(1);
  return description;
}

/* ─── General recommendation pools ─────────────────────────── */
// Each entry will get a priority injected at runtime based on the score.

const GENERAL: Record<RecommendationCategory, Omit<Recommendation, "priority">[]> = {
  energy: [
    {
      id: "gen-energy-led",
      category: "energy",
      title: "Switch to LED Lighting",
      description: "Replace incandescent or fluorescent bulbs with LEDs to cut lighting energy use by up to 75%.",
      impact: "Reduces electricity consumption and monthly utility bills.",
      action: "Audit your current lighting and replace remaining non-LED fixtures this quarter.",
    },
    {
      id: "gen-energy-sensors",
      category: "energy",
      title: "Install Timers or Motion Sensors",
      description: "Automate lighting and equipment in low-traffic areas to eliminate standby energy waste.",
      impact: "Can reduce wasted energy in storage and utility spaces by 20–40%.",
      action: "Fit motion sensors in storerooms, corridors, and toilets.",
    },
    {
      id: "gen-energy-monitoring",
      category: "energy",
      title: "Track Monthly Electricity Consumption",
      description: "Without measurement there is no improvement. Regular tracking reveals usage patterns and anomalies.",
      impact: "Enables targeted reductions and supports green finance reporting.",
      action: "Record meter readings or install a smart meter and review data monthly.",
    },
    {
      id: "gen-energy-maintenance",
      category: "energy",
      title: "Maintain Cooling, Heating, and Electrical Equipment",
      description: "Poorly maintained equipment uses 10–25% more energy and breaks down more often.",
      impact: "Lowers running costs and extends equipment lifetime.",
      action: "Schedule a professional service check for HVAC and major appliances every 6 months.",
    },
    {
      id: "gen-energy-renewables",
      category: "energy",
      title: "Increase Renewable Energy Usage",
      description: "Shifting to renewables lowers your carbon footprint and qualifies your business for green lending products.",
      impact: "Directly improves your Green Finance Score and reduces long-term energy costs.",
      action: "Contact your electricity provider about a renewable tariff or obtain quotes for solar installation.",
    },
    {
      id: "gen-energy-solar",
      category: "energy",
      title: "Consider Solar Panels or a Renewable Provider",
      description: "On-site solar generation or a green electricity tariff is one of the highest-impact steps for most SMEs.",
      impact: "Can supply 30–80% of a business's electricity needs depending on roof size and usage.",
      action: "Request a feasibility assessment from a certified solar installer.",
    },
    {
      id: "gen-energy-low-renewables",
      category: "energy",
      title: "Gradually Increase Renewable Energy Share",
      description: "Your current renewable energy share is below 20%. Even a modest increase delivers measurable carbon and cost benefits.",
      impact: "Each 10% shift to renewables reduces your Scope 2 emissions proportionally.",
      action: "Set a target to reach at least 20% renewable electricity within 12 months.",
    },
  ],
  water: [
    {
      id: "gen-water-leaks",
      category: "water",
      title: "Inspect Regularly for Leaks",
      description: "A dripping tap can waste thousands of litres a year. Routine checks catch problems early.",
      impact: "Immediate reduction in wasted water and lower utility costs.",
      action: "Walk through all taps, pipes, and toilets monthly and repair any drips within 48 hours.",
    },
    {
      id: "gen-water-lowflow",
      category: "water",
      title: "Install Low-Flow Taps and Fixtures",
      description: "Low-flow aerators reduce flow rates by 30–50% with no noticeable impact on usability.",
      impact: "Measurable reduction in water bills and consumption figures.",
      action: "Fit aerators and flow restrictors to all washroom and kitchen taps.",
    },
    {
      id: "gen-water-track",
      category: "water",
      title: "Track Monthly Water Use",
      description: "Measuring consumption is the first step to controlling it and evidencing progress.",
      impact: "Supports green reporting and helps identify sudden increases from leaks.",
      action: "Log your water meter reading at the start of each month.",
    },
    {
      id: "gen-water-reuse",
      category: "water",
      title: "Reuse Water Where Operationally Appropriate",
      description: "Some grey water from cleaning or cooling processes can be reused safely for irrigation or flushing.",
      impact: "Can reduce mains water demand by 10–30% depending on operations.",
      action: "Identify one water reuse opportunity in your premises and trial it this month.",
    },
    {
      id: "gen-water-training",
      category: "water",
      title: "Train Staff on Water Conservation",
      description: "Staff behaviour is the easiest lever to pull. Brief awareness training creates lasting habits.",
      impact: "Low cost, high return — staff-driven savings typically reduce usage by 5–15%.",
      action: "Hold a 10-minute briefing with your team on reporting leaks and turning off taps.",
    },
  ],
  transportation: [
    {
      id: "gen-trans-combine",
      category: "transportation",
      title: "Combine Deliveries and Reduce Journeys",
      description: "Batching deliveries and errands cuts fuel costs and emissions without affecting service levels.",
      impact: "Fewer trips means lower fuel spend and a reduced transport carbon footprint.",
      action: "Review your weekly delivery or visit schedule and consolidate where possible.",
    },
    {
      id: "gen-trans-routes",
      category: "transportation",
      title: "Encourage Fuel-Efficient Routes",
      description: "Route planning tools can cut fuel use by 10–20% by avoiding congestion and reducing distance.",
      impact: "Direct saving on fuel and vehicle wear.",
      action: "Use a mapping app with traffic data for all regular business routes.",
    },
    {
      id: "gen-trans-vehicle-maintenance",
      category: "transportation",
      title: "Maintain Vehicles Regularly",
      description: "Under-inflated tyres and poor engine maintenance each add 5–10% to fuel consumption.",
      impact: "Lowers running costs and extends vehicle life.",
      action: "Schedule tyre pressure checks and full services at manufacturer-recommended intervals.",
    },
    {
      id: "gen-trans-local-suppliers",
      category: "transportation",
      title: "Use Local Suppliers Where Practical",
      description: "Shorter supply chains reduce inbound delivery distances and your business's Scope 3 emissions.",
      impact: "Supports the local economy and reduces transport-related emissions.",
      action: "Identify two or three current long-distance suppliers and research local alternatives.",
    },
    {
      id: "gen-trans-staff",
      category: "transportation",
      title: "Encourage Sustainable Staff Commuting",
      description: "Public transport, cycling, and car-sharing reduce emissions and can improve staff wellbeing.",
      impact: "Reduces the transport footprint attributable to your workforce.",
      action: "Survey staff on their commute and promote available sustainable options.",
    },
    {
      id: "gen-trans-ev",
      category: "transportation",
      title: "Gradually Introduce Hybrid or Electric Vehicles",
      description: "When replacing vehicles, consider hybrid or full-electric options to lower long-term fuel costs.",
      impact: "Significant emissions reduction over the vehicle lifetime.",
      action: "Compare total cost of ownership for EVs when your next vehicle is due for renewal.",
    },
  ],
  certifications: [
    {
      id: "gen-cert-policy",
      category: "certifications",
      title: "Create a Basic Written Environmental Policy",
      description: "A one-page policy signals commitment, guides decisions, and is required for most green certifications.",
      impact: "Foundation for all further sustainability work and green lending eligibility.",
      action: "Draft a simple policy stating your environmental commitments and review it annually.",
    },
    {
      id: "gen-cert-owner",
      category: "certifications",
      title: "Assign a Sustainability Lead",
      description: "Nominating one person to monitor and report on sustainability actions prevents tasks from falling through the cracks.",
      impact: "Ensures consistent progress and accountability.",
      action: "Designate a staff member (or yourself) as the sustainability point person this week.",
    },
    {
      id: "gen-cert-records",
      category: "certifications",
      title: "Keep Utility and Waste Records",
      description: "Documented electricity, water, fuel, and waste data is required for certifications and green finance applications.",
      impact: "Enables benchmarking, target-setting, and third-party verification.",
      action: "Start a simple spreadsheet tracking monthly utility bills and waste quantities.",
    },
    {
      id: "gen-cert-targets",
      category: "certifications",
      title: "Set Annual Environmental Targets",
      description: "Measurable targets turn good intentions into trackable outcomes.",
      impact: "Drives year-on-year improvement and supports green finance score progression.",
      action: "Set at least one numeric target per category (e.g. reduce electricity by 10% this year).",
    },
    {
      id: "gen-cert-explore",
      category: "certifications",
      title: "Explore Relevant Environmental Certifications",
      description: "Industry-specific or general certifications (such as ISO 14001) validate your sustainability work externally.",
      impact: "Improves access to green finance products and strengthens your reputation.",
      action: "Research one certification applicable to your sector and assess the gap to eligibility.",
    },
    {
      id: "gen-cert-training",
      category: "certifications",
      title: "Train Employees on Sustainability Practices",
      description: "Informed staff implement sustainability actions more effectively and consistently.",
      impact: "Multiplies the impact of every environmental initiative.",
      action: "Schedule a 30-minute sustainability awareness session for all staff this month.",
    },
  ],
};

/* ─── Sector-specific pools ─────────────────────────────────── */

type SectorPool = Partial<Record<RecommendationCategory, Omit<Recommendation, "priority">[]>>;

const SECTOR_POOLS: Record<string, SectorPool> = {
  "Retail & Trade": {
    energy: [
      {
        id: "retail-energy-shop-led",
        category: "energy",
        title: "Replace Shop Lighting with LEDs",
        description: "Retail lighting runs long hours — converting to LED delivers one of the fastest paybacks of any energy investment.",
        impact: "Typically cuts lighting costs by 60–75% and improves product presentation.",
        action: "Audit every light fitting on the shop floor and create a replacement schedule.",
      },
      {
        id: "retail-energy-sensors",
        category: "energy",
        title: "Use Occupancy Sensors in Storage Areas",
        description: "Storage rooms are frequently left lit when empty. Sensors ensure lights are on only when needed.",
        impact: "Eliminates a common source of avoidable energy waste.",
        action: "Install motion sensors in stockrooms, loading bays, and back-of-house areas.",
      },
      {
        id: "retail-energy-standby",
        category: "energy",
        title: "Turn Off Displays and Equipment After Hours",
        description: "Display lighting, signs, and electronic equipment left on overnight waste significant energy.",
        impact: "Reducing standby loads can lower electricity use by 5–15%.",
        action: "Create a closing checklist covering all non-essential electrical items.",
      },
      {
        id: "retail-energy-refrigeration",
        category: "energy",
        title: "Improve Refrigerator and Freezer Maintenance",
        description: "Dirty condenser coils and worn door seals force refrigeration units to work harder.",
        impact: "Regular maintenance can improve efficiency by 10–20%.",
        action: "Clean condenser coils and check door seals on all refrigeration units monthly.",
      },
    ],
    water: [
      {
        id: "retail-water-fixtures",
        category: "water",
        title: "Install Efficient Washroom Fixtures",
        description: "Low-flow taps and dual-flush toilets in staff and customer washrooms reduce water consumption with no change in comfort.",
        impact: "Can cut washroom water use by 30–50%.",
        action: "Fit aerators on all taps and check that cisterns are not running continuously.",
      },
      {
        id: "retail-water-cleaning",
        category: "water",
        title: "Monitor Cleaning-Related Water Consumption",
        description: "Cleaning routines are often the largest controllable water use in retail premises.",
        impact: "Targeted adjustments can reduce cleaning water by 20–40%.",
        action: "Review cleaning schedules and introduce water-efficient cleaning methods.",
      },
    ],
    transportation: [
      {
        id: "retail-trans-deliveries",
        category: "transportation",
        title: "Consolidate Supplier Deliveries",
        description: "Fewer but fuller deliveries reduce transport costs and emissions per unit of stock.",
        impact: "Directly lowers your inbound transport footprint.",
        action: "Negotiate weekly consolidated delivery windows with your main suppliers.",
      },
      {
        id: "retail-trans-local",
        category: "transportation",
        title: "Prioritize Nearby Suppliers",
        description: "Shorter supply chains reduce delivery distances and support the local economy.",
        impact: "Reduces Scope 3 transport emissions from procurement.",
        action: "Identify your three longest-distance suppliers and research local alternatives.",
      },
      {
        id: "retail-trans-lastmile",
        category: "transportation",
        title: "Optimize Last-Mile Delivery Routes",
        description: "Efficient routing reduces fuel costs and delivery time for customer orders.",
        impact: "Can cut delivery fuel spend by 10–25%.",
        action: "Use a route-planning tool for all customer deliveries.",
      },
    ],
    certifications: [
      {
        id: "retail-cert-purchasing",
        category: "certifications",
        title: "Introduce a Sustainable Purchasing Policy",
        description: "Formalizing criteria for supplier selection and packaging choices drives supply-chain improvements.",
        impact: "Reduces packaging waste and supports your green credentials with customers.",
        action: "Draft a one-page purchasing policy requiring suppliers to meet basic environmental standards.",
      },
      {
        id: "retail-cert-packaging",
        category: "certifications",
        title: "Track Packaging Waste and Recycling",
        description: "Measuring packaging waste is the first step to reducing it and demonstrating responsibility.",
        impact: "Supports waste-reduction targets and customer-facing sustainability claims.",
        action: "Start logging packaging waste volumes weekly and set a quarterly reduction target.",
      },
    ],
  },

  "Food & Hospitality": {
    energy: [
      {
        id: "fh-energy-kitchen",
        category: "energy",
        title: "Maintain Kitchen and Refrigeration Equipment",
        description: "Ovens, refrigerators, and air-conditioning units in hospitality run intensively — maintenance keeps them efficient.",
        impact: "Reduces energy consumption and avoids costly breakdowns during service.",
        action: "Book a professional service for all kitchen equipment and refrigeration units every 6 months.",
      },
      {
        id: "fh-energy-appliances",
        category: "energy",
        title: "Use Energy-Efficient Kitchen Appliances",
        description: "When replacing equipment, choose appliances with high energy ratings to lock in long-term savings.",
        impact: "A-rated appliances use 20–40% less energy than older equivalents.",
        action: "Check energy ratings before purchasing any new kitchen equipment.",
      },
      {
        id: "fh-energy-standby-kitchen",
        category: "energy",
        title: "Avoid Leaving Cooking Equipment Running Unnecessarily",
        description: "Pre-heating too early and leaving equipment idle during quiet periods wastes significant energy.",
        impact: "Better scheduling of equipment use can reduce kitchen energy by 10–20%.",
        action: "Create a kitchen equipment schedule aligned with service times.",
      },
      {
        id: "fh-energy-refrigeration-temp",
        category: "energy",
        title: "Improve Refrigeration Temperature Monitoring",
        description: "Overly cold settings waste energy; too warm risks food safety. Monitoring keeps settings optimal.",
        impact: "Correct temperature settings can reduce refrigeration energy by 5–10%.",
        action: "Install thermometers in all fridges and freezers and log temperatures daily.",
      },
    ],
    water: [
      {
        id: "fh-water-fixtures",
        category: "water",
        title: "Install Low-Flow Kitchen and Bathroom Fixtures",
        description: "High-volume tap usage in hospitality means low-flow aerators deliver above-average savings.",
        impact: "Can cut water use at sinks and hand-washing stations by 30–50%.",
        action: "Fit aerators on all kitchen preparation and hand-washing taps.",
      },
      {
        id: "fh-water-leaks",
        category: "water",
        title: "Repair Leaking Taps Immediately",
        description: "In a busy kitchen, dripping taps go unnoticed but waste hundreds of litres per day.",
        impact: "Immediate water and cost savings with minimal repair expense.",
        action: "Check all taps at the start and end of each service and fix any drips within 24 hours.",
      },
      {
        id: "fh-water-dishwashing",
        category: "water",
        title: "Optimize Dishwashing and Cleaning Cycles",
        description: "Running dishwashers only when full and using the correct settings can halve water use per wash.",
        impact: "Significant reduction in both water and energy used for cleaning.",
        action: "Brief kitchen staff on full-load operation and review machine settings.",
      },
      {
        id: "fh-water-greywater",
        category: "water",
        title: "Explore Safe Greywater Reuse",
        description: "Where permitted, safe greywater (e.g. from vegetable washing) can be reused for floor cleaning or irrigation.",
        impact: "Reduces mains water demand with no capital cost.",
        action: "Identify one safe greywater reuse opportunity and trial it with guidance from your health authority.",
      },
    ],
    transportation: [
      {
        id: "fh-trans-deliveries",
        category: "transportation",
        title: "Consolidate Food Supplier Deliveries",
        description: "Frequent small deliveries add up. Coordinating with suppliers reduces trips without affecting freshness.",
        impact: "Fewer deliveries means lower inbound transport emissions and less disruption to service.",
        action: "Negotiate consolidated delivery days with your main food and beverage suppliers.",
      },
      {
        id: "fh-trans-local-sourcing",
        category: "transportation",
        title: "Source Ingredients Locally Where Practical",
        description: "Local sourcing reduces food miles and supports the regional economy.",
        impact: "Shortens supply chains and can be used in customer-facing sustainability messaging.",
        action: "Identify three ingredients currently sourced from far away and find local alternatives.",
      },
      {
        id: "fh-trans-delivery-routes",
        category: "transportation",
        title: "Optimize Food Delivery Routes",
        description: "Efficient routing for customer food delivery reduces fuel costs and keeps food hotter for longer.",
        impact: "Cuts delivery fuel spend and improves customer satisfaction.",
        action: "Use a route-planning app for all delivery orders.",
      },
    ],
    certifications: [
      {
        id: "fh-cert-food-waste",
        category: "certifications",
        title: "Introduce Food-Waste Measurement",
        description: "Tracking food waste by category reveals where losses occur and how to reduce them.",
        impact: "Reduces procurement costs and supports waste-reduction certifications.",
        action: "Start logging daily food waste by type (prep waste, plate waste, spoilage).",
      },
      {
        id: "fh-cert-recycling",
        category: "certifications",
        title: "Establish Recycling and Responsible Sourcing Policies",
        description: "Formal policies for recycling packaging and sourcing food responsibly underpin your green credentials.",
        impact: "Required for most hospitality sustainability certifications.",
        action: "Write a one-page policy covering recycling and sourcing commitments.",
      },
      {
        id: "fh-cert-green-hospitality",
        category: "certifications",
        title: "Explore Green Hospitality Certifications",
        description: "Sector-specific certifications verify your sustainability work and attract environmentally conscious customers.",
        impact: "Differentiates your business and can unlock green finance products.",
        action: "Research hospitality sustainability certifications applicable in Jordan and assess your readiness.",
      },
    ],
  },

  "Small Manufacturing": {
    energy: [
      {
        id: "mfg-energy-machine-monitoring",
        category: "energy",
        title: "Monitor Energy Use of Individual Machines",
        description: "Sub-metering reveals which machines use the most energy and when, enabling targeted reductions.",
        impact: "Identifies the highest-impact opportunities for efficiency investment.",
        action: "Install a clamp meter or sub-meter on your three highest-consumption machines.",
      },
      {
        id: "mfg-energy-idle",
        category: "energy",
        title: "Turn Off Idle Machinery",
        description: "Machines left running between shifts or during breaks consume energy with no productive output.",
        impact: "Can cut standby energy losses by 10–30% depending on machinery type.",
        action: "Create a shutdown checklist for all machines at the end of each shift.",
      },
      {
        id: "mfg-energy-preventive-maintenance",
        category: "energy",
        title: "Perform Preventive Maintenance",
        description: "Well-maintained machines run more efficiently and have fewer costly breakdowns.",
        impact: "Reduces energy use and extends equipment lifetime.",
        action: "Create a maintenance schedule following manufacturer recommendations for all key machines.",
      },
      {
        id: "mfg-energy-motors",
        category: "energy",
        title: "Replace Inefficient Motors When Financially Practical",
        description: "Electric motors account for a large share of manufacturing energy. High-efficiency replacements pay back quickly.",
        impact: "High-efficiency motors use 2–8% less energy, saving significantly over their lifetime.",
        action: "Check the efficiency rating of your main motors and budget for replacements at end of life.",
      },
      {
        id: "mfg-energy-solar-production",
        category: "energy",
        title: "Investigate Rooftop Solar for Your Facility",
        description: "Manufacturing facilities often have large roof areas ideal for solar installation.",
        impact: "Can offset a significant portion of daytime electricity demand.",
        action: "Commission a feasibility study for solar on your production facility roof.",
      },
    ],
    water: [
      {
        id: "mfg-water-measure",
        category: "water",
        title: "Measure Water Used in Production",
        description: "Understanding how much water each process uses is essential for identifying waste.",
        impact: "Enables targeted water-reduction actions and supports green reporting.",
        action: "Sub-meter water use for each major production process.",
      },
      {
        id: "mfg-water-leaks",
        category: "water",
        title: "Detect and Fix Process Leaks",
        description: "Compressed air and water leaks in manufacturing are common and costly but often overlooked.",
        impact: "Fixing leaks can reduce water consumption by 10–20%.",
        action: "Carry out a systematic leak survey of all pipework, fittings, and connections.",
      },
      {
        id: "mfg-water-reuse",
        category: "water",
        title: "Reuse Process Water Where Safe",
        description: "Many manufacturing processes use water that can be treated and reused, reducing mains demand.",
        impact: "Can substantially reduce water costs and discharge volumes.",
        action: "Identify one process stream where water could be recirculated and assess the feasibility.",
      },
      {
        id: "mfg-water-shutoff",
        category: "water",
        title: "Install Shut-Off Controls",
        description: "Automated shut-off valves prevent water flowing when equipment is idle.",
        impact: "Eliminates a significant source of avoidable water waste.",
        action: "Fit automatic shut-off valves to all hoses and wash stations.",
      },
    ],
    transportation: [
      {
        id: "mfg-trans-deliveries",
        category: "transportation",
        title: "Optimize Raw-Material Deliveries",
        description: "Coordinating inbound deliveries reduces the number of vehicle movements to your facility.",
        impact: "Lowers inbound transport emissions and simplifies logistics.",
        action: "Work with your main suppliers to schedule consolidated delivery windows.",
      },
      {
        id: "mfg-trans-load",
        category: "transportation",
        title: "Improve Vehicle Load Utilization",
        description: "Partially loaded vehicles are inefficient. Maximizing load per journey cuts fuel per unit transported.",
        impact: "Direct reduction in per-unit transport cost and emissions.",
        action: "Review outbound shipment schedules and combine loads where possible.",
      },
      {
        id: "mfg-trans-empty",
        category: "transportation",
        title: "Reduce Empty Vehicle Journeys",
        description: "Empty return trips double the transport cost and emissions per delivery.",
        impact: "Eliminating empty runs can halve the transport footprint of affected routes.",
        action: "Explore return-load arrangements with logistics providers or other local businesses.",
      },
    ],
    certifications: [
      {
        id: "mfg-cert-procedures",
        category: "certifications",
        title: "Document Environmental Procedures",
        description: "Written procedures for waste handling, chemical storage, and energy use are required for ISO 14001.",
        impact: "Reduces compliance risk and prepares you for formal certification.",
        action: "Document procedures for your three highest-impact environmental activities.",
      },
      {
        id: "mfg-cert-waste",
        category: "certifications",
        title: "Track Material Waste",
        description: "Measuring waste by type identifies opportunities to reduce scrap and disposal costs.",
        impact: "Waste reduction directly improves profitability and sustainability scores.",
        action: "Start a waste log recording type, quantity, and disposal method for each waste stream.",
      },
      {
        id: "mfg-cert-iso14001",
        category: "certifications",
        title: "Explore ISO 14001 or Equivalent Standards",
        description: "ISO 14001 is the international standard for environmental management systems and is recognized by green finance providers.",
        impact: "Certification opens doors to green finance and differentiates you from competitors.",
        action: "Contact a local certification body to request a gap assessment against ISO 14001.",
      },
    ],
  },

  "Services": {
    energy: [
      {
        id: "svc-energy-computers",
        category: "energy",
        title: "Enable Energy-Saving Settings on Computers",
        description: "Sleep and hibernate settings on office devices can reduce device energy use by 50–70% during idle periods.",
        impact: "Significant savings with zero cost — just a settings change.",
        action: "Set all computers and monitors to sleep after 10 minutes of inactivity.",
      },
      {
        id: "svc-energy-afterhours",
        category: "energy",
        title: "Turn Off Office Equipment After Hours",
        description: "Printers, monitors, and devices left on standby overnight waste energy for no benefit.",
        impact: "Standby loads across a typical office can account for 5–10% of total electricity use.",
        action: "Add a power-off checklist to your end-of-day closing routine.",
      },
      {
        id: "svc-energy-hvac",
        category: "energy",
        title: "Improve Air-Conditioning Scheduling",
        description: "Running HVAC outside working hours is one of the most common sources of avoidable energy waste in offices.",
        impact: "Optimizing HVAC schedules can cut cooling and heating energy by 20–30%.",
        action: "Program thermostats to switch off 30 minutes before the office closes.",
      },
      {
        id: "svc-energy-office-led",
        category: "energy",
        title: "Replace Office Lighting with LEDs",
        description: "LED office lighting improves light quality, reduces eye strain, and cuts energy use significantly.",
        impact: "Reduces office lighting energy by 50–70%.",
        action: "Replace all remaining non-LED ceiling and desk lighting.",
      },
    ],
    water: [
      {
        id: "svc-water-fixtures",
        category: "water",
        title: "Install Low-Flow Office Fixtures",
        description: "Low-flow taps and dual-flush toilets reduce water consumption in office washrooms with no impact on experience.",
        impact: "Can cut office water use by 30–40%.",
        action: "Fit aerators to all taps and ensure toilets have dual-flush mechanisms.",
      },
      {
        id: "svc-water-bills",
        category: "water",
        title: "Monitor Water Bills for Unusual Increases",
        description: "A sudden rise in water bills often indicates an undetected leak.",
        impact: "Early detection prevents significant waste and avoidable costs.",
        action: "Compare water bills month on month and investigate any increase above 10%.",
      },
    ],
    transportation: [
      {
        id: "svc-trans-remote",
        category: "transportation",
        title: "Encourage Remote Meetings",
        description: "Virtual meetings eliminate travel for a large proportion of business interactions at no quality cost.",
        impact: "Each remote meeting saves the travel emissions and time of all attendees.",
        action: "Set a default policy of video calls for internal meetings and client reviews.",
      },
      {
        id: "svc-trans-travel",
        category: "transportation",
        title: "Reduce Unnecessary Business Travel",
        description: "Travel policies that require approval for non-essential trips reduce emissions and costs.",
        impact: "Business travel is often the largest transport emission source for service firms.",
        action: "Introduce a travel approval process that requires justification for any non-local trip.",
      },
      {
        id: "svc-trans-commute",
        category: "transportation",
        title: "Support Public Transport and Car-Sharing",
        description: "Helping staff use public transport or share rides reduces commuting emissions.",
        impact: "Staff commuting often represents 50–70% of a service firm's transport footprint.",
        action: "Survey staff commute patterns and explore subsidies for public transport passes.",
      },
    ],
    certifications: [
      {
        id: "svc-cert-paper",
        category: "certifications",
        title: "Create a Paper Reduction Policy",
        description: "Paper consumption is a visible and easily measured sustainability metric for service businesses.",
        impact: "Reducing paper use cuts costs and demonstrates environmental commitment.",
        action: "Set a target to reduce paper use by 30% and implement default double-sided printing.",
      },
      {
        id: "svc-cert-procurement",
        category: "certifications",
        title: "Introduce Responsible Procurement Guidelines",
        description: "Preferring suppliers with environmental commitments extends your sustainability impact.",
        impact: "Influences your supply chain emissions and qualifies for responsible-sourcing recognition.",
        action: "Add environmental criteria to your supplier selection checklist.",
      },
      {
        id: "svc-cert-tracking",
        category: "certifications",
        title: "Track Office Energy and Waste",
        description: "Documenting energy and waste data enables target-setting and supports green finance applications.",
        impact: "Without records you cannot demonstrate or improve your sustainability performance.",
        action: "Start a monthly tracking sheet for electricity, water, and waste.",
      },
    ],
  },

  "Professional Services": {
    energy: [
      {
        id: "ps-energy-reduce",
        category: "energy",
        title: "Reduce Unnecessary Lighting and Device Usage",
        description: "Turning off screens, lights, and devices in unused areas is the simplest energy saving action.",
        impact: "Immediately reduces your electricity bill with no investment.",
        action: "Do a walk-through audit of your office and identify lights and devices left on unnecessarily.",
      },
      {
        id: "ps-energy-laptops",
        category: "energy",
        title: "Use Energy-Efficient Laptops and Office Equipment",
        description: "Laptops use 60–80% less energy than desktop computers. Energy-rated peripherals also matter.",
        impact: "Reduces device-related energy consumption across your team.",
        action: "Choose energy-rated equipment when refreshing hardware.",
      },
      {
        id: "ps-energy-hvac-schedule",
        category: "energy",
        title: "Improve Heating and Cooling Schedules",
        description: "HVAC set to optimal schedules and temperatures avoids heating or cooling empty premises.",
        impact: "Heating and cooling typically account for 40–60% of office energy use.",
        action: "Program your thermostat to match actual office hours and set temperature bands.",
      },
    ],
    water: [
      {
        id: "ps-water-fixtures",
        category: "water",
        title: "Install Efficient Washroom Fixtures",
        description: "Low-flow taps and efficient toilets are a low-cost, high-impact improvement for professional offices.",
        impact: "Reduces washroom water use by 30–50%.",
        action: "Fit aerators on all taps and check cisterns are not continuously running.",
      },
      {
        id: "ps-water-bills",
        category: "water",
        title: "Monitor Water Bills for Unusual Increases",
        description: "Unexplained bill increases typically signal a leak that may go unnoticed in professional premises.",
        impact: "Early detection saves water and avoids large unbudgeted costs.",
        action: "Review water bills quarterly and investigate any increase over 10%.",
      },
    ],
    transportation: [
      {
        id: "ps-trans-virtual",
        category: "transportation",
        title: "Use Virtual Meetings Where Possible",
        description: "Video conferencing eliminates travel for client meetings, team calls, and briefings.",
        impact: "Can eliminate the majority of business-related transport emissions.",
        action: "Set video call as the default for all non-essential in-person meetings.",
      },
      {
        id: "ps-trans-flexible",
        category: "transportation",
        title: "Encourage Flexible or Remote Work",
        description: "Fewer commuting days per week directly reduces staff transport emissions.",
        impact: "Each remote workday eliminates one commute-trip per employee.",
        action: "Formalize a hybrid working policy if not already in place.",
      },
      {
        id: "ps-trans-travel-reduction",
        category: "transportation",
        title: "Reduce Unnecessary Employee Travel",
        description: "A travel approval process ensures trips are made only when genuinely necessary.",
        impact: "Cuts costs and emissions from the most impactful transport category for professional firms.",
        action: "Require line-manager approval for any non-local business travel.",
      },
    ],
    certifications: [
      {
        id: "ps-cert-paperless",
        category: "certifications",
        title: "Introduce Paperless Workflows",
        description: "Digital document management eliminates paper, storage, and printing costs.",
        impact: "Reduces costs, environmental impact, and improves document security.",
        action: "Migrate your three most paper-intensive processes to a digital workflow this quarter.",
      },
      {
        id: "ps-cert-sustainability-policy",
        category: "certifications",
        title: "Create a Formal Sustainability Policy",
        description: "A documented policy sets clear commitments and is often required by clients and green finance providers.",
        impact: "Foundation for all further sustainability work and green lending eligibility.",
        action: "Draft and publish a one-page sustainability policy on your website or staff handbook.",
      },
      {
        id: "ps-cert-suppliers",
        category: "certifications",
        title: "Select Environmentally Responsible Suppliers",
        description: "Preferring suppliers with sustainability commitments extends your environmental impact.",
        impact: "Reduces indirect (Scope 3) emissions and strengthens your sustainability credentials.",
        action: "Add an environmental questionnaire to your supplier onboarding process.",
      },
    ],
  },

  "Agriculture": {
    energy: [
      {
        id: "agr-energy-pumps",
        category: "energy",
        title: "Use Energy-Efficient Irrigation Pumps",
        description: "Irrigation pumping is one of the highest energy costs in agriculture. Efficient pumps reduce this significantly.",
        impact: "High-efficiency pumps can reduce pumping energy by 20–40%.",
        action: "Have your pumps tested for efficiency and replace any operating below 60% efficiency.",
      },
      {
        id: "agr-energy-machinery",
        category: "energy",
        title: "Maintain Agricultural Machinery",
        description: "Well-maintained tractors and equipment use less fuel and are less likely to break down at critical times.",
        impact: "Regular maintenance can reduce fuel use by 10–15%.",
        action: "Follow a manufacturer maintenance schedule for all powered equipment.",
      },
      {
        id: "agr-energy-solar-pump",
        category: "energy",
        title: "Explore Solar-Powered Pumping Systems",
        description: "Solar pumps can power irrigation using free sunlight, dramatically reducing electricity or diesel costs.",
        impact: "Can eliminate or greatly reduce pumping energy costs over the system lifetime.",
        action: "Obtain quotes for a solar pumping system sized to your main irrigation needs.",
      },
      {
        id: "agr-energy-track-fuel",
        category: "energy",
        title: "Track Fuel and Electricity Use",
        description: "Monitoring fuel and electricity consumption reveals seasonal patterns and opportunities for reduction.",
        impact: "Enables benchmarking and evidences progress for green finance applications.",
        action: "Log fuel fills and electricity meter readings monthly.",
      },
    ],
    water: [
      {
        id: "agr-water-drip",
        category: "water",
        title: "Use Drip Irrigation Where Suitable",
        description: "Drip irrigation delivers water directly to plant roots, reducing use by 30–50% versus flood irrigation.",
        impact: "One of the highest-impact water efficiency interventions in agriculture.",
        action: "Pilot drip irrigation on your highest-water-use crop and measure the saving.",
      },
      {
        id: "agr-water-timing",
        category: "water",
        title: "Irrigate During Cooler Hours",
        description: "Irrigating at dawn or dusk reduces evaporation losses by up to 30%.",
        impact: "More water reaches plant roots, reducing total water needed per crop.",
        action: "Reschedule irrigation to early morning or early evening.",
      },
      {
        id: "agr-water-moisture",
        category: "water",
        title: "Monitor Soil Moisture",
        description: "Soil moisture sensors prevent over-irrigation, which wastes water and can harm crops.",
        impact: "Data-driven irrigation can reduce water use by 20–40%.",
        action: "Install soil moisture sensors in your highest-value crop fields.",
      },
      {
        id: "agr-water-irrigation-leaks",
        category: "water",
        title: "Repair Irrigation Leaks",
        description: "Leaking pipes and fittings waste water continuously. Regular inspection catches problems early.",
        impact: "Even small leaks can waste thousands of litres per day.",
        action: "Walk your irrigation network monthly and repair all leaks immediately.",
      },
      {
        id: "agr-water-rainwater",
        category: "water",
        title: "Consider Rainwater Harvesting",
        description: "Collecting and storing rainwater reduces dependence on groundwater and mains supply.",
        impact: "Can supply a meaningful proportion of non-potable water needs.",
        action: "Assess the roof and hard-standing area available for rainwater collection.",
      },
    ],
    transportation: [
      {
        id: "agr-trans-journeys",
        category: "transportation",
        title: "Plan Harvest and Supply Journeys Efficiently",
        description: "Combining trips to market, suppliers, and buyers reduces fuel use and vehicle wear.",
        impact: "Fewer, fuller journeys lower per-unit transport costs and emissions.",
        action: "Plan all weekly transport needs in advance and combine trips where possible.",
      },
      {
        id: "agr-trans-consolidate",
        category: "transportation",
        title: "Consolidate Deliveries",
        description: "Coordinating with neighbouring farms or using shared transport reduces total vehicle movements.",
        impact: "Reduces fuel costs and road-transport emissions.",
        action: "Explore shared delivery arrangements with other producers in your area.",
      },
      {
        id: "agr-trans-vehicles",
        category: "transportation",
        title: "Maintain Agricultural Vehicles",
        description: "Well-maintained vehicles use less fuel and have fewer breakdowns at critical harvest times.",
        impact: "Regular maintenance reduces fuel use by 5–15%.",
        action: "Service all vehicles before the main harvest season.",
      },
    ],
    certifications: [
      {
        id: "agr-cert-records",
        category: "certifications",
        title: "Record Input and Resource Use",
        description: "Documenting fertilizer, pesticide, water, and energy use is required for agricultural sustainability certifications.",
        impact: "Enables traceability, supports green finance, and reduces input waste.",
        action: "Start a farm inputs register tracking quantities and application dates.",
      },
      {
        id: "agr-cert-certification",
        category: "certifications",
        title: "Explore Sustainable or Organic Agriculture Certifications",
        description: "Recognized certifications open premium markets and support access to green finance products.",
        impact: "Certified produce often commands higher prices and is preferred by export buyers.",
        action: "Research applicable certifications and request a gap assessment from a certification body.",
      },
      {
        id: "agr-cert-soil-water-plan",
        category: "certifications",
        title: "Create Soil and Water Management Plans",
        description: "Written plans for managing soil health and water use are foundational to sustainable farming.",
        impact: "Prevents degradation, reduces inputs over time, and supports certification.",
        action: "Write simple annual plans for soil management and irrigation.",
      },
    ],
  },

  "Crafts & Trades": {
    energy: [
      {
        id: "ct-energy-tools",
        category: "energy",
        title: "Turn Off Tools When Not in Use",
        description: "Power tools and workshop equipment left running idle consume energy with no productive output.",
        impact: "Simple discipline eliminates avoidable energy waste.",
        action: "Brief all staff to switch off tools and equipment as soon as each task is complete.",
      },
      {
        id: "ct-energy-maintain-tools",
        category: "energy",
        title: "Maintain Electric Tools and Machinery",
        description: "Worn blades, dirty motors, and poor lubrication increase energy consumption and tool wear.",
        impact: "Well-maintained tools use less energy and last longer.",
        action: "Schedule regular maintenance for all powered tools and workshop machinery.",
      },
      {
        id: "ct-energy-workshop-lighting",
        category: "energy",
        title: "Improve Workshop Lighting",
        description: "Good LED task lighting improves work quality and reduces eye strain while using less energy.",
        impact: "LED workshop lighting uses 50–70% less energy than older fluorescent systems.",
        action: "Replace workshop lighting with high-output LED fittings.",
      },
      {
        id: "ct-energy-efficient-tools",
        category: "energy",
        title: "Consider Efficient Replacement Tools",
        description: "When replacing tools, newer models are significantly more energy efficient than older equivalents.",
        impact: "Cumulative savings over the lifetime of each tool.",
        action: "Check energy ratings and efficiency specifications when purchasing any new tool.",
      },
    ],
    water: [
      {
        id: "ct-water-cleaning",
        category: "water",
        title: "Reduce Water Use During Cleaning",
        description: "Targeted cleaning techniques use less water with the same results.",
        impact: "Reduces water consumption and site clean-up time.",
        action: "Use spray bottles or targeted cleaning instead of running hoses during clean-up.",
      },
      {
        id: "ct-water-reuse",
        category: "water",
        title: "Reuse Water Where Safe and Practical",
        description: "Water used for rinsing tools or mixing can sometimes be reused safely for lower-grade tasks.",
        impact: "Reduces mains water demand with minimal effort.",
        action: "Identify one reuse opportunity in your workshop routine and implement it.",
      },
      {
        id: "ct-water-plumbing",
        category: "water",
        title: "Inspect Workshop Plumbing",
        description: "Workshops often have older plumbing with slow leaks that go unnoticed.",
        impact: "Fixing leaks immediately eliminates avoidable waste.",
        action: "Check all taps, joints, and hose connections monthly for leaks.",
      },
    ],
    transportation: [
      {
        id: "ct-trans-combine",
        category: "transportation",
        title: "Combine Customer Visits",
        description: "Grouping jobs by location reduces total distance travelled without affecting service.",
        impact: "Fewer journeys directly cuts fuel costs and vehicle wear.",
        action: "Plan each week's jobs by location and group nearby visits on the same day.",
      },
      {
        id: "ct-trans-routes",
        category: "transportation",
        title: "Optimize Routes",
        description: "Route planning tools reduce distance and time spent travelling between jobs.",
        impact: "Can cut weekly fuel spend by 10–20%.",
        action: "Use a mapping app to plan the most efficient route for each day's jobs.",
      },
      {
        id: "ct-trans-vehicle-maintenance",
        category: "transportation",
        title: "Maintain Work Vehicles",
        description: "Proper tyre pressure, oil levels, and servicing each contribute to lower fuel consumption.",
        impact: "Regular maintenance reduces fuel use by 5–15% and extends vehicle life.",
        action: "Check tyre pressure weekly and service vehicles at recommended intervals.",
      },
      {
        id: "ct-trans-local-materials",
        category: "transportation",
        title: "Source Materials Locally When Possible",
        description: "Shorter material supply chains reduce collection trips and delivery distances.",
        impact: "Reduces transport emissions and supports local suppliers.",
        action: "Identify your main materials and research local suppliers for each.",
      },
    ],
    certifications: [
      {
        id: "ct-cert-waste",
        category: "certifications",
        title: "Track Material Waste",
        description: "Measuring off-cuts, packaging, and waste materials identifies opportunities to reduce and reuse.",
        impact: "Waste reduction lowers material costs and disposal fees.",
        action: "Log waste by material type each week and set a quarterly reduction target.",
      },
      {
        id: "ct-cert-disposal",
        category: "certifications",
        title: "Improve Safe Disposal Procedures",
        description: "Proper disposal of chemicals, oils, and materials protects the environment and ensures compliance.",
        impact: "Reduces environmental risk and demonstrates responsible practice.",
        action: "Document your disposal procedure for each hazardous material type used.",
      },
      {
        id: "ct-cert-policy",
        category: "certifications",
        title: "Create a Basic Environmental Policy",
        description: "A simple written policy demonstrates commitment and guides all future sustainability actions.",
        impact: "Foundation for green finance applications and customer-facing sustainability claims.",
        action: "Write a one-page policy covering waste, energy, water, and transport commitments.",
      },
    ],
  },
};

/* ─── Main export ────────────────────────────────────────────── */

const CATEGORY_ORDER: RecommendationCategory[] = [
  "energy",
  "water",
  "transportation",
  "certifications",
];

const MAX_RECOMMENDATIONS = 6;

export function getGreenRecommendations(input: GetRecommendationsInput): Recommendation[] {
  const { sector, categories, assessmentData } = input;

  // Sort categories weakest first so we pick recs for the most important areas first
  const sortedCategories = CATEGORY_ORDER
    .filter((cat) => categories[cat] !== undefined)
    .sort((a, b) => (categories[a]?.score ?? 100) - (categories[b]?.score ?? 100));

  const sectorPool = SECTOR_POOLS[sector] ?? {};
  const usedIds = new Set<string>();
  const result: Recommendation[] = [];

  for (const cat of sortedCategories) {
    if (result.length >= MAX_RECOMMENDATIONS) break;

    const score = categories[cat]?.score ?? 100;
    const priority = scoreToPriority(score);

    // Gather candidate recs: sector-specific first, then general fallbacks
    const sectorRecs = sectorPool[cat] ?? [];
    const generalRecs = GENERAL[cat] ?? [];

    // Special case: if renewable_percentage < 20 and category is energy,
    // ensure the low-renewables rec is at the front of general candidates
    let candidates: Omit<Recommendation, "priority">[] = [...sectorRecs];

    if (cat === "energy") {
      const renewablePct = assessmentData?.renewable_percentage ?? 100;
      if (renewablePct < 20) {
        // Put the low-renewables rec first among general recs
        const lowRenewable = generalRecs.find((r) => r.id === "gen-energy-low-renewables");
        const others = generalRecs.filter((r) => r.id !== "gen-energy-low-renewables");
        candidates = [...candidates, ...(lowRenewable ? [lowRenewable, ...others] : others)];
      } else {
        candidates = [...candidates, ...generalRecs.filter((r) => r.id !== "gen-energy-low-renewables")];
      }
    } else {
      candidates = [...candidates, ...generalRecs];
    }

    // Pick one rec per category (or more if space allows), skipping used ids
    let addedForCat = 0;
    const maxPerCat = Math.max(1, Math.ceil((MAX_RECOMMENDATIONS - result.length) / (sortedCategories.length - sortedCategories.indexOf(cat))));

    for (const rec of candidates) {
      if (result.length >= MAX_RECOMMENDATIONS) break;
      if (addedForCat >= maxPerCat) break;
      if (usedIds.has(rec.id)) continue;

      usedIds.add(rec.id);
      addedForCat++;

      result.push({
        ...rec,
        description: frameDescription(rec.description, score),
        priority,
      });
    }
  }

  // Sort: high → medium → low, then stable (already weakest-category-first)
  const priorityOrder: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
  result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return result.slice(0, MAX_RECOMMENDATIONS);
}
