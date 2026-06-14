const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mockDb = require('./mockDb');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── HELPER: Tokenize for fuzzy matching ─────────────────────────────────────
function tokenize(name) {
  const noise = new Set(['the','a','an','with','and','or','for','in','of','to','from','by','on','at','is','it','its','this','that','gps','mm','inch','gb','ram','storage','display','size']);
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !noise.has(w));
}

function matchScore(cartTokens, itemName) {
  const itemTokens = new Set(tokenize(itemName));
  if (cartTokens.length === 0 || itemTokens.size === 0) return 0;
  let matches = 0;
  for (const token of cartTokens) {
    for (const itemToken of itemTokens) {
      if (itemToken.includes(token) || token.includes(itemToken)) { matches++; break; }
    }
  }
  return matches / cartTokens.length;
}

// ─── ROUTES ──────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2: Purchase → Propagates to Seller/Returner's "Past Orders"
// When a buyer purchases, the item enters the circular economy pipeline
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/purchase', (req, res) => {
  const { item_name, item_price, item_icon, buyer_pin_code, buyer_name } = req.body;
  if (!item_name) return res.status(400).json({ error: 'Missing item_name' });

  const purchaseId = uuidv4();
  const purchasedItem = {
    id: purchaseId,
    name: item_name,
    price: item_price || 4000,
    originalPrice: item_price || 4000,
    icon: item_icon || '📦',
    buyerPinCode: buyer_pin_code || '110001',
    buyerName: buyer_name || 'Amit',
    purchasedAt: new Date().toISOString(),
    status: 'delivered', // Simulate instant delivery for demo
  };

  // This item is now in the "past orders" for the buyer — and can be returned/sold
  mockDb.purchasedItems.push(purchasedItem);

  console.log(`[EcoBridge] Purchase recorded: "${item_name}" by ${buyer_name} in PIN ${buyer_pin_code}`);
  res.json({ success: true, purchase_id: purchaseId, message: 'Purchase recorded. Item available in Past Orders for return/resale.' });
});

// Get past purchased items (for Seller/Returner dashboard)
app.get('/api/past-orders', (req, res) => {
  res.json({ items: mockDb.purchasedItems });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Presigned Upload Mock (local dev — returns fake URLs for frontend testing)
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/uploads/presign', (req, res) => {
  const { item_id, files } = req.body;
  if (!item_id) return res.status(400).json({ error: 'Missing item_id' });
  if (!files || !Array.isArray(files)) return res.status(400).json({ error: 'Missing files array' });

  const uploads = files.map(f => ({
    angle: f.angle,
    uploadUrl: `http://localhost:4000/api/dev-upload/${item_id}/${f.angle}`,
    s3Key: `items/${item_id}/${f.angle}.jpg`,
    s3Url: `http://localhost:4000/api/dev-upload/${item_id}/${f.angle}`,
  }));

  res.json({ item_id, uploads, expiresInSeconds: 900 });
});

