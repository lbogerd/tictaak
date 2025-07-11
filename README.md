# TicTaak - Task Printer

A modern web application for creating and printing physical task tickets. Perfect for organizing tasks that need to be completed away from your computer.

## Features

- **Create & Print Tasks**: Generate printable task tickets with categories
- **Task Categories**: Organize tasks by Personal, Work, Health, Shopping, or Projects
- **Recent Tasks History**: Reprint previously created tasks
- **Quick Templates**: Fast access to commonly used task descriptions
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and Radix UI

## Tech Stack

- **Framework**: Next.js 15 with Turbopack
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Date/Time**: Luxon
- **Package Manager**: pnpm

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. **Create a Task**: Click "Create & Print Task" to add a new task
2. **Add Details**: Enter task description and select a category
3. **Print**: Click "Create & Print" to generate a printable ticket
4. **Reprint**: Use the Recent Tasks section to reprint previous tasks
5. **Quick Add**: Use the quick templates for common tasks

## Keyboard Shortcuts

- `Ctrl+/` - Quick access to create new task form

## Project Structure

```
tictaak/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── todo-wireframe.tsx # Main task management component
├── lib/                # Utility functions
└── public/             # Static assets
```

## Development

This project uses:

- **ESLint** for code linting
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **pnpm** for package management

## Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Contributing

This is a personal task management tool. Feel free to fork and adapt for your own needs.
