const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mockDb = require('./mockDb');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── ROUTES ──────────────────────────────────────────────

// Products
app.get('/api/products', (req, res) => {
  const { type, category } = req.query;
  let products = mockDb.products;
  if (type) {
    products = products.filter(p => p.type === type);
  }
  if (category) {
    products = products.filter(p => p.category === category);
  }
  res.json({ products });
});

app.get('/api/products/:productId', (req, res) => {
  const product = mockDb.products.find(p => p.id === req.params.productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Returns / Trade-In (Smart Return Flow)
app.post('/api/returns/initiate', (req, res) => {
  const { orderId, reason } = req.body;
  const returnId = uuidv4();
  mockDb.returns.push({
    id: returnId,
    orderId,
    reason,
    status: 'pending',
    facilityId: 'BLR-03'
  });
  res.json({ returnId, status: 'initiated' });
});

// Photo Upload + AI Mock (Rekognition + Claude equivalent)
app.post('/api/returns/:returnId/upload-photo', (req, res) => {
  const { imageBase64 } = req.body;
  const { returnId } = req.params;

  // Mock AI Scorecard generation based on IMPLEMENTATION.md
  const scorecard = {
    conditionScore: 78,
    cosmeticScore: 6,
    functionalScore: 9,
    grade: "B",
    routingDecision: "p2p_eligible",
    estimatedResalePrice: 1850,
    greenCoinsAwarded: 50,
    shortReason: "Minor cosmetic defect. High demand product. Suitable for P2P.",
    p2pDescription: "Headphones in good used condition. Tested and working."
  };

  const returnItem = mockDb.returns.find(r => r.id === returnId);
  if (returnItem) {
    returnItem.scorecard = scorecard;
    returnItem.aiGeneratedAt = new Date().toISOString();
  }

  res.json({ success: true, message: "Photo uploaded and analyzed." });
});

app.get('/api/returns/:returnId/scorecard', (req, res) => {
  const returnItem = mockDb.returns.find(r => r.id === req.params.returnId);
  if (!returnItem || !returnItem.scorecard) {
    return res.status(404).json({ error: 'Scorecard not found' });
  }
  res.json(returnItem.scorecard);
});

app.post('/api/returns/:returnId/list-p2p', (req, res) => {
  const returnItem = mockDb.returns.find(r => r.id === req.params.returnId);
  if (!returnItem) return res.status(404).json({ error: 'Return not found' });

  returnItem.status = 'p2p_listed';
  
  // Add 50 Green Coins
  mockDb.users[0].greenCoins += 50;

  // Add product to P2P Marketplace
  mockDb.products.push({
    id: uuidv4(),
    name: "User Listed Item", // In real app, pulled from order info
    type: "p2p",
    category: "electronics",
    price: returnItem.scorecard.estimatedResalePrice,
    grade: returnItem.scorecard.grade,
    seller: mockDb.users[0].name,
    aiScore: returnItem.scorecard.conditionScore,
    imageUrl: "https://via.placeholder.com/150"
  });

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
  res.json({
    product: "Mock Product Name",
    returnedBy: "Mock User",
    reason: returnItem.reason,
    labels: ["Electronics (97%)", "Scratch (62%)"],
    scorecard: returnItem.scorecard
  });
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

// ─── START SERVER ──────────────────────────────────────────

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running locally on port ${PORT}`);
});

module.exports = app;
