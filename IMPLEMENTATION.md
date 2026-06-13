# Second Life Commerce — Implementation Guide
### HackOn with Amazon Season 6.0 | 48hr Hackathon

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [AWS Free Tier Usage Map](#4-aws-free-tier-usage-map)
5. [Module 1 — Storefront (Amazon-like UI)](#5-module-1--storefront-amazon-like-ui)
6. [Module 2 — Admin Dashboard](#6-module-2--admin-dashboard)
7. [Module 3 — Smart Return Flow](#7-module-3--smart-return-flow)
8. [Module 4 — Green Coins & Incentives](#8-module-4--green-coins--incentives)
9. [AI/ML Layer (AWS Rekognition + Claude)](#9-aiml-layer-aws-rekognition--claude)
10. [DynamoDB Schema](#10-dynamodb-schema)
11. [API Design (REST)](#11-api-design-rest)
12. [File & Folder Structure](#12-file--folder-structure)
13. [Environment Setup](#13-environment-setup)
14. [Phase-by-Phase Build Plan (48 hrs)](#14-phase-by-phase-build-plan-48-hrs)
15. [Demo Script](#15-demo-script)

---

## 1. Project Overview

**"Second Life Commerce"** is an AI-powered circular commerce layer built on top of Amazon's ecosystem. A returned or unused product is never wasted — it is graded, routed, and resold/donated/recycled automatically.

### The 4 surfaces you are building:

| Surface | Who uses it | Core job |
|---|---|---|
| **Storefront** | Shoppers | Browse Amazon Renewed + P2P listings, earn green coins |
| **Admin Dashboard** | Warehouse/facility head | See all return queues, AI decisions, override them |
| **Smart Return Flow** | Customer returning an order | Get AI scorecard, choose to list P2P or complete return |
| **Amazon-lite product page** | Shopper about to buy | See P2P / refurbished alternatives, earn green coins |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React / Next.js)               │
│  ┌───────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Storefront│  │Admin Dashboard│ │Return Flow│  │Product Pg│  │
│  └─────┬─────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘  │
└────────┼───────────────┼───────────────┼──────────────┼────────┘
         │               │               │              │
         └───────────────▼───────────────▼──────────────┘
                         │    API Gateway (AWS)
                         │
              ┌──────────▼──────────┐
              │   Lambda Functions   │
              │  (Node.js / Python)  │
              └──────────┬──────────┘
                         │
         ┌───────────────┼──────────────────────────┐
         │               │                          │
    ┌────▼────┐   ┌──────▼──────┐          ┌────────▼────────┐
    │DynamoDB │   │  S3 Bucket  │          │  AWS Rekognition │
    │(all data)│  │(product imgs│          │  (image grading) │
    └─────────┘  └─────────────┘          └─────────────────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │  Claude API        │
                                          │  (routing decision │
                                          │   + scorecard)     │
                                          └───────────────────┘
```

### Data flow for a return:
```
Customer uploads photo → S3 → Rekognition (labels + confidence) 
→ Claude API (scorecard + routing) → DynamoDB (save result) 
→ Admin sees in dashboard → Customer sees offer → List on P2P or complete return
```

---

## 3. Tech Stack

### Frontend
- **Next.js 14** (App Router) — SSR + static pages
- **Tailwind CSS** — styling (Amazon orange theme)
- **shadcn/ui** — component library
- **React Query** — data fetching + cache

### Backend
- **AWS Lambda** (Node.js 20.x) — serverless functions
- **AWS API Gateway** — REST endpoints
- **AWS S3** — image storage
- **AWS DynamoDB** — primary database (single-table design)
- **AWS Rekognition** — image analysis / condition grading
- **Claude API (claude-sonnet-4-6)** — AI scorecard, routing decisions, product descriptions

### Auth (keep it simple for hackathon)
- **AWS Cognito** (free tier: 50k MAU free) OR mock auth with JWT

### Deployment
- **Vercel** — Next.js frontend (free)
- **AWS** — all backend services

---

## 4. AWS Free Tier Usage Map

> Keep everything within these limits for the prototype:

| Service | Free Tier Limit | Your Usage |
|---|---|---|
| DynamoDB | 25 GB storage, 25 WCU/RCU | ~100 items for demo → well within |
| S3 | 5 GB, 20k GET, 2k PUT | < 50 images for demo → fine |
| Lambda | 1M requests/month, 400k GB-sec | Demo only → safe |
| API Gateway | 1M calls/month | Demo only → safe |
| Rekognition | **5,000 image analyses/month FREE** | Only call on return flow → safe |
| Cognito | 50,000 MAU | Demo users → safe |

**Cost risk:** Rekognition is your only risk — call it **once per return** only, not on every page load. Cache results in DynamoDB immediately.

---

## 5. Module 1 — Storefront (Amazon-like UI)

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  [🌿 Second Life]  [Search...]  [Green Coins: 240🪙]      │
│  [All]  [Amazon Renewed]  [P2P Marketplace]  [Sell/List] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ★ AMAZON RENEWED                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ iPhone │ │Samsung │ │ Laptop │ │  TV    │            │
│  │  ₹XX  │ │  ₹XX  │ │  ₹XX  │ │  ₹XX  │            │
│  │ Grade A│ │ Grade B│ │ Grade A│ │ Grade A│            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
│                                                          │
│  ★ P2P MARKETPLACE (Listed by real users)               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ Shoes  │ │ Book   │ │ Watch  │ │ Blender│            │
│  │  ₹XX  │ │  ₹XX  │ │  ₹XX  │ │  ₹XX  │            │
│  │ Seller:│ │AI Score│ │ Seller:│ │ Seller:│            │
│  │ Priya  │ │  87/100│ │ Rahul  │ │ Ananya │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
└──────────────────────────────────────────────────────────┘
```

### Key components

**`/app/storefront/page.tsx`**
- Two tabs: "Amazon Renewed" | "P2P Marketplace"
- Each product card shows: image, title, price, AI condition grade, green coin reward, seller
- Filter bar: category, condition (A/B/C), price range
- Search bar calls `/api/products?q=&type=renewed|p2p`

**`/components/ProductCard.tsx`**
- Props: `{ product, showGreenCoins, showSellerInfo }`
- Badges: `[Certified Renewed]` in orange, `[P2P]` in blue
- "Earn 🪙 25 Green Coins" label on each purchase

**`/components/GreenCoinsWidget.tsx`**
- Top-right widget showing user's coin balance
- Tooltip showing total CO₂ saved equivalent

### API calls (from storefront)
```
GET /api/products?type=renewed&category=electronics
GET /api/products?type=p2p&sellerId=xxx
GET /api/user/green-coins
```

---

## 6. Module 2 — Admin Dashboard

This is for the **warehouse/facility head** — they see all incoming returns, AI decisions, and can override.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  SECOND LIFE — ADMIN DASHBOARD           [Facility: BLR-03]      │
├──────────────┬───────────────────────────────────────────────────┤
│  SIDEBAR     │  MAIN PANEL                                        │
│              │                                                    │
│  📦 Returns  │  ┌──────────┬──────────┬──────────┬────────────┐  │
│  🔄 Routing  │  │ Pending  │ Resell   │ Refurb   │ Recycle    │  │
│  📊 Stats    │  │   12     │   34     │   18     │    7       │  │
│  ⚙️ Settings │  └──────────┴──────────┴──────────┴────────────┘  │
│              │                                                    │
│              │  RETURN QUEUE (pending review)                     │
│              │  ┌───────────────────────────────────────────────┐ │
│              │  │ Order #A123 | iPhone 13 | AI: Grade B → Resell│ │
│              │  │ [Photo] [AI Report] [Override▼] [Approve ✓]  │ │
│              │  ├───────────────────────────────────────────────┤ │
│              │  │ Order #A124 | Nike Shoes | AI: Grade C→Donate │ │
│              │  │ [Photo] [AI Report] [Override▼] [Approve ✓]  │ │
│              │  └───────────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────────┘
```

### Key features

**Return Queue Table**
- Columns: Order ID, Product, Category, AI Grade, AI Routing Decision, Status, Actions
- Status filter: Pending | Approved | Overridden
- Date range filter

**AI Report Modal** (click on any return)
```
AI INSPECTION REPORT — Order #A123
──────────────────────────────────────
Product: iPhone 13 (64GB, Black)
Returned by: Riya S. | Return reason: "Doesn't fit my needs"

REKOGNITION RESULTS:
  • Detected labels: Smartphone, Electronics, Screen (97% confidence)
  • Damage detected: Minor scratch on back panel (62% confidence)
  • Screen: No cracks detected

CLAUDE SCORECARD:
  Overall condition: 74/100
  Cosmetic score: 6/10 (minor scratch)
  Functional score: 9/10 (no functional issues reported)
  Market demand: HIGH (iPhone 13 still popular)
  Estimated resale value: ₹28,000 – ₹32,000

AI ROUTING DECISION: → Resell (Amazon Renewed, Grade B)
AI REASONING: "Minor cosmetic defect does not impact functionality.
High demand product. Recommend Grade B listing at ₹29,999."

──────────────────────────────────────
ADMIN OVERRIDE:
  [Resell - Renewed ▼]  [Save Override]
  Options: Resell-Renewed | Refurbish | Donate | Recycle | P2P
```

**Stats Panel**
- Bar chart: returns by routing category this week
- Number: Total CO₂ saved (kg) from avoided landfill
- Revenue recovered this month

### API calls (from admin)
```
GET  /api/admin/returns?status=pending&facility=BLR-03
GET  /api/admin/returns/:returnId/ai-report
PUT  /api/admin/returns/:returnId/override  { routing: "refurbish" }
POST /api/admin/returns/:returnId/approve
GET  /api/admin/stats?period=7d
```

---

## 7. Module 3 — Smart Return Flow

This is the most innovative part. When a customer initiates a return, **before** it goes to the warehouse, we intercept and offer them a smarter path.

### Flow Diagram

```
Customer clicks "Return Item" on Order page
          │
          ▼
  ┌───────────────────┐
  │ Is return window  │──NO──→ Show "List on P2P" option only
  │ still open?       │         (product is now theirs to sell)
  └────────┬──────────┘
           │ YES
           ▼
  ┌────────────────────────────┐
  │ Step 1: Upload photo(s)    │
  │ of the product             │
  └────────────┬───────────────┘
               │
               ▼
  ┌────────────────────────────┐
  │ Step 2: AI runs in BG      │
  │ Rekognition → Claude       │
  │ Generate scorecard         │
  └────────────┬───────────────┘
               │
               ▼
  ┌────────────────────────────────────────────────────┐
  │  YOUR PRODUCT SCORECARD                            │
  │  ─────────────────────────────────────────────     │
  │  Condition Score: 82/100  ████████░░              │
  │  Estimated P2P Price: ₹1,850                      │
  │  ─────────────────────────────────────────────     │
  │  What would you like to do?                        │
  │                                                    │
  │  ┌──────────────────────┐  ┌──────────────────┐   │
  │  │ 📦 COMPLETE RETURN   │  │ 🛒 LIST ON P2P   │   │
  │  │ Get ₹2,000 refund    │  │ Earn ₹1,850 +    │   │
  │  │ (standard process)   │  │ 🪙 50 Green Coins│   │
  │  └──────────────────────┘  └──────────────────┘   │
  │                                                    │
  │  💡 If you list on P2P and it sells within 7 days, │
  │     you keep the sale amount + get full refund     │
  │     protection if it doesn't sell.                 │
  └────────────────────────────────────────────────────┘
```

### If customer chooses P2P listing:
1. Product is listed immediately on P2P marketplace under customer's Amazon account
2. AI-generated title, description, and suggested price are pre-filled (editable)
3. If the product sells within N days → seller gets the money, return is cancelled
4. If it doesn't sell → normal return process kicks in (pickup + refund)
5. Either way: customer earns green coins

### If return window is OVER (customer wants to sell old Amazon purchase):
- Show "List on P2P" option on Order Details page
- Same AI scorecard flow
- Customer lists manually, Amazon facilitates the transaction

### Key UX copy principles:
- Never say "we're analyzing your damage" — say "We're preparing your Second Life Report"
- Always show the green coins incentive prominently
- Make P2P feel like a bonus, not a barrier to returning

### API calls (return flow)
```
POST /api/returns/initiate        { orderId, reason }
POST /api/returns/:id/upload-photo  { imageBase64 }
GET  /api/returns/:id/scorecard   → { score, price, routing, coins }
POST /api/returns/:id/list-p2p    { acceptPrice, description }
POST /api/returns/:id/complete    (standard return)
```

---

## 8. Module 4 — Green Coins & Incentives

### Green Coins rules

| Action | Coins Earned |
|---|---|
| Complete a return (item goes to Renewed/Refurb, not landfill) | 🪙 20 |
| List item on P2P instead of returning | 🪙 50 |
| Item successfully sold on P2P | 🪙 30 bonus |
| Buy a Renewed/refurbished product instead of new | 🪙 25 |
| Donate item (choose donate at return) | 🪙 40 |

### Green Coins usage
- ₹1 off per 10 coins (redeemable on Amazon checkout)
- OR: Convert to tree-planting credits (partner org)

### Product Page Widget (Amazon-lite page)
This is the "Amazon product page" replica showing eco-nudges while browsing:

```
┌──────────────────────────────────────────────────────────┐
│  [Product Image]  Sony WH-1000XM5 Headphones             │
│                   ₹29,999  ★★★★☆ (2,847 ratings)        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🌿 SECOND LIFE ALTERNATIVES                     │   │
│  │  Save money + earn Green Coins                   │   │
│  │                                                  │   │
│  │  ♻️  Amazon Renewed — Grade A  ₹21,999           │   │
│  │     AI Verified | 90-day warranty | 🪙 +25 coins │   │
│  │     [View Renewed Option]                        │   │
│  │                                                  │   │
│  │  👤  P2P by Rohan M.  ₹19,500                   │   │
│  │     AI Score: 88/100 | Sold 3 items before       │   │
│  │     [View P2P Listing]                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Add to Cart]   [Buy Now]                               │
└──────────────────────────────────────────────────────────┘
```

---

## 9. AI/ML Layer (AWS Rekognition + Claude)

### Step 1: Image upload to S3

```javascript
// Lambda: upload-image.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

async function uploadImage(base64Image, returnId) {
  const s3 = new S3Client({ region: "ap-south-1" });
  const buffer = Buffer.from(base64Image, "base64");
  const key = `returns/${returnId}/photo.jpg`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "image/jpeg"
  }));
  
  return key;
}
```

### Step 2: Rekognition analysis

```javascript
// Lambda: analyze-image.js
const { RekognitionClient, DetectLabelsCommand, 
        DetectModerationLabelsCommand } = require("@aws-sdk/client-rekognition");

async function analyzeProductImage(s3Key) {
  const client = new RekognitionClient({ region: "ap-south-1" });
  
  // Detect labels (what's in the image + condition hints)
  const labelsResult = await client.send(new DetectLabelsCommand({
    Image: { S3Object: { Bucket: process.env.S3_BUCKET, Name: s3Key } },
    MaxLabels: 20,
    MinConfidence: 60
  }));
  
  // Build a condition summary for Claude
  const labels = labelsResult.Labels.map(l => ({
    name: l.Name,
    confidence: l.Confidence
  }));
  
  // Check for damage-related labels
  const damageIndicators = ["Scratch", "Crack", "Dent", "Damage", "Broken", "Torn"];
  const damageFound = labels.filter(l => 
    damageIndicators.some(d => l.name.includes(d))
  );
  
  return { labels, damageFound };
}
```

### Step 3: Claude scorecard generation

```javascript
// Lambda: generate-scorecard.js
async function generateScorecard(productInfo, rekognitionResult) {
  const prompt = `
You are an AI product condition assessor for Amazon's Second Life Commerce platform.

PRODUCT INFO:
- Name: ${productInfo.name}
- Category: ${productInfo.category}
- Original price: ${productInfo.originalPrice}
- Return reason given by customer: "${productInfo.returnReason}"
- Days since purchase: ${productInfo.daysSincePurchase}

VISUAL INSPECTION (AWS Rekognition):
- Detected labels: ${rekognitionResult.labels.map(l => `${l.name} (${l.confidence.toFixed(0)}%)`).join(', ')}
- Damage indicators found: ${rekognitionResult.damageFound.length > 0 ? rekognitionResult.damageFound.map(d => d.name).join(', ') : 'None detected'}

Please respond with ONLY a JSON object (no markdown, no explanation):
{
  "conditionScore": <number 0-100>,
  "cosmeticScore": <number 0-10>,
  "functionalScore": <number 0-10>,
  "grade": <"A" | "B" | "C" | "D">,
  "routingDecision": <"resell_renewed" | "refurbish" | "p2p_eligible" | "donate" | "recycle">,
  "estimatedResalePrice": <number in INR>,
  "greenCoinsAwarded": <number>,
  "shortReason": <string max 20 words explaining routing decision>,
  "p2pDescription": <string: ready-to-use product listing description, 2-3 sentences>
}

Grading guide: A=90+, B=70-89, C=50-69, D=<50
Routing guide: 
  - resell_renewed: Grade A or B, functional, minimal cosmetic damage
  - refurbish: Grade B or C, minor functional issues or moderate cosmetic
  - p2p_eligible: Grade B or C, suitable for peer-to-peer sale
  - donate: Grade C or D, usable but not sellable at meaningful price
  - recycle: Grade D, non-functional or safety risk
`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  
  const data = await response.json();
  const text = data.content[0].text;
  
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (e) {
    // Fallback scorecard
    return {
      conditionScore: 65,
      grade: "B",
      routingDecision: "p2p_eligible",
      estimatedResalePrice: Math.round(productInfo.originalPrice * 0.5),
      greenCoinsAwarded: 30,
      shortReason: "Condition assessed as moderate. Suitable for P2P.",
      p2pDescription: `${productInfo.name} in good used condition. Tested and working.`
    };
  }
}
```

### Step 4: Save to DynamoDB

```javascript
// Always cache the AI result — never call Rekognition twice for same return
async function saveScorecard(returnId, scorecard) {
  const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
  const client = new DynamoDBClient({ region: "ap-south-1" });
  
  await client.send(new PutItemCommand({
    TableName: "SecondLifeReturns",
    Item: {
      PK: { S: `RETURN#${returnId}` },
      SK: { S: "SCORECARD" },
      conditionScore: { N: String(scorecard.conditionScore) },
      grade: { S: scorecard.grade },
      routingDecision: { S: scorecard.routingDecision },
      estimatedResalePrice: { N: String(scorecard.estimatedResalePrice) },
      greenCoinsAwarded: { N: String(scorecard.greenCoinsAwarded) },
      shortReason: { S: scorecard.shortReason },
      p2pDescription: { S: scorecard.p2pDescription },
      aiGeneratedAt: { S: new Date().toISOString() },
      adminOverride: { BOOL: false }
    }
  }));
}
```

---

## 10. DynamoDB Schema

Single-table design. Primary key: `PK` (partition) + `SK` (sort).

### Access patterns → key design

| Entity | PK | SK | Attributes |
|---|---|---|---|
| User | `USER#userId` | `PROFILE` | name, email, greenCoins, totalCO2Saved |
| Order | `ORDER#orderId` | `DETAILS` | userId, productId, purchaseDate, status |
| Return | `RETURN#returnId` | `DETAILS` | orderId, userId, reason, status, facilityId |
| Return Scorecard | `RETURN#returnId` | `SCORECARD` | grade, score, routing, price, adminOverride |
| Product (Renewed) | `PRODUCT#productId` | `RENEWED` | name, category, grade, price, imageUrl |
| Product (P2P) | `PRODUCT#productId` | `P2P` | name, sellerId, aiScore, price, status |
| Green Coin Tx | `USER#userId` | `COIN#timestamp` | amount, reason, returnId |
| Facility Stats | `FACILITY#facilityId` | `STATS#date` | pending, resell, refurb, donate, recycle |

### GSI (Global Secondary Index)
- **GSI1**: `SK` as partition, `PK` as sort → query all returns, all products
- **GSI2**: `facilityId` as partition, `status` as sort → admin queue by facility

### Example query: Admin gets all pending returns for facility BLR-03
```javascript
// GSI2 query
{
  TableName: "SecondLifeCommerceDB",
  IndexName: "FacilityStatusIndex",
  KeyConditionExpression: "facilityId = :fid AND #status = :status",
  ExpressionAttributeValues: {
    ":fid": { S: "BLR-03" },
    ":status": { S: "PENDING" }
  }
}
```

---

## 11. API Design (REST)

All endpoints behind API Gateway → Lambda.

### Public / Customer APIs

```
# Auth
POST   /api/auth/login
POST   /api/auth/register

# Products
GET    /api/products?type=renewed|p2p&category=X&page=N
GET    /api/products/:productId
GET    /api/products/:productId/alternatives    ← for product page widget

# Returns
POST   /api/returns/initiate                    body: { orderId, reason }
POST   /api/returns/:returnId/upload-photo      body: { imageBase64 }
GET    /api/returns/:returnId/scorecard
POST   /api/returns/:returnId/list-p2p          body: { price?, description? }
POST   /api/returns/:returnId/complete

# Green Coins
GET    /api/user/green-coins
GET    /api/user/green-coins/history
POST   /api/user/green-coins/redeem             body: { amount }

# Orders (mock data for hackathon)
GET    /api/orders                              ← list user's orders
GET    /api/orders/:orderId
```

### Admin APIs

```
GET    /api/admin/returns?status=pending&facility=X&page=N
GET    /api/admin/returns/:returnId/ai-report
PUT    /api/admin/returns/:returnId/override    body: { routing }
POST   /api/admin/returns/:returnId/approve
GET    /api/admin/stats?period=7d|30d
GET    /api/admin/facilities
```

---

## 12. File & Folder Structure

```
second-life-commerce/
├── frontend/                        # Next.js app
│   ├── app/
│   │   ├── layout.tsx               # Root layout (navbar, green coins widget)
│   │   ├── page.tsx                 # Landing / product page replica
│   │   ├── storefront/
│   │   │   └── page.tsx             # Renewed + P2P tabs
│   │   ├── storefront/[productId]/
│   │   │   └── page.tsx             # Product detail page
│   │   ├── returns/
│   │   │   └── page.tsx             # Smart return flow
│   │   ├── returns/[returnId]/
│   │   │   └── scorecard/page.tsx   # AI scorecard result page
│   │   └── admin/
│   │       ├── layout.tsx           # Admin layout (sidebar)
│   │       ├── page.tsx             # Admin dashboard home
│   │       ├── returns/page.tsx     # Return queue
│   │       └── stats/page.tsx       # Analytics
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ProductCard.tsx
│   │   ├── GreenCoinsWidget.tsx
│   │   ├── ScorecardDisplay.tsx
│   │   ├── AIReportModal.tsx
│   │   ├── ReturnQueueTable.tsx
│   │   ├── RoutingBadge.tsx         # Color-coded: Renew/Refurb/Donate/Recycle
│   │   └── AlternativesWidget.tsx   # Product page eco-widget
│   ├── lib/
│   │   ├── api.ts                   # API client functions
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── public/
│       └── mock-products/           # Demo product images
│
├── backend/
│   ├── lambdas/
│   │   ├── products/
│   │   │   ├── list.js
│   │   │   └── getAlternatives.js
│   │   ├── returns/
│   │   │   ├── initiate.js
│   │   │   ├── uploadPhoto.js       # S3 + Rekognition + Claude
│   │   │   ├── getScorecard.js
│   │   │   ├── listP2P.js
│   │   │   └── complete.js
│   │   ├── admin/
│   │   │   ├── getReturns.js
│   │   │   ├── getAIReport.js
│   │   │   ├── overrideRouting.js
│   │   │   └── getStats.js
│   │   └── greenCoins/
│   │       ├── getBalance.js
│   │       └── addTransaction.js
│   ├── shared/
│   │   ├── dynamo.js                # DynamoDB helpers
│   │   ├── s3.js                    # S3 helpers
│   │   ├── rekognition.js           # Rekognition wrapper
│   │   └── claude.js                # Claude API wrapper
│   └── infrastructure/
│       ├── template.yaml            # AWS SAM / CloudFormation
│       └── seed-data.js             # Mock data for demo
│
├── .env.example
├── README.md
└── IMPLEMENTATION.md                # This file
```

---

## 13. Environment Setup

### `.env.example`
```bash
# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=second-life-commerce-dev

# DynamoDB
DYNAMO_TABLE=SecondLifeCommerceDB

# Claude API
ANTHROPIC_API_KEY=your_claude_key

# App
NEXT_PUBLIC_API_BASE=https://your-api-gateway-url.execute-api.ap-south-1.amazonaws.com/dev
NEXT_PUBLIC_APP_NAME=Second Life Commerce
```

### Local dev setup (step by step)

```bash
# 1. Clone and install
git clone https://github.com/your-team/second-life-commerce
cd second-life-commerce/frontend
npm install

# 2. Backend dependencies
cd ../backend
npm install

# 3. Install AWS SAM CLI (for local Lambda testing)
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# 4. Start local backend (optional, or just use deployed API Gateway)
sam local start-api

# 5. Start frontend
cd ../frontend
npm run dev
# → http://localhost:3000

# 6. Seed mock data
node backend/infrastructure/seed-data.js
```

### AWS Setup checklist
- [ ] Create DynamoDB table `SecondLifeCommerceDB` with PK=`PK` (String), SK=`SK` (String)
- [ ] Create GSI1: hash=`SK`, range=`PK`
- [ ] Create GSI2: hash=`facilityId`, range=`status`
- [ ] Create S3 bucket `second-life-commerce-dev` (private, no public access)
- [ ] Create IAM role for Lambda with: DynamoDB full, S3 full, Rekognition read
- [ ] Deploy API Gateway + Lambdas via SAM: `sam deploy --guided`

---

## 14. Phase-by-Phase Build Plan (48 hrs)

### Hour 0–2: Setup & scaffold
- [ ] Next.js project init + Tailwind + shadcn/ui
- [ ] AWS DynamoDB table created
- [ ] S3 bucket created
- [ ] Seed mock product data (10 renewed, 10 P2P listings)
- [ ] Mock auth (hardcode 2 users: customer + admin)

### Hour 2–8: Core storefront
- [ ] Navbar with Green Coins widget
- [ ] Storefront page with tabs (Renewed | P2P)
- [ ] ProductCard component
- [ ] Product detail page with AlternativesWidget
- [ ] Wire to mock DynamoDB data

### Hour 8–16: Smart return flow (THE SHOWSTOPPER)
- [ ] Return initiation page (select order, give reason)
- [ ] Photo upload UI (drag-drop or file input)
- [ ] Lambda: upload to S3 → call Rekognition → call Claude
- [ ] ScorecardDisplay component (animated score reveal)
- [ ] Two choices: "Complete Return" vs "List on P2P"
- [ ] P2P listing creation on DynamoDB

### Hour 16–24: Admin dashboard
- [ ] Admin layout + sidebar
- [ ] Return queue table (with mock pending items)
- [ ] AIReportModal component
- [ ] Override dropdown + approve button
- [ ] Stats panel (hardcoded or live DynamoDB aggregate)

### Hour 24–32: Product page eco-widget + polish
- [ ] Amazon product page replica (one page: e.g. "iPhone 15")
- [ ] AlternativesWidget showing Renewed + P2P alternatives
- [ ] Green coins logic (award on P2P list, on Renewed purchase)
- [ ] Return flow: Green coins animation on award

### Hour 32–40: Integration + bug fixes
- [ ] Full flow E2E test (customer → return → scorecard → list P2P → admin sees it)
- [ ] Admin override flow test
- [ ] Mobile responsiveness check
- [ ] Error states (no internet, bad image, etc.)

### Hour 40–48: Demo prep
- [ ] Seed rich demo data (variety of return scenarios)
- [ ] Record demo video as backup
- [ ] Prepare 3-min pitch: problem → solution → live demo → impact numbers
- [ ] Deploy frontend to Vercel, backend to AWS

---

## 15. Demo Script

Use these exact demo flows for the presentation:

### Flow 1: Customer returns a phone (2 min)
1. Login as **Priya** (customer)
2. Go to Orders → "Sony Headphones — delivered 5 days ago"
3. Click "Return Item" → reason: "Doesn't fit my needs"
4. Upload the provided demo photo of headphones
5. Watch AI scorecard animate in: **Score: 78/100, Grade B**
6. Show the two options — choose "List on P2P"
7. Show green coins animation (+50 coins)
8. Show the listing now visible on storefront P2P tab

### Flow 2: Admin reviews and overrides (1 min)
1. Login as **Admin** (Warehouse BLR-03)
2. See Priya's headphones in pending queue
3. Click "AI Report" — show the full Rekognition + Claude output
4. Override from "P2P" to "Refurbish" (say AI missed a dent)
5. Click Approve — item moves to Refurbish queue

### Flow 3: Eco-nudge while shopping (1 min)
1. Navigate to Amazon-lite product page (iPhone 15)
2. Show the "🌿 Second Life Alternatives" widget
3. Click "View Renewed Option" — Grade A, ₹8,000 cheaper
4. Add to cart → earn 25 Green Coins
5. Show green coins balance update in navbar

---

*Built for HackOn with Amazon Season 6.0 — Theme: Second Life Commerce*
