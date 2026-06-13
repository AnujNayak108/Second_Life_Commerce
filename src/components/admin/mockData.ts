export interface ReturnItem {
  id: string;
  customer: string;
  product: string;
  category: 'Electronics' | 'Fashion' | 'Home' | 'Books' | 'Others';
  condition: 'Like New' | 'Good' | 'Fair' | 'Poor';
  aiDecision: 'Resell' | 'Refurbish' | 'Recycle' | 'Donate';
  confidence: number; // percentage (e.g. 92)
  status: 'Pending' | 'Approved' | 'Rejected' | 'Overridden';
  date: string;
  reason: string;
  originalPrice: number;
  estimatedResalePrice: number;
  conditionScore: number; // out of 100
  damageLabels: string[];
  images: string[];
  timeline: {
    stage: string;
    date: string;
    details: string;
    completed: boolean;
  }[];
}

export interface MarketplaceListing {
  id: string;
  product: string;
  category: string;
  condition: 'Like New' | 'Good' | 'Fair' | 'Poor';
  resalePrice: number;
  originalPrice: number;
  inventory: number;
  status: 'Draft' | 'Active' | 'Refurbishing';
  image: string;
}

export interface EcoCreditUser {
  id: string;
  customer: string;
  avatar: string;
  creditsEarned: number;
  creditsRedeemed: number;
  currentBalance: number;
  totalTransactions: number;
  rank: number;
  impactSaved: string; // e.g. "18.4 kg CO2"
  transactions: {
    id: string;
    date: string;
    type: 'Earned' | 'Redeemed';
    amount: number;
    activity: string;
  }[];
}

