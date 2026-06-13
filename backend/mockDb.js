// In-memory mock database for local development without DynamoDB

module.exports = {
  users: [
    { id: 'u1', name: 'Priya', email: 'priya@example.com', greenCoins: 240, totalCO2Saved: 12.5 },
    { id: 'u2', name: 'Rahul', email: 'rahul@example.com', greenCoins: 120, totalCO2Saved: 8.0 }
  ],
  products: [
    { id: 'p1', name: 'iPhone 13 (64GB)', type: 'renewed', category: 'electronics', price: 29999, grade: 'A', imageUrl: 'https://m.media-amazon.com/images/I/61l9ppRIiqL._SL1500_.jpg' },
    { id: 'p2', name: 'Samsung Galaxy S22', type: 'renewed', category: 'electronics', price: 24999, grade: 'B', imageUrl: 'https://m.media-amazon.com/images/I/41Pjd3rWxwL._SX300_SY300_QL70_FMwebp_.jpg' },
    { id: 'p3', name: 'Sony WH-1000XM5', type: 'p2p', category: 'electronics', price: 19500, aiScore: 88, seller: 'Rahul', imageUrl: 'https://m.media-amazon.com/images/I/51aXvjzcukL._SL1200_.jpg' }
  ],
  orders: [
    { id: 'o1', userId: 'u1', productId: 'p3', purchaseDate: '2023-10-01', status: 'delivered' }
  ],
  returns: [
    {
      id: 'r1',
      orderId: 'A123',
      reason: "Doesn't fit my needs",
      status: 'pending',
      facilityId: 'BLR-03',
      scorecard: {
        conditionScore: 74,
        cosmeticScore: 6,
        functionalScore: 9,
        grade: "B",
        routingDecision: "resell_renewed",
        estimatedResalePrice: 29999,
        greenCoinsAwarded: 20,
        shortReason: "Minor cosmetic defect. Suitable for Grade B resale."
      }
    }
  ]
};
