// Single source for every link, number and piece of placeholder content on the site.
// Facts come from PLAN.md (the P4P Plan of Action). Anything marked PLACEHOLDER
// is not in the plan and must be replaced by the team before launch.

export const PLACEHOLDER = "PLACEHOLDER";

export const site = {
  name: "Painted For Purpose",
  short: "P4P",
  tagline: "Paint a shirt. Fund flood relief.",
  description:
    "Painted For Purpose is a student-led NGO in Pakistan. Selected artists hand-paint white T-shirts; half of every sale goes to flood relief charities, half funds the next session.",
  // PLACEHOLDER: the production domain (used for canonical URLs, sitemap and OG images).
  url: "https://paintedforpurpose.org",
  // PLACEHOLDER: the real Instagram handle.
  instagramHandle: "paintedforpurpose",
  // PLACEHOLDER: the real Google Form link for artist applications.
  applyForm: "https://forms.gle/REPLACE_WITH_P4P_FORM",
  // PLACEHOLDER: the team's contact email.
  email: "hello@paintedforpurpose.org",
  // PLACEHOLDER: city the sessions run in (the plan says only "an open venue").
  city: "Pakistan",
};

export const instagramUrl = `https://instagram.com/${site.instagramHandle}`;
export const instagramDm = `https://ig.me/m/${site.instagramHandle}`;

// PLACEHOLDER: the plan says "two selected flood relief charities" but does not name them.
export const charities = [
  { name: "Flood relief charity one", note: "Name to be confirmed", url: "" },
  { name: "Flood relief charity two", note: "Name to be confirmed", url: "" },
];

// PLACEHOLDER: when applications open / when Session 1 runs. Not in the plan.
export const nextSession = {
  label: "Session 1",
  date: "Date to be announced",
  applicationsOpen: true,
};

// PLACEHOLDER: how buyers pay and receive shirts. The plan says only "sold through Instagram and the website".
export const orderFlow = {
  payment: "Payment method confirmed in the DM",
  delivery: "Pickup or delivery arranged in the DM",
};

// Plan §3, the nine steps of the cycle, grouped by when they happen.
export const cycle = [
  {
    group: "Before the session",
    rows: [
      { what: "Plain white T-shirts bought in bulk, in different sizes", value: "~20 tees" },
      { what: "Fabric paints, brushes and art supplies bought", value: "per artist" },
      { what: "Artists register through the Google Form on this site", value: "online" },
      { what: "Applicants selected against P4P's criteria", value: "10–20 artists" },
    ],
  },
  {
    group: "Session day",
    rows: [
      { what: "Selected artists attend an organised session", value: "open venue" },
      { what: "Each artist customises a T-shirt with the materials provided", value: "1 tee each" },
    ],
  },
  {
    group: "After the session",
    rows: [
      { what: "Finished shirts collected and prepared for sale", value: "one of a kind" },
      { what: "Shirts marketed and sold", value: "Instagram + site" },
      { what: "Revenue allocated by the financial mechanism", value: "50 / 50" },
    ],
  },
];

// Plan §11. Donations are 50% in every session. Batch grows ~10 shirts per session (plan §10).
export const projection = [
  { session: "S1", name: "Session 1", revenue: 32000, shirts: 20, reinvest: "Founder-funded launch; establishes P4P" },
  { session: "S2", name: "Session 2", revenue: 52000, shirts: 30, reinvest: "Approximately 75% reinvestment" },
  { session: "S3", name: "Session 3", revenue: 70000, shirts: 40, reinvest: "Approximately 50% reinvestment" },
  { session: "S4", name: "Session 4", revenue: 88000, shirts: 50, reinvest: "Approximately 25% reinvestment" },
];

export const donationShare = 0.5;
export const totalDonations = projection.reduce((s, p) => s + p.revenue * donationShare, 0);
// Average price implied by the plan's Session 1 projection: PKR 32,000 / ~20 shirts.
export const impliedShirtPrice = projection[0].revenue / projection[0].shirts;

export const pkr = (n: number) => "PKR " + Math.round(n).toLocaleString("en-US");
export const num = (n: number) => Math.round(n).toLocaleString("en-US");

export type Shirt = {
  id: string;
  title: string;
  artist: string;
  size: "S" | "M" | "L" | "XL";
  price: number;
  colors: [string, string, string];
  pattern: "waves" | "bloom" | "sun" | "drops" | "stripes" | "hand";
  sold?: boolean;
};

// PLACEHOLDER: every shirt below is a drawn stand-in. Replace with real shirts, photos,
// artists and prices after Session 1. Prices default to the plan's implied average (PKR 1,600).
export const shirts: Shirt[] = [
  { id: "indus", title: "Sample design A", artist: "Session 1 artist", size: "M", price: 1600, colors: ["#2F78B7", "#1F7A4A", "#F2B632"], pattern: "waves" },
  { id: "monsoon", title: "Sample design B", artist: "Session 1 artist", size: "L", price: 1600, colors: ["#E2553C", "#F2B632", "#1F7A4A"], pattern: "bloom" },
  { id: "after-rain", title: "Sample design C", artist: "Session 1 artist", size: "S", price: 1600, colors: ["#F2B632", "#E2553C", "#2F78B7"], pattern: "sun" },
  { id: "every-drop", title: "Sample design D", artist: "Session 1 artist", size: "M", price: 1600, colors: ["#2F78B7", "#E86F9A", "#133621"], pattern: "drops" },
  { id: "lines", title: "Sample design E", artist: "Session 1 artist", size: "XL", price: 1600, colors: ["#E2553C", "#1F7A4A", "#2F78B7"], pattern: "stripes" },
  { id: "hands", title: "Sample design F", artist: "Session 1 artist", size: "L", price: 1600, colors: ["#1F7A4A", "#F2B632", "#E2553C"], pattern: "hand", sold: true },
];

export const nav = [
  { href: "/about", label: "About" },
  { href: "/impact", label: "Impact" },
  { href: "/shop", label: "Shop" },
  { href: "/join", label: "Join" },
];

// PLACEHOLDER: founder names for the signature on the About page letter.
export const founders = { names: "The founders of Painted For Purpose", role: "Names to be added" };