export const MOCK_RETURNS: ReturnItem[] = [
  {
    id: 'RET001',
    customer: 'John Smith',
    product: 'Sony WH-1000XM5 Headphones',
    category: 'Electronics',
    condition: 'Good',
    aiDecision: 'Resell',
    confidence: 92,
    status: 'Pending',
    date: '2026-06-10',
    reason: 'Upgraded to a different model, open box but barely used.',
    originalPrice: 29999,
    estimatedResalePrice: 22000,
    conditionScore: 88,
    damageLabels: ['Minor Scratch on Cup', 'Open Box', 'Original Accessories Included'],
    images: ['🎧'],
    timeline: [
      { stage: 'Return Initiated', date: '2026-06-10 10:30', details: 'Customer requested return online', completed: true },
      { stage: 'Received at Facility', date: '2026-06-12 14:15', details: 'Scanned at BLR-03 Warehouse', completed: true },
      { stage: 'AI Inspection Scan', date: '2026-06-12 14:18', details: 'Visual grading completed via camera feed', completed: true },
      { stage: 'Awaiting Decision', date: '2026-06-12 14:18', details: 'System generated Resell routing with 92% confidence', completed: false }
    ]
  },
  {
    id: 'RET002',
    customer: 'Sarah Wilson',
    product: 'Logitech MX Master 3S Mouse',
    category: 'Electronics',
    condition: 'Fair',
    aiDecision: 'Refurbish',
    confidence: 87,
    status: 'Approved',
    date: '2026-06-11',
    reason: 'Scroll wheel behaves intermittently.',
    originalPrice: 9499,
    estimatedResalePrice: 5800,
    conditionScore: 74,
    damageLabels: ['Scuffs on Thumb Rest', 'Dust in scroll wheel chamber', 'Missing USB Receiver'],
    images: ['🖱️'],
    timeline: [
      { stage: 'Return Initiated', date: '2026-06-11 09:12', details: 'Customer requested return online', completed: true },
      { stage: 'Received at Facility', date: '2026-06-13 08:30', details: 'Scanned at BLR-03 Warehouse', completed: true },
      { stage: 'AI Inspection Scan', date: '2026-06-13 08:35', details: 'Visual inspection & mechanical diagnosis', completed: true },
      { stage: 'Approved for Routing', date: '2026-06-13 08:40', details: 'Manager approved WAREHOUSE_REFURB routing', completed: true }
    ]
  },
  {
    id: 'RET003',
    customer: 'Amit Patel',
    product: 'Nike Air Max 270 Shoes',
    category: 'Fashion',
    condition: 'Good',
    aiDecision: 'Resell',
    confidence: 95,
    status: 'Pending',
    date: '2026-06-12',
    reason: 'Wrong size. Shoes are entirely clean.',
    originalPrice: 11995,
    estimatedResalePrice: 8900,
    conditionScore: 94,
    damageLabels: ['Crease on left toe box', 'Clean soles', 'Original box slightly torn'],
    images: ['👟'],
    timeline: [
      { stage: 'Return Initiated', date: '2026-06-12 18:22', details: 'Customer requested P2P list intercept', completed: true },
      { stage: 'Received at Facility', date: '2026-06-13 11:20', details: 'Item checked for hygiene compliance', completed: true },
      { stage: 'AI Inspection Scan', date: '2026-06-13 11:25', details: 'Visual verification checks passed', completed: true },
      { stage: 'Awaiting Decision', date: '2026-06-13 11:25', details: 'Resell recommended', completed: false }
    ]
  },
  {
    id: 'RET004',
    customer: 'Priya Sharma',
    product: 'Philips Air Fryer XL',
    category: 'Home',
    condition: 'Poor',
    aiDecision: 'Donate',
    confidence: 81,
    status: 'Approved',
    date: '2026-06-08',
    reason: 'Heating element takes longer than expected, basket has cosmetic coating peel.',
    originalPrice: 13999,
    estimatedResalePrice: 3500,
    conditionScore: 48,
    damageLabels: ['Teflon coating damage', 'External casing scratch', 'Heavy food residue'],
    images: ['🍳'],
    timeline: [
      { stage: 'Return Initiated', date: '2026-06-08 14:02', details: 'Customer requested standard return', completed: true },
      { stage: 'Received at Facility', date: '2026-06-10 09:15', details: 'BLR-03 Warehouse intake', completed: true },
      { stage: 'AI Inspection Scan', date: '2026-06-10 09:20', details: 'Visual grading completed', completed: true },
      { stage: 'Approved for Donate', date: '2026-06-10 10:00', details: 'Routed to SecondLife partner charity', completed: true }
    ]
  },
  {
    id: 'RET005',
    customer: 'Rohan Mehta',
    product: 'Apple Watch Series 8',
    category: 'Electronics',
    condition: 'Like New',
    aiDecision: 'Resell',
    confidence: 98,
    status: 'Approved',
    date: '2026-06-09',
    reason: 'Changed mind, wanted larger size.',
    originalPrice: 45999,
    estimatedResalePrice: 38000,
    conditionScore: 97,
    damageLabels: ['Pristine glass surface', 'Unused strap', 'Original packaging sealed'],
    images: ['⌚'],
    timeline: [
      { stage: 'Return Initiated', date: '2026-06-09 11:45', details: 'Online return processing', completed: true },
      { stage: 'Received at Facility', date: '2026-06-11 13:10', details: 'Intake scanned', completed: true },
      { stage: 'AI Inspection Scan', date: '2026-06-11 13:15', details: 'Passed visual scan - pristine condition', completed: true },
      { stage: 'Approved for Resell', date: '2026-06-11 13:20', details: 'Published to Amazon Renewed queue', completed: true }
    ]
  },
  {
    id: 'RET006',
    customer: 'Nikhil Verma',
    product: 'Atomic Habits (Paperback)',
    category: 'Books',
    condition: 'Good',
    aiDecision: 'Resell',
    confidence: 96,
    status: 'Pending',
    date: '2026-06-13',
    reason: 'Received double copy on birthday.',
    originalPrice: 599,
    estimatedResalePrice: 350,
    conditionScore: 92,
    damageLabels: ['Minimal crease on spine', 'No highlights or pen markings', 'Slight corner shelf wear'],
    images: ['📚'],
    timeline: [
      { stage: 'Return Initiated', date: '2026-06-13 14:05', details: 'P2P listing opted', completed: true },
      { stage: 'AI Inspection Scan', date: '2026-06-13 14:10', details: 'Automated document scan complete', completed: true },
      { stage: 'Awaiting Decision', date: '2026-06-13 14:10', details: 'Pending list verification', completed: false }
    ]
  },
  {
    id: 'RET007',
    customer: 'Neha Kapoor',
    product: 'USB C Hub Adapter 7-in-1',
    category: 'Electronics',
    condition: 'Poor',
    aiDecision: 'Recycle',
    confidence: 89,
    status: 'Approved',
    date: '2026-06-05',
    reason: 'Short circuit. Heated up during charging.',
    originalPrice: 2499,
    estimatedResalePrice: 0,
    conditionScore: 15,
    damageLabels: ['Internal electrical failure', 'Scorched port contacts', 'Cracked aluminum shell'],
    images: ['🔌'],
    timeline: [
      { stage: 'Return Initiated', date: '2026-06-05 08:12', details: 'Safety warning flag triggered by customer comments', completed: true },
      { stage: 'Received at Facility', date: '2026-06-07 10:40', details: 'Special hazardous intake processing', completed: true },
      { stage: 'AI Inspection Scan', date: '2026-06-07 10:50', details: 'Thermal/structural failure checked', completed: true },
      { stage: 'Approved for Recycle', date: '2026-06-07 11:30', details: 'Sent to certified e-waste recycling partner', completed: true }
    ]
  }
];

