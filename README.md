# Second Life Commerce (EcoBridge)

Second Life Commerce (EcoBridge) is a modern web application designed with a React/Vite frontend and a serverless AWS backend. It enables eco-friendly commerce by leveraging AWS Rekognition for image analysis, DynamoDB for fast NoSQL storage, and S3 for reliable file hosting.

## Project Structure

The project is divided into two main parts:
- **Frontend (`/`)**: A fast, responsive React application built with Vite and Tailwind CSS.
- **Backend (`/backend`)**: A serverless AWS backend built with Express, TypeScript, and AWS Lambda.

## Tech Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **Language:** TypeScript

### Backend
- **Framework:** Express / Serverless HTTP
- **Language:** TypeScript / Node.js
- **Cloud Infrastructure:** AWS SAM (Serverless Application Model)
- **AWS Services:** Lambda, DynamoDB, Rekognition, S3

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- AWS CLI & SAM CLI (for backend deployment/local testing)

### Running the Frontend
Navigate to the root directory and start the Vite development server:
```bash
npm install
npm run dev
```

### Running the Backend
Navigate to the `backend` directory to run the Express server locally:
```bash
cd backend
npm install
npm start
```

For serverless local API testing using AWS SAM:
```bash
cd backend
npm run local:api
```

## Deployment

Deployment scripts are included in the root directory (`deploy.ps1`, `deploy-https.ps1`, `deploy.sh`) for automating the build and deployment processes.

For the backend specifically, you can deploy using SAM:
```bash
cd backend
npm run deploy
```

## License

ISC
