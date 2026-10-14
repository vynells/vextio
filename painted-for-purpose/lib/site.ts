// Central place for links and numbers the team will need to update.
// Everything here comes from the P4P Plan of Action unless marked TODO.

export const site = {
  name: "Painted For Purpose",
  short: "P4P",
  tagline: "Paint a shirt. Fund flood relief.",
  description:
    "A student-led NGO turning hand-painted T-shirts into recurring funding for Pakistani flood relief charities.",
  // TODO: replace with the real links once they exist.
  instagram: "https://instagram.com/paintedforpurpose",
  instagramHandle: "@paintedforpurpose",
  applyForm: "https://forms.gle/REPLACE_WITH_P4P_FORM",
  email: "hello@paintedforpurpose.org",
};

export const cycle = [
  { title: "Source", body: "Plain white tees bought in bulk across sizes — starting with a batch of ~20." },
  { title: "Supply", body: "Fabric paints, brushes and materials sized to the number of artists." },
  { title: "Apply", body: "Artists register through the P4P Google Form on this site." },
  { title: "Select", body: "The strongest applicants are chosen — 10 to 20 for the first session." },
  { title: "Paint", body: "A session at an open venue. Every artist customises one tee." },
  { title: "Prepare", body: "Finished shirts are collected, set and readied for sale." },
  { title: "Sell", body: "Each one-of-a-kind shirt is sold through Instagram and this site." },
  { title: "Split", body: "50% goes to flood relief charities, 50% funds the next session." },
];

export const projection = [
  { session: "Session 1", revenue: 32000, reinvest: "Founder-funded launch" },
  { session: "Session 2", revenue: 52000, reinvest: "~75% reinvested" },
  { session: "Session 3", revenue: 70000, reinvest: "~50% reinvested" },
  { session: "Session 4", revenue: 88000, reinvest: "~25% reinvested" },
];

export const pkr = (n: number) => "PKR " + n.toLocaleString("en-PK");

export type Shirt = {
  id: string;
  title: string;
  artist: string;
  size: string;
  price: number;
  colors: [string, string, string];
  pattern: "waves" | "bloom" | "sun" | "drops" | "stripes" | "hand";
  sold?: boolean;
};

// Placeholder pieces — swap for real photos and artists after Session 1.
export const shirts: Shirt[] = [
  { id: "indus", title: "Indus Rising", artist: "Session 1 artist", size: "M", price: 1600, colors: ["#1F6FB2", "#0B6B3A", "#F2A900"], pattern: "waves" },
  { id: "monsoon", title: "Monsoon Garden", artist: "Session 1 artist", size: "L", price: 1600, colors: ["#E8553E", "#F2A900", "#0B6B3A"], pattern: "bloom" },
  { id: "after-rain", title: "After the Rain", artist: "Session 1 artist", size: "S", price: 1500, colors: ["#F2A900", "#E8553E", "#1F6FB2"], pattern: "sun" },
  { id: "every-drop", title: "Every Drop", artist: "Session 1 artist", size: "M", price: 1500, colors: ["#1F6FB2", "#8E6CCF", "#1B1A17"], pattern: "drops" },
  { id: "truck-art", title: "Truck Art Lines", artist: "Session 1 artist", size: "XL", price: 1800, colors: ["#E8553E", "#0B6B3A", "#8E6CCF"], pattern: "stripes" },
  { id: "together", title: "Hands Together", artist: "Session 1 artist", size: "L", price: 1700, colors: ["#0B6B3A", "#F2A900", "#E8553E"], pattern: "hand", sold: true },
];
