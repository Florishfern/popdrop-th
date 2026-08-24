# System Design & UI/UX Specification Document (`design.md`)

**Project Name:** Popdrop - Luxury NFT & Rare Collectibles Platform  
**UI/UX Concept:** Light Minimalist Web3/NFT Storefront (Clean Off-White, High Contrast Red & Black Accents, 3D Rendered Mascot)

---

## UI/UX Prompt Specification

**Background / Canvas:**
Use a clean, light off-white background (`bg-[#F4F4F6]` or `bg-[#F8F9FA]`) with a 2-column hero section layout on desktop: Left side contains the text content and CTA button, while the right side displays a prominent 3D rendered mascot character (Lion in a black zip hoodie and red trousers) with subtle floating animation (`animate-float`).

**Fonts (loaded in index.html):**
1. **"Plus Jakarta Sans"** or **"Outfit"** from Google Fonts (weights 400, 500, 600, 700, 800) -- used for brand name, main heading, nav links, badges, and buttons. Register it in `tailwind.config.js` as `fontFamily.sans`.

**Icons:** Use `lucide-react` for all icons: `Wallet`, `Sparkles`, `ArrowRight`, `Menu`, `X`, `Search`, `Plus`, `User`, `Radio`.

**Navbar:**
- Horizontal bar at the top with responsive padding (`px-6 sm:px-10 lg:px-16`, `py-6 lg:py-8`).
- **Left:** Red Mascot Logo (Red Fox/Animal Icon) with brand name in bold sans-serif, `text-xl sm:text-2xl`, `text-black`.
- **Center (hidden below `md`):** Seven nav links -- `"home"`, `"collection"`, `"roadmap"`, `"rarity"`, `"mint"`, `"team"`, `"faq"` -- in `font-sans`, `text-xs sm:text-sm`, `text-neutral-500`, lowercase, tracking-normal, with `hover:text-black` smooth transition.
- **Right (hidden below `md`):**
  - A **"connect wallet"** button styled as a solid black rounded capsule button (`bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-neutral-800 transition-all active:scale-95`).
  - An **"Add Product" (เพิ่มสินค้า)** button (`bg-[#E52E2E] hover:bg-[#D02525] text-white px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95`).
  - A **"Profile"** icon button (`w-9 h-9 rounded-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center text-black transition-all active:scale-95`).
- **Right (visible below `md`):** A hamburger button made of three black `div` bars (`w-6 h-0.5`, `w-6 h-0.5`, `w-4 h-0.5` with `space-y-1.5`).

**Mobile Menu Overlay (below `md` only):**
- Fixed fullscreen overlay (`fixed inset-0 z-50`) with `bg-white/95 backdrop-blur-md`.
- Toggles visibility via React `useState` -- when open: `opacity-100 visible`, when closed: `opacity-0 invisible`, with `transition-all duration-500`.
- Header row matches the navbar: Red mascot logo on left, `X` close icon on right.
- Centered vertically: Each of the 7 nav links rendered in `font-sans`, `text-3xl sm:text-4xl`, black, lowercase, with staggered entrance animations using inline `style` -- each item gets `transitionDelay: ${i * 60 + 100}ms`, `opacity` and `translateY(20px)` transitions based on the open state.
- Below the links: A **"connect wallet"** black rounded capsule button, **"Add Product"** red button, and **"Profile"** link with the same staggered animation pattern.
- All links call `setMenuOpen(false)` on click.

**Hero Content (2-Column Grid on `lg` screens, vertically centered):**

All hero text elements use staggered `animate-fade-up` animations. Each successive element has an additional `0.15s` delay. Elements start with `opacity: 0` and use `animation-fill-mode: forwards`.

0. **Hero Category & Search Navigation Strip (Hero Sub-Bar):**
   - Interactive category pill bar containing: `"home"`, `"art toy"`, `"model"`, `"Card"`, `"live bidding room"` (with live pulsing red dot indicator), and a `"search"` input box/button.
   - Styled as a sleek horizontal scrollable filter strip (`flex items-center gap-3 overflow-x-auto py-2 mb-6 text-xs font-semibold`). Active category item has `bg-black text-white px-4 py-2 rounded-full`, inactive items have `bg-white/80 hover:bg-white text-neutral-600 px-4 py-2 rounded-full border border-neutral-200 transition-all`.
   - Includes an inline **Search input bar** (`relative flex items-center bg-white border border-neutral-200 rounded-full px-3 py-1.5 text-xs text-neutral-600 focus-within:border-black`).

1. **Tagline Badge:** A vivid red pill badge with text `"LUXURY NFT COLLECTION"` in white uppercase, `bg-[#E52E2E] text-white text-[10px] sm:text-xs font-extrabold tracking-wider px-3.5 py-1 rounded-md inline-block uppercase shadow-sm`. Uses `animate-fade-up` (no delay). Has `mb-4 sm:mb-6`.

2. **Main Heading:** Two lines in `font-sans`, bold, lowercase aesthetic, `leading-[1.05]`, `tracking-tight`, `text-black`, using `text-[clamp(2.5rem,6vw,5rem)]`:
   - `"explore unique"`
   - `"animals"`  
   Uses `animate-fade-up-delay-1` (0.15s delay).

3. **Subtext:** `"limited-edition nft animals with distinct traits"` (line break) `"collect, trade, and build your digital zoo"` in `text-neutral-500`, `text-sm sm:text-base`, `font-sans`, `leading-relaxed`, `max-w-md`, lowercase. Uses `animate-fade-up-delay-2` (0.3s delay). `mt-4 sm:mt-6`.

4. **CTA Row:** Uses `animate-fade-up-delay-3` (0.45s delay), `mt-8 sm:mt-10`.
   - Red capsule button **"explore collection"** (`bg-[#E52E2E] hover:bg-[#D02525] text-white px-8 py-3.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide lowercase transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-500/25`).

5. **Right Character Render (Desktop Column):** 
   - High-resolution 3D lion character graphic positioned on the right side (`flex justify-center items-center relative z-10`).
   - Applies smooth floating animation class (`animate-float`).

**CSS Animations (defined in index.css under `@layer utilities`):**
```css
@layer utilities {
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }

  .animate-fade-up {
    animation: fade-up 0.8s ease-out forwards;
  }
  .animate-fade-up-delay-1 {
    animation: fade-up 0.8s ease-out 0.15s forwards;
    opacity: 0;
  }
  .animate-fade-up-delay-2 {
    animation: fade-up 0.8s ease-out 0.3s forwards;
    opacity: 0;
  }
  .animate-fade-up-delay-3 {
    animation: fade-up 0.8s ease-out 0.45s forwards;
    opacity: 0;
  }
  .animate-float {
    animation: float 4s ease-in-out infinite;
  }
}