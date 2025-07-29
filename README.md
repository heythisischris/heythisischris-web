# hey, this is chris

A modern React portfolio website showcasing projects, posts, and professional experience.

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Rich Text**: Tiptap
- **Analytics**: PostHog
- **Authentication**: AWS Amplify (Cognito)
- **PWA**: Service Worker support

## Getting Started

### Prerequisites
- Node.js 18+
- Yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/heythisischris/heythisischris-web.git
cd heythisischris-web

# Install dependencies
yarn install
```

### Development

```bash
# Start development server (staging mode)
yarn start:staging

# Start development server (production mode)
yarn start:prod
```

The app will be available at `http://localhost:5173`

### Building

```bash
# Build for staging
yarn build:staging

# Build for production
yarn build:prod

# Build both environments
yarn build
```

## Features

- **Portfolio**: Interactive project showcase with detailed views
- **Blog**: Dynamic post system with rich text editing
- **Resume**: Professional experience and skills
- **Contact**: Request form with calendar integration
- **PWA**: Offline support and app-like experience
- **Responsive**: Mobile-first design
- **Git Integration**: Live commit tracking for projects

## Project Structure

```
src/
├── components/     # Reusable UI components
├── routes/         # Page components
├── utils/          # Helper functions and hooks
└── App.tsx         # Main application setup
```

## Environment Variables

Create `.env.production` and `.env.staging` files:

```env
VITE_USERPOOLID=your_cognito_user_pool_id
VITE_USERPOOLWEBCLIENTID=your_cognito_client_id
VITE_GRAPHQL_URL=your_graphql_endpoint
VITE_API_URL=your_api_endpoint
VITE_POSTHOG_KEY=your_posthog_key
```

## Deployment

The project uses AWS S3 + CloudFront for hosting with automated deployment scripts.
