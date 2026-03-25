# Kinesthetic Games

A collection of movement-based interactive games designed to blend physical activity with digital gameplay. Instead of traditional keyboard or controller input, these games use body movement as the primary interaction, creating a more immersive and active gaming experience.

## Inspiration

This project is an extended version of a the statuesque game I made with my friends at a hackathon. I wanted to take the application to a next step and go for typescript and tailwind css!

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Supabase** - Backend services and database
- **MediaPipe** - Pose detection and computer vision

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

## License

MIT
