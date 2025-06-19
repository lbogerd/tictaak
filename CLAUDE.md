# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Architecture

This is a Next.js 15 application called TicTaak - a task printer web app for creating and printing physical task tickets. The app consists of:

- **Main component**: `components/todo-wireframe.tsx` contains the entire UI logic
- **UI components**: Located in `components/ui/` using Radix UI primitives with Tailwind styling
- **Next.js App Router**: Uses the new app directory structure
- **Styling**: Tailwind CSS v4 with custom gradient backgrounds
- **State management**: Simple React useState hooks for client-side state
- **Path aliases**: Uses `@/*` for imports from root directory

### Key Features
- Create and print task tickets with categories
- Recent tasks history with reprint functionality
- Quick task templates
- Does NOT track the status of tasks, this is done with the printed tickets - not in-app

### Tech Stack
- Next.js 15 with React 19
- TypeScript with strict configuration
- Tailwind CSS v4
- Radix UI components
- Luxon for date handling
- Lucide React for icons
- pnpm for package management