// Dev upload endpoint (stores nothing — just acknowledges)
app.put('/api/dev-upload/:itemId/:angle', (req, res) => {
  res.status(200).json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI Grader — Now saves with PIN code for location-based intercept
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/grade', (req, res) => {
  const { image, zip_code, product_name } = req.body;
  if (!image) return res.status(400).json({ error: 'Missing required field: image' });
  if (!zip_code) return res.status(400).json({ error: 'Missing required field: zip_code' });

  const imageSize = image.length;
  const hash = imageSize % 100;

  let condition, grade;
  if (hash < 35) { condition = 'Like New'; grade = 'A'; }
  else if (hash < 70) { condition = 'Good'; grade = 'B'; }
  else if (hash < 90) { condition = 'Acceptable'; grade = 'C'; }
  else { condition = 'Good'; grade = 'B'; }

  const creditMap = { 'Like New': 1200, 'Good': 800, 'Acceptable': 400, 'Poor': 100 };
  const routingMap = { 'Like New': 'LOCAL_RESALE', 'Good': 'LOCAL_RESALE', 'Acceptable': 'WAREHOUSE_REFURB', 'Poor': 'RECYCLE' };
  const carbonMap = { 'Like New': '12.5kg CO2', 'Good': '8.2kg CO2', 'Acceptable': '4.1kg CO2', 'Poor': '2.0kg CO2' };

  const allLabels = [
    ['Electronics', 'Device', 'Headphones', 'Audio Equipment', 'Gadget'],
    ['Electronics', 'Phone', 'Mobile Phone', 'Smartphone', 'Screen'],
    ['Electronics', 'Computer', 'Keyboard', 'Hardware', 'Peripheral'],
    ['Electronics', 'Camera', 'Lens', 'Photography', 'Device'],
    ['Electronics', 'Watch', 'Wristwatch', 'Accessory', 'Wearable'],
    ['Electronics', 'Speaker', 'Audio', 'Bluetooth', 'Portable'],
    ['Electronics', 'Tablet', 'Screen', 'Display', 'Touchscreen'],
    ['Electronics', 'Mouse', 'Computer Peripheral', 'Wireless', 'Device'],
  ];
  const labelSet = allLabels[hash % allLabels.length];
  const detectedLabels = labelSet.map((label, i) => {
    const conf = Math.max(60, 99 - (i * 7) - (hash % 5));
    return `${label} (${conf}%)`;
  });
  const topConfidence = 99 - (hash % 5);

  const itemId = uuidv4();
  const itemName = product_name || `${labelSet[1] || 'Device'} (AI Graded)`;

  // ★ Save to gradedItems with PIN code for intercept matching
  mockDb.gradedItems.push({
    id: itemId,
    name: itemName,
    type: 'p2p',
    category: 'electronics',
    price: condition === 'Like New' ? 3000 : condition === 'Good' ? 2500 : 1500,
    originalPrice: 4000,
    grade,
    seller: 'Rahul M.',
    sellerPinCode: zip_code, // ★ PIN code for location matching
    aiScore: condition === 'Like New' ? 95 : condition === 'Good' ? 82 : 65,
    condition,
    carbonSaved: carbonMap[condition],
    gradedAt: new Date().toISOString(),
    labels: detectedLabels,
  });

  // Also add to products for backward compat
  mockDb.products.push({
    id: itemId,
    name: itemName,
    type: 'p2p',
    category: 'electronics',
    price: condition === 'Like New' ? 3000 : condition === 'Good' ? 2500 : 1500,
    grade,
    seller: 'Rahul M.',
    aiScore: condition === 'Like New' ? 95 : condition === 'Good' ? 82 : 65,
    condition,
    pinCode: zip_code,
  });

  console.log(`[EcoBridge] Item graded: "${itemName}" | ${condition} | PIN: ${zip_code}`);

  res.json({
    health_card: { condition, detected_labels: detectedLabels, confidence: topConfidence },
    routing_decision: routingMap[condition] || 'LOCAL_RESALE',
    green_credits: creditMap[condition] || 800,
    earned_coins: creditMap[condition] || 800,
    carbon_saved_estimate: carbonMap[condition] || '8.2kg CO2',
    item_id: itemId,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 3: Location-Based Intercept — PIN code + fuzzy name match
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/intercept', (req, res) => {
  const { zip_code, cart_item_name } = req.body;
  if (!zip_code) return res.status(400).json({ error: 'Missing required field: zip_code' });
  if (!cart_item_name) return res.status(400).json({ error: 'Missing required field: cart_item_name' });

  console.log(`[EcoBridge Intercept] Checking: "${cart_item_name}" in PIN ${zip_code}`);

  // Search gradedItems for items matching BOTH:
  // 1. Fuzzy name match (keyword overlap >= 30%)
  // 2. Same PIN code (geographic proximity)
  const cartTokens = tokenize(cart_item_name);

  let bestMatch = null;
  let bestScore = 0;

  for (const item of mockDb.gradedItems) {
    // ★ PIN CODE FILTER — must be same locality
    if (item.sellerPinCode !== zip_code) continue;

    // Only match items eligible for P2P (not sent to warehouse/recycle)
    if (item.condition === 'Poor') continue;

    // Fuzzy name matching
    const score = matchScore(cartTokens, item.name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // Also check old products array for backward compat
  if (!bestMatch || bestScore < 0.3) {
    for (const item of mockDb.products) {
      if (item.type !== 'p2p') continue;
      if (item.pinCode && item.pinCode !== zip_code) continue;
      const score = matchScore(cartTokens, item.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }
  }

  const MATCH_THRESHOLD = 0.25; // Slightly lower threshold for demo friendliness

  if (bestMatch && bestScore >= MATCH_THRESHOLD) {
    const condition = bestMatch.condition || 'Good';
    const ecoPrice = bestMatch.price || Math.round((bestMatch.originalPrice || 4000) * 0.6);
    const originalPrice = bestMatch.originalPrice || 4000;
    const discountPercent = Math.round(((originalPrice - ecoPrice) / originalPrice) * 100);

    console.log(`[EcoBridge Intercept] ✓ MATCH FOUND: "${bestMatch.name}" | Score: ${bestScore.toFixed(2)} | PIN: ${bestMatch.sellerPinCode || bestMatch.pinCode}`);

    res.json({
      match_found: true,
      item: {
        item_id: bestMatch.id,
        product_name: bestMatch.name,
        condition,
        price: ecoPrice,
        seller_id: bestMatch.seller || 'EcoBridge Seller',
        seller_pin: bestMatch.sellerPinCode || bestMatch.pinCode || zip_code,
        carbon_saved_estimate: bestMatch.carbonSaved || '8.2kg CO2',
      },
      intercept_message: `Wait! A verified neighbor in PIN ${zip_code} is selling this exact item in "${condition}" condition. Buy locally to save money and reduce carbon emissions!`,
      eco_discount_percent: discountPercent,
    });
  } else {
    console.log(`[EcoBridge Intercept] ✗ No match for "${cart_item_name}" in PIN ${zip_code}`);
    res.json({
      match_found: false,
      message: `No local matches found in PIN ${zip_code}.`,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Standard API Routes (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

function generateDescription(item) {
  const condition = item.condition || 'Good';
  const grade = item.grade || 'B';
  const carbonSaved = item.carbonSaved || '8.2kg CO2';
  return [
    'About this item',
    `• ${condition} condition — AI-verified Grade ${grade}, multi-angle scan`,
    `• AI Inspection Score: ${item.aiScore || 85}/100`,
    `• Buying this pre-owned item saves ${carbonSaved} of CO₂ vs buying new`,
    `• Earn Green Coins 🪙 with this purchase`,
    '• Sold by verified Second Life Commerce network seller',
    '• 7-day return window guaranteed',
  ].join('\n');
}

// Product Detail (query-param based to avoid Express 5 routing issues)
app.get('/api/product/detail', (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id param' });
  const item = mockDb.gradedItems.find(i => i.id === id)
    || mockDb.products.find(p => p.id === id);
  if (!item) return res.status(404).json({ error: 'Product not found' });
  res.json({
    ...item,
    listingImages: item.listingImages || [],
    description: item.description || generateDescription(item),
    seller: item.seller || 'Anonymous',
    gradedAt: item.gradedAt || new Date().toISOString(),
    aiLabels: item.aiLabels || item.labels || [],
  });
});

app.get('/api/products', (req, res) => {
  const { type, category } = req.query;
  let products = mockDb.products;
  if (type) products = products.filter(p => p.type === type);
  if (category) products = products.filter(p => p.category === category);
  res.json({ products });
});

app.get('/api/products/:productId', (req, res) => {
  const product = mockDb.products.find(p => p.id === req.params.productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Returns
app.post('/api/returns/initiate', (req, res) => {
  const { orderId, reason } = req.body;
  const returnId = uuidv4();
  mockDb.returns.push({ id: returnId, orderId, reason, status: 'pending', facilityId: 'BLR-03' });
  res.json({ returnId, status: 'initiated' });
});

app.post('/api/returns/:returnId/upload-photo', (req, res) => {
  const { returnId } = req.params;
  const scorecard = { conditionScore: 78, cosmeticScore: 6, functionalScore: 9, grade: "B", routingDecision: "p2p_eligible", estimatedResalePrice: 1850, greenCoinsAwarded: 50, shortReason: "Minor cosmetic defect. High demand product. Suitable for P2P.", p2pDescription: "Item in good used condition. Tested and working." };
  const returnItem = mockDb.returns.find(r => r.id === returnId);
  if (returnItem) { returnItem.scorecard = scorecard; returnItem.aiGeneratedAt = new Date().toISOString(); }
  res.json({ success: true, message: "Photo uploaded and analyzed." });
});

app.get('/api/returns/:returnId/scorecard', (req, res) => {
  const returnItem = mockDb.returns.find(r => r.id === req.params.returnId);
  if (!returnItem || !returnItem.scorecard) return res.status(404).json({ error: 'Scorecard not found' });
  res.json(returnItem.scorecard);
});

app.post('/api/returns/:returnId/list-p2p', (req, res) => {
  const returnItem = mockDb.returns.find(r => r.id === req.params.returnId);
  if (!returnItem) return res.status(404).json({ error: 'Return not found' });
  returnItem.status = 'p2p_listed';
  mockDb.users[0].greenCoins += 50;
  mockDb.products.push({ id: uuidv4(), name: "User Listed Item", type: "p2p", category: "electronics", price: returnItem.scorecard.estimatedResalePrice, grade: returnItem.scorecard.grade, seller: mockDb.users[0].name, aiScore: returnItem.scorecard.conditionScore });
  res.json({ success: true, message: 'Listed on P2P marketplace', greenCoinsEarned: 50 });
});

// Admin
app.get('/api/admin/returns', (req, res) => {
  const { status, facility } = req.query;
  let returns = mockDb.returns;
  if (status) returns = returns.filter(r => r.status === status);
  if (facility) returns = returns.filter(r => r.facilityId === facility);
  res.json({ returns });
});

app.get('/api/admin/returns/:returnId/ai-report', (req, res) => {
  const returnItem = mockDb.returns.find(r => r.id === req.params.returnId);
  if (!returnItem) return res.status(404).json({ error: 'Return not found' });
  res.json({ product: "Mock Product Name", returnedBy: "Mock User", reason: returnItem.reason, labels: ["Electronics (97%)", "Scratch (62%)"], scorecard: returnItem.scorecard });
});

app.put('/api/admin/returns/:returnId/override', (req, res) => {
  const { routing } = req.body;
  const returnItem = mockDb.returns.find(r => r.id === req.params.returnId);
  if (!returnItem) return res.status(404).json({ error: 'Return not found' });
  returnItem.scorecard.routingDecision = routing;
  returnItem.adminOverride = true;
  res.json({ success: true, newRouting: routing });
});

app.post('/api/admin/returns/:returnId/approve', (req, res) => {
  const returnItem = mockDb.returns.find(r => r.id === req.params.returnId);
  if (!returnItem) return res.status(404).json({ error: 'Return not found' });
  returnItem.status = 'approved';
  res.json({ success: true });
});

// Admin: Get all graded items (for warehouse dashboard)
app.get('/api/admin/graded-items', (req, res) => {
  res.json({ items: mockDb.gradedItems });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Feature 1: Admin Dashboard CRUD — Items Management
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/items — fetch items filterable by section/status
app.get('/api/admin/items', (req, res) => {
  const { facilityPincode, section, listingStatus } = req.query;
  let items = [...mockDb.gradedItems, ...mockDb.products.filter(p => p.type === 'p2p')];
  if (facilityPincode) items = items.filter(i => (i.sellerPinCode || i.pinCode) === facilityPincode);
  if (section) items = items.filter(i => i.section === section);
  if (listingStatus) items = items.filter(i => i.listingStatus === listingStatus);
  res.json({ items });
});

// PUT /api/admin/items/:itemId — admin actions (list, unlist, move sections)
app.put('/api/admin/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  const { action, facilityPincode, adminNotes } = req.body;
  const item = mockDb.gradedItems.find(i => i.id === itemId) || mockDb.products.find(p => p.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const actionMap = {
    LIST_P2P: { section: 'P2P', listingStatus: 'LISTED' },
    UNLIST_P2P: { section: 'P2P', listingStatus: 'UNLISTED' },
    MOVE_TO_REFURBISHED: { section: 'REFURBISHED', listingStatus: 'UNLISTED' },
    MOVE_TO_P2P: { section: 'P2P', listingStatus: 'LISTED' },
    MOVE_TO_WAREHOUSE: { section: 'WAREHOUSE_HELD', listingStatus: 'UNLISTED' },
  };

  Object.assign(item, actionMap[action] || {}, {
    adminNotes: adminNotes || item.adminNotes,
    sectionChangedBy: 'ADMIN',
    sectionChangedAt: new Date().toISOString(),
  });

  res.json({ success: true, updatedItem: item });
});

// POST /api/admin/scan-and-list — admin scans warehouse item
app.post('/api/admin/scan-and-list', (req, res) => {
  const { imageBase64, productName, facilityPincode, facilityId, estimatedPrice, originalPrice, adminNotes } = req.body;
  const itemId = uuidv4();
  const hash = (imageBase64 || '').length % 100;
  const grade = hash < 35 ? 'A' : hash < 70 ? 'B' : 'C';
  const condition = grade === 'A' ? 'Like New' : grade === 'B' ? 'Good' : 'Acceptable';

  const newItem = {
    id: itemId, name: productName, type: 'p2p', category: 'electronics',
    price: estimatedPrice || 5000, originalPrice: originalPrice || 10000, grade, condition,
    section: 'P2P', listingStatus: 'LISTED',
    sellerPinCode: facilityPincode || '110001', facilityId: facilityId || 'BLR-03',
    source: 'ADMIN_SCAN', adminNotes,
    listingImages: [],
    seller: `Admin (${facilityId || 'BLR-03'})`,
    aiScore: grade === 'A' ? 95 : grade === 'B' ? 82 : 65,
    carbonSaved: '8.2kg CO2',
    gradedAt: new Date().toISOString(),
    description: `About this item\n• ${condition} condition — AI-verified Grade ${grade}\n• Scanned and listed by warehouse admin\n• Saves 8.2 kg CO₂\n• 7-day return window`,
    aiLabels: ['Electronics (95%)', 'Device (90%)'],
  };

  mockDb.gradedItems.push(newItem);
  mockDb.products.push(newItem);
  res.json({ itemId, grade, condition, item: newItem });
});

// GET /api/admin/warehouse — items in warehouse not yet listed
app.get('/api/admin/warehouse', (req, res) => {
  const { facilityPincode } = req.query;
  const items = mockDb.gradedItems.filter(i =>
    (!facilityPincode || (i.sellerPinCode || i.pinCode) === facilityPincode) &&
    (i.section === 'WAREHOUSE_HELD' || (!i.section && i.listingStatus !== 'LISTED'))
  );
  res.json({ items });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── START SERVER ──────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[EcoBridge] Server running on port ${PORT}`);
  console.log(`[EcoBridge] Graded items in DB: ${mockDb.gradedItems.length}`);
});

module.exports = app;
