// In-memory mock database for local development without DynamoDB
// Supports PIN-code-based location matching, admin management, and listing images

module.exports = {
  users: [
    { id: 'u1', name: 'Priya', email: 'priya@example.com', greenCoins: 240, totalCO2Saved: 12.5, pinCode: '110001' },
    { id: 'u2', name: 'Rahul', email: 'rahul@example.com', greenCoins: 120, totalCO2Saved: 8.0, pinCode: '110001' },
    { id: 'u3', name: 'Amit', email: 'amit@example.com', greenCoins: 50, totalCO2Saved: 2.0, pinCode: '110001' }
  ],

  // Standard marketplace products
  products: [
    { id: 'p1', name: 'iPhone 13 (64GB)', type: 'renewed', category: 'electronics', price: 29999, originalPrice: 49999, grade: 'A', condition: 'Like New', imageUrl: 'https://m.media-amazon.com/images/I/61l9ppRIiqL._SL1500_.jpg', listingImages: ['https://m.media-amazon.com/images/I/61l9ppRIiqL._SL1500_.jpg'], seller: 'Amazon Renewed', sellerPinCode: '110001', aiScore: 96, carbonSaved: '12.5kg CO2', description: 'About this item\n• Like New condition — AI-verified Grade A\n• No signs of use, original accessories included\n• Saves 12.5 kg CO₂ vs buying new\n• Earn 180 Green Coins 🪙\n• 7-day return window guaranteed', aiLabels: ['Smartphone (98%)', 'Electronics (97%)', 'Mobile Phone (95%)'], gradedAt: '2026-06-01T10:00:00Z' },
    { id: 'p2', name: 'Samsung Galaxy S22', type: 'renewed', category: 'electronics', price: 24999, originalPrice: 39999, grade: 'B', condition: 'Good', imageUrl: 'https://m.media-amazon.com/images/I/41Pjd3rWxwL._SX300_SY300_QL70_FMwebp_.jpg', listingImages: ['https://m.media-amazon.com/images/I/41Pjd3rWxwL._SX300_SY300_QL70_FMwebp_.jpg'], seller: 'Amazon Renewed', sellerPinCode: '110001', aiScore: 84, carbonSaved: '10.2kg CO2', description: 'About this item\n• Good condition — AI-verified Grade B\n• Minor cosmetic wear, fully functional\n• Saves 10.2 kg CO₂\n• Earn 120 Green Coins 🪙\n• 7-day return window', aiLabels: ['Smartphone (96%)', 'Electronics (95%)', 'Screen (89%)'], gradedAt: '2026-06-02T11:00:00Z' },
    { id: 'p3', name: 'Sony WH-1000XM5 Headphones', type: 'p2p', category: 'headphones', price: 19500, originalPrice: 29999, grade: 'A', condition: 'Like New', aiScore: 94, seller: 'Rahul M.', sellerPinCode: '110001', pinCode: '110001', imageUrl: 'https://m.media-amazon.com/images/I/51aXvjzcukL._SL1200_.jpg', listingImages: ['https://m.media-amazon.com/images/I/51aXvjzcukL._SL1200_.jpg', 'https://m.media-amazon.com/images/I/61vCqHuOFaL._SL1200_.jpg'], carbonSaved: '5.2kg CO2', description: 'About this item\n• Like New condition — AI-verified Grade A, multi-angle verified\n• AI Inspection Score: 94/100\n• Detected features: Headphones, Audio Equipment, Noise Cancelling\n• Saves 5.2 kg CO₂ vs buying new\n• Earn 180 Green Coins 🪙 with this purchase\n• Sold by verified Second Life Commerce seller\n• 7-day return window guaranteed', aiLabels: ['Headphones (97%)', 'Audio Equipment (94%)', 'Electronics (91%)'], gradedAt: '2026-06-10T14:18:00Z', section: 'P2P', listingStatus: 'LISTED' }
  ],

  // Graded items (populated by seller/returner scans)
  gradedItems: [],

  orders: [
    { id: 'o1', userId: 'u1', productId: 'p3', purchaseDate: '2023-10-01', status: 'delivered' }
  ],

  purchasedItems: [],

  returns: [
    {
      id: 'r1',
      orderId: 'A123',
      reason: "Doesn't fit my needs",
      status: 'pending',
      facilityId: 'BLR-03',
      scorecard: { conditionScore: 74, cosmeticScore: 6, functionalScore: 9, grade: "B", routingDecision: "resell_renewed", estimatedResalePrice: 29999, greenCoinsAwarded: 20, shortReason: "Minor cosmetic defect. Suitable for Grade B resale." }
    }
  ]
};