export const MOCK_MARKETPLACE: MarketplaceListing[] = [
  { id: 'MP001', product: 'Sony WH-1000XM5 Headphones', category: 'Electronics', condition: 'Good', resalePrice: 22000, originalPrice: 29999, inventory: 4, status: 'Active', image: '🎧' },
  { id: 'MP002', product: 'Apple Watch Series 8 GPS', category: 'Electronics', condition: 'Like New', resalePrice: 38000, originalPrice: 45999, inventory: 2, status: 'Active', image: '⌚' },
  { id: 'MP003', product: 'Logitech MX Master 3S Mouse', category: 'Electronics', condition: 'Fair', resalePrice: 5800, originalPrice: 9499, inventory: 8, status: 'Refurbishing', image: '🖱' },
  { id: 'MP004', product: 'Samsung Odyssey G5 27"', category: 'Electronics', condition: 'Good', resalePrice: 19500, originalPrice: 28000, inventory: 1, status: 'Draft', image: '🖥️' },
  { id: 'MP005', product: 'Nike Air Max 270 Running Shoes', category: 'Fashion', condition: 'Good', resalePrice: 8900, originalPrice: 11995, inventory: 3, status: 'Active', image: '👟' },
  { id: 'MP006', product: 'Philips Digital Air Fryer XL', category: 'Home', condition: 'Fair', resalePrice: 5200, originalPrice: 13999, inventory: 5, status: 'Active', image: '🍳' },
  { id: 'MP007', product: 'Atomic Habits by James Clear', category: 'Books', condition: 'Like New', resalePrice: 350, originalPrice: 599, inventory: 12, status: 'Active', image: '📚' }
];

