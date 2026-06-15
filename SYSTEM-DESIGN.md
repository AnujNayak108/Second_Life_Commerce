# EcoBridge — System Design Document
### HackOn with Amazon Season 6.0 | AI-Powered Circular Commerce Platform

**Live URL:** https://main.d31pimnmgdwiv2.amplifyapp.com  
**Backend API:** https://4w990xpwkg.execute-api.ap-south-1.amazonaws.com/prod

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React + Vite)                           │
│                    Hosted on AWS Amplify (HTTPS + CDN)                       │
│                                                                             │
│  ┌────────────┐  ┌──────────────┐  ┌───────────┐  ┌─────────────────────┐  │
│  │ Storefront │  │ Seller (Scan)│  │  Returner │  │   Admin Dashboard   │  │
│  │  (Amit)    │  │   (Rahul)    │  │  (Priya)  │  │   (Warehouse Ops)   │  │
│  └─────┬──────┘  └──────┬───────┘  └─────┬─────┘  └──────────┬──────────┘  │
└────────┼─────────────────┼────────────────┼───────────────────┼─────────────┘
         │                 │                │                   │
         │   HTTPS (fetch) │                │                   │
         ▼                 ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS API Gateway (REST)                                │
│                        Region: ap-south-1 (Mumbai)                           │
│                                                                             │
│    /api/grade ──────► GraderFunction (Lambda, TypeScript)                    │
│    /api/intercept ──► InterceptFunction (Lambda, TypeScript)                 │
│    /api/uploads/* ──► PresignFunction (Lambda, TypeScript)                   │
│    /* (catch-all) ──► ExpressApiFunction (Lambda, Node.js)                   │
└────────┬─────────────────┬──────────────────────────────────────────────────┘
         │                 │
    ┌────▼────┐      ┌────▼─────────────┐
    │DynamoDB │      │ AWS Rekognition   │
    │(Single  │      │ (DetectLabels)    │
    │ Table)  │      │ 4 calls per scan  │
    └─────────┘      └──────────────────┘
```

---

## 2. Data Flow Diagrams

### 2.1 Seller Scanning Flow (Core Feature)

```
Rahul (Seller) clicks "Multi-Angle Scan"
        │
        ▼
┌─────────────────────────────────────────┐
│ Step 1: Identity Confirmation           │
│ "Is this the Sony WH-1000XM5?"         │
│ [Yes, this is correct] [No, describe]   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Step 2-5: 4-Angle Photo Capture         │
│ Front → Back → Left → Right             │
│ Each: Webcam capture + gallery upload   │
│ Per-image: size check, instant advance  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Step 6: Review Grid (2x2 thumbnails)    │
│ Retake any angle with one tap           │
│ [Analyze with AI] button                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Step 7: Multi-Image AI Analysis (4 sequential calls)    │
│                                                         │
│ For each of [front, back, left, right]:                 │
│   POST /api/grade { image: base64, zip_code, name }     │
│         │                                               │
│         ▼                                               │
│   Lambda: GraderFunction                                │
│     1. Strip base64 prefix                              │
│     2. Rekognition.DetectLabels(Bytes, Max:20, Min:60)  │
│     3. Extract labels + confidence scores               │
│     4. Person/face detection → REJECT if top labels     │
│        are human-related                                │
│     5. Grade: keyword match against DAMAGE_KEYWORDS     │
│        and POSITIVE_KEYWORDS                            │
│     6. Write to DynamoDB: PK=ITEM#uuid, SK=GRADE        │
│     7. Return: condition, labels, confidence, credits   │
│                                                         │
│ Frontend receives 4 responses, then:                    │
│   • Cross-image label fusion (union of all labels)      │
│   • Majority vote condition (3/4 agreement)             │
│   • Identity verification (label consistency)           │
│   • Confidence boost from multi-angle agreement         │
│   • Cosmetic score from damage label detection          │
│                                                         │
│ Result: Multi-Axis Health Score (0-100)                 │
│   = 0.30 × Identity + 0.20 × Completeness              │
│     + 0.50 × Cosmetic Condition                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Step 8: Health Card (Layer 1 Result)    │
│ • Overall score (circular gauge)        │
│ • 3-axis breakdown (progress bars)      │
│ • Per-angle thumbnails + labels         │
│ • Coins earned banner (+800 🪙)         │
│ • Routing suggestion (P2P/Warehouse)    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Step 9: Seller Verification (Layer 2)   │
│ • Internal damage checklist (8 options) │
│ • Free-text notes field                 │
│ • Live condition downgrade preview      │
│ • [Confirm & Route Item]                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Step 10: Item Routed                    │
│ • P2P Marketplace (Like New / Good)     │
│ • Local Warehouse (Acceptable)          │
│ • Recycling Center (Poor)               │
│ • Two-Layer Verified badge              │
│ • Green Coins credited                  │
└─────────────────────────────────────────┘
```

### 2.2 Buyer Intercept Flow

```
Amit (Buyer) adds item to cart → clicks "Proceed to Buy"
        │
        ▼
┌─────────────────────────────────────────────┐
│ POST /api/intercept                         │
│ { zip_code: "110001", cart_item_name: "..." }│
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ InterceptFunction (Lambda)                  │
│ 1. Query DynamoDB GSI1 (SK=GRADE)           │
│ 2. Filter by zip_code match (same PIN)      │
│ 3. Tokenize cart_item_name                  │
│ 4. Fuzzy match against each graded item     │
│ 5. Score = keyword overlap / total tokens   │
│ 6. If score >= 0.25 AND same PIN:           │
│    → Return match with eco price            │
│ 7. Else: { match_found: false }             │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   match_found=true   match_found=false
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ Show Modal:  │   │ Normal       │
│ "A neighbor  │   │ checkout     │
│  is selling  │   │ (no popup)   │
│  this item!" │   └──────────────┘
│              │
│ [Buy Local]  │
│ [No thanks]  │
└──────────────┘
```

### 2.3 Admin Approval Flow

```
Admin Dashboard loads
        │
        ▼
┌─────────────────────────────────────────┐
│ Returns Queue (live items from scans)   │
│ Items appear as "Pending" status        │
│                                         │
│ Admin clicks [Approve ✓]               │
│   → Status changes to "Approved"        │
│   → Item synced to P2P marketplace      │
│   → PUT /api/admin/items/:id            │
│     { action: "LIST_P2P" }              │
│                                         │
│ Admin clicks [Reject]                   │
│   → Status changes to "Rejected"        │
│   → Item removed from P2P pool          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Approved items appear in:               │
│ 1. Marketplace page (Admin view)        │
│ 2. P2P section (Buyer storefront)       │
│ 3. DynamoDB (for intercept matching)    │
└─────────────────────────────────────────┘
```

---

## 3. DynamoDB Schema (Single-Table Design)

**Table:** `SecondLifeCommerceDB`  
**Billing:** PAY_PER_REQUEST (on-demand, free tier)

| PK | SK | Purpose | Key Attributes |
|----|-----|---------|----------------|
| `ITEM#<uuid>` | `GRADE` | Graded item | condition, topLabel, allLabels, greenCredits, routing, carbonSaved, zipCode, sellerPinCode, productName, createdAt, status |

### Global Secondary Indexes

| Index | Hash Key | Sort Key | Use Case |
|-------|----------|----------|----------|
| GSI1 | SK | PK | Query all graded items (intercept matching) |
| FacilityStatusIndex | facilityId | status | Admin queue by facility |

---

## 4. Lambda Functions

| Function | Runtime | Trigger | Purpose |
|----------|---------|---------|---------|
| **EcoBridge-AI-Grader** | Node.js 20.x | POST /api/grade | Rekognition + DynamoDB write |
| **EcoBridge-Checkout-Intercept** | Node.js 20.x | POST /api/intercept | PIN-code matching + fuzzy search |
| **EcoBridge-Presign-Upload** | Node.js 20.x | POST /api/uploads/presign | S3 presigned URLs for image upload |
| **EcoBridge-Express-API** | Node.js 20.x | /* (catch-all) | Admin routes, products, returns |

---

## 5. AI/ML Pipeline

### AWS Rekognition Integration

- **API:** `DetectLabels` (no training required, free tier: 5,000/month)
- **Input:** Raw image bytes (base64 decoded)
- **Parameters:** `MaxLabels: 20, MinConfidence: 60`
- **Output:** Array of `{ Name, Confidence }` labels

### Multi-Image Intelligence

```
4 images → 4 Rekognition calls → 4 label sets
                    │
                    ▼
         ┌─────────────────────┐
         │ Cross-Image Fusion  │
         │                     │
         │ • Label union       │
         │ • Majority vote     │
         │ • Agreement boost   │
         │ • Damage detection  │
         │ • Person rejection  │
         └─────────┬───────────┘
                   │
                   ▼
         Health Score (0-100)
         │
         ├── Identity Match (30%)
         │   Do labels match expected product?
         │
         ├── Completeness (20%)
         │   All 4 angles captured?
         │
         └── Cosmetic Condition (50%)
             Any damage keywords detected?
             Cross-image damage fusion
```

### Person/Face Rejection

```
If top-3 labels include: Person, Human, Face, Adult, Man, Woman...
   OR any person label at confidence >= 70%:
   → REJECT image
   → "Photo shows a person, not a product"
   → Remove capture, send back to review
```

---

## 6. Frontend Architecture

### Tech Stack
- **React 19** + TypeScript
- **Vite 8** (build tool)
- **Tailwind CSS 4** (styling)
- **Lucide React** (icons)
- **Recharts** (admin dashboard charts)
- **react-webcam** (camera capture)

### Component Tree

```
App.tsx
├── CustomerStorefrontPage (main landing — 12 products)
├── AmazonShell (SecondLife header + navigation)
│   └── StorefrontPage (P2P marketplace)
│       └── approvedP2PItems (dynamic from admin)
├── ViewA (Seller — multi-angle scan flow)
│   ├── IdentityConfirmStep
│   ├── AngleCaptureStep (×4)
│   ├── ReviewCapturesStep
│   └── ScoreBreakdownCard
├── ViewB (Returner — orders + EcoBridge popup)
├── ViewC (Buyer — cart + intercept modal)
├── AdminDashboard
│   ├── DashboardHome (KPIs + charts)
│   ├── ReturnsPage (approve/reject queue)
│   ├── MarketplacePage (P2P listings management)
│   ├── AiInspectionPage (detailed AI report)
│   └── SustainabilityPage (eco metrics)
└── P2PProductDetail (Amazon-style product page)
```

### State Flow

```
App.tsx (root state)
│
├── greenCoins (dynamic, animated)
├── soldItems (Set — tracks items sold via EcoBridge)
├── approvedP2PItems (items approved by admin → P2P grid)
├── orders (per-persona, propagates buyer→seller)
├── cart (shared across checkout flow)
│
└── Callbacks:
    ├── onEarnCoins → ViewA/ViewB (after grading)
    ├── onItemSold → ViewA (after Layer 2 verification)
    ├── onItemApproved → AdminDashboard (after approve click)
    └── onPlaceOrder → ViewC (propagates to all personas)
```

---

## 7. Security & Access Control

| Layer | Mechanism |
|-------|-----------|
| API Gateway | CORS: `Access-Control-Allow-Origin: *` |
| Lambda IAM | Least-privilege policies per function |
| Rekognition | Resource: `*` (DetectLabels is global) |
| DynamoDB | Per-function scoped actions (GetItem, PutItem, Query) |
| S3 | Public-read for listing images (prototype) |
| Admin | PIN-code scoping (admin sees only their locality) |

---

## 8. Cost Analysis (AWS Free Tier)

| Service | Free Tier Limit | Our Usage | Status |
|---------|----------------|-----------|--------|
| **Amplify Hosting** | 1000 build min/mo, 15GB | 1 deploy, ~3MB | ✅ |
| **Lambda** | 1M requests, 400K GB-sec | ~100 demo calls | ✅ |
| **API Gateway** | 1M calls/month | ~100 demo calls | ✅ |
| **DynamoDB** | 25GB, 200M requests | ~50 items | ✅ |
| **Rekognition** | 5,000 images/month | ~80 images (20 scans × 4) | ✅ |
| **S3** | 5GB storage | ~50MB (if images stored) | ✅ |
| **CloudWatch** | 5GB logs | Minimal | ✅ |

**Total monthly cost: $0.00** at prototype scale.

---

## 9. The Four Personas

| Persona | Role | Key Actions |
|---------|------|-------------|
| **Amit (Buyer)** | Shops on storefront | Add to cart → checkout → intercept popup if local match |
| **Rahul (Seller)** | Scans & sells items | Multi-angle scan → AI grade → Layer 2 verify → list on P2P |
| **Priya (Returner)** | Returns purchases | Initiate return → EcoBridge popup → earn coins |
| **Admin (Ops)** | Manages warehouse | Approve/reject items → list/unlist P2P → view analytics |

---

## 10. Key Innovation: Two-Layer Verification

```
┌─────────────────────────────────────────┐
│ LAYER 1: AI Visual Assessment           │
│ • AWS Rekognition (4-angle analysis)    │
│ • Cross-image label fusion              │
│ • Automated damage detection            │
│ • Identity verification                 │
│ • Person/face rejection                 │
│ • Confidence scoring                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ LAYER 2: Seller Self-Report             │
│ • Internal damage checklist             │
│ • Functional issue reporting            │
│ • Honest condition disclosure           │
│ • Can only DOWNGRADE (never upgrade)    │
│ • Creates audit trail                   │
└─────────────────────────────────────────┘
                  │
                  ▼
         Final Condition Grade
         (combines both layers)
              │
    ┌─────────┼──────────┐
    ▼         ▼          ▼
 P2P      Warehouse   Recycle
(A/B)     (C/refurb)   (D)
```

---

## 11. Deployment Architecture

```
┌──────────────────────────────────────────────┐
│           AWS Amplify Hosting                 │
│    https://main.d31pimnmgdwiv2.amplifyapp.com│
│    (React SPA, HTTPS, CDN, auto-deploy)      │
└──────────────────────┬───────────────────────┘
                       │ HTTPS API calls
                       ▼
┌──────────────────────────────────────────────┐
│         API Gateway (ap-south-1)             │
│    https://4w990xpwkg.execute-api...         │
│                                              │
│  POST /api/grade ────► Grader Lambda         │
│  POST /api/intercept ► Intercept Lambda      │
│  POST /api/uploads/* ► Presign Lambda        │
│  GET/PUT /api/admin/* ► Express Lambda       │
└────────┬─────────────────────┬───────────────┘
         │                     │
    ┌────▼────┐          ┌────▼────────┐
    │DynamoDB │          │Rekognition  │
    │ (items) │          │(4 calls/scan)│
    └─────────┘          └─────────────┘
```

---

## 12. Demo Script (3-minute presentation)

### Minute 1: The Problem & Solution (30s)
- "India generates 5 million tons of e-waste yearly"
- "Amazon returns often go to landfill"
- "EcoBridge intercepts this waste using AI"

### Minute 2: Live Demo (90s)
1. **Amit buys** headphones from storefront (10s)
2. **Switch to Rahul** → shows item in his orders (5s)
3. **Multi-Angle Scan** → capture 4 photos → watch AI analyze each one live (30s)
4. **Health Card** shows — multi-axis score, Rekognition labels (10s)
5. **Seller verification** → selects "None — works perfectly" → routes to P2P (10s)
6. **Admin approves** → item appears in P2P marketplace (10s)
7. **Amit shops again** → intercept fires → "Your neighbor is selling this!" (15s)

### Minute 3: Architecture & Impact (30s)
- "4 real AWS Rekognition calls per scan"
- "PIN-code-based local matching"
- "Two-layer verification (AI + human)"
- "$0 deployment cost — 100% AWS free tier"
- "12.5kg CO₂ saved per diverted item"

---

*Built for HackOn with Amazon Season 6.0 by Team EcoBridge*
