import { Gem, Landmark, PackageOpen, BadgeCheck } from "lucide-react";

const features = [
  {
    icon: Gem,
    iconColor: "text-pink-500",
    bgColor: "bg-pink-50",
    title: "FOR COLLECTORS",
    subtitle: "Designed specifically for dedicated card, model, and art toy enthusiasts."
  },
  {
    icon: Landmark,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    title: "FAIR PRICING",
    subtitle: "No price gouging. Fair auctions based on true buyer satisfaction."
  },
  {
    icon: PackageOpen,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-50",
    title: "1,000+ SELECTIONS",
    subtitle: "Explore over 1,000+ rare trading cards, models, and exclusive collectibles."
  },
  {
    icon: BadgeCheck,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    title: "WORRY-FREE TRADING",
    subtitle: "Safe, seamless, and secure transaction process every time."
  }
];

export default function FeaturesHighlight() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-16 mt-2 mb-10 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-neutral-300">
        {features.map((feature, idx) => (
          <div 
            key={idx} 
            className="flex flex-col items-center text-center px-4 sm:px-6 lg:px-8 py-6 md:py-0 justify-center"
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${feature.bgColor} ${feature.iconColor}`}>
              <feature.icon size={36} strokeWidth={1.5} />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base tracking-widest uppercase mb-3 text-neutral-800">
              {feature.title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-[240px] mx-auto leading-relaxed">
              {feature.subtitle}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