export const MOCK_USERS: EcoCreditUser[] = [
  {
    id: 'USR001',
    customer: 'Ananya Sen',
    avatar: '👩',
    creditsEarned: 1250,
    creditsRedeemed: 800,
    currentBalance: 450,
    totalTransactions: 14,
    rank: 1,
    impactSaved: '54.2 kg CO2',
    transactions: [
      { id: 'TX001', date: '2026-06-12', type: 'Earned', amount: 120, activity: 'Returned Fossil Watch (Grade B Routing)' },
      { id: 'TX002', date: '2026-06-01', type: 'Redeemed', amount: 500, activity: 'Converted to ₹500 Amazon Gift Voucher' },
      { id: 'TX003', date: '2026-05-18', type: 'Earned', amount: 250, activity: 'Purchased Certified Renewed Air Fryer' }
    ]
  },
  {
    id: 'USR002',
    customer: 'Vikram Dutt',
    avatar: '👨',
    creditsEarned: 980,
    creditsRedeemed: 400,
    currentBalance: 580,
    totalTransactions: 9,
    rank: 2,
    impactSaved: '32.8 kg CO2',
    transactions: [
      { id: 'TX004', date: '2026-06-11', type: 'Earned', amount: 150, activity: 'P2P Listing Intercept: Sold Running Shoes' },
      { id: 'TX005', date: '2026-05-28', type: 'Redeemed', amount: 400, activity: 'Tree Planting Donation (4 Trees)' },
      { id: 'TX006', date: '2026-05-15', type: 'Earned', amount: 80, activity: 'Returned Office Chair (Donate Routing)' }
    ]
  },
  {
    id: 'USR003',
    customer: 'Priya Mishra',
    avatar: '👩',
    creditsEarned: 850,
    creditsRedeemed: 200,
    currentBalance: 650,
    totalTransactions: 6,
    rank: 3,
    impactSaved: '28.1 kg CO2',
    transactions: [
      { id: 'TX007', date: '2026-06-13', type: 'Earned', amount: 50, activity: 'P2P Listing intercept accepted for Shoes' },
      { id: 'TX008', date: '2026-06-04', type: 'Earned', amount: 20, activity: 'Standard return processed with eco-routing' }
    ]
  },
  {
    id: 'USR004',
    customer: 'Rahul Kapoor',
    avatar: '👨',
    creditsEarned: 740,
    creditsRedeemed: 500,
    currentBalance: 240,
    totalTransactions: 8,
    rank: 4,
    impactSaved: '22.6 kg CO2',
    transactions: [
      { id: 'TX009', date: '2026-06-10', type: 'Earned', amount: 120, activity: 'EcoBridge Trade-In of Baby Monitor' },
      { id: 'TX010', date: '2026-05-30', type: 'Redeemed', amount: 500, activity: 'Redeemed for Checkout Discount' }
    ]
  },
  {
    id: 'USR005',
    customer: 'Aditi Rao',
    avatar: '👩',
    creditsEarned: 620,
    creditsRedeemed: 100,
    currentBalance: 520,
    totalTransactions: 5,
    rank: 5,
    impactSaved: '19.5 kg CO2',
    transactions: [
      { id: 'TX011', date: '2026-06-02', type: 'Earned', amount: 220, activity: 'Returned Galaxy Tab (Grade A Resell)' },
      { id: 'TX012', date: '2026-05-24', type: 'Redeemed', amount: 100, activity: 'Donation to Clean Oceans Project' }
    ]
  }
];

export const MONTHLY_RETURNS = [
  { name: 'Jan', returns: 20 },
  { name: 'Feb', returns: 35 },
  { name: 'Mar', returns: 50 },
  { name: 'Apr', returns: 60 },
  { name: 'May', returns: 40 },
  { name: 'Jun', returns: 40 }
];

export const RETURN_DISTRIBUTION = [
  { name: 'Resold', value: 180, color: '#007600' },
  { name: 'Refurbished', value: 40, color: '#007185' },
  { name: 'Recycled', value: 15, color: '#FF9900' },
  { name: 'Donated', value: 10, color: '#131921' }
];

export const CATEGORY_DISTRIBUTION = [
  { name: 'Electronics', value: 35, color: '#007185' },
  { name: 'Fashion', value: 25, color: '#FF9900' },
  { name: 'Home', value: 15, color: '#007600' },
  { name: 'Books', value: 10, color: '#232F3E' },
  { name: 'Others', value: 15, color: '#888888' }
];

export const SUSTAINABILITY_HISTORY = [
  { month: 'Jan', co2: 25, waste: 12, credits: 540 },
  { month: 'Feb', co2: 44, waste: 21, credits: 950 },
  { month: 'Mar', co2: 63, waste: 30, credits: 1350 },
  { month: 'Apr', co2: 75, waste: 36, credits: 1620 },
  { month: 'May', co2: 50, waste: 24, credits: 1080 },
  { month: 'Jun', co2: 50, waste: 24, credits: 1080 }
];

export const PREVENTION_HEATMAP = [
  { reason: 'Wrong Size', count: 48, rate: 35, category: 'Fashion' },
  { reason: 'Better Alternative', count: 32, rate: 25, category: 'Electronics' },
  { reason: 'Missing Accessory', count: 18, rate: 15, category: 'Electronics' },
  { reason: 'Buyer Remorse', count: 22, rate: 10, category: 'Home' },
  { reason: 'Defective Out-of-Box', count: 12, rate: 15, category: 'Electronics' }
];
