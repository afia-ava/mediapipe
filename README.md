# MediaPipe Pose Detection App

A React 19 + TypeScript + Vite application featuring pose detection using MediaPipe, with React Router navigation and Supabase backend.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Supabase** - Backend services and database
- **MediaPipe** - Pose detection and computer vision

## Project Structure

```
mediapipe/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, poses, and resources
│   ├── game/            # Game components
│   │   ├── Leaderboard.tsx
│   │   └── PoseGame.tsx
│   ├── lib/             # External service clients
│   │   └── supabase.ts
│   ├── page/            # Page-level components
│   │   └── GamePage.tsx
│   ├── pose-detection/  # Webcam and pose detection
│   │   ├── types.ts
│   │   └── Webcam.tsx
│   ├── pose-utils/      # Pose comparison utilities
│   │   └── poseComparison.ts
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Add your Supabase credentials to `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Features

- **Pose Detection**: Real-time webcam-based pose detection using MediaPipe
- **Game Mode**: Statuesque game with pose matching
- **Leaderboard**: Track and display high scores using Supabase
- **Responsive Design**: Mobile-friendly interface

## Next Steps

1. Configure Supabase database tables for leaderboard
2. Implement MediaPipe pose detection initialization
3. Add pose comparison algorithms
4. Create pose reference images in `src/assets/`
5. Customize game rules and scoring logic

## License

MIT
