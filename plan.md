# Implementation Plan: One-Off Planned Tasks Feature

## Overview

Add support for one-off tasks that can be scheduled for future dates, similar to recurring tasks but without the recurring aspect. This will allow users to plan tasks ahead of time and have them appear in their task list on the scheduled date.

## Database Schema Changes

### 1. Extend Task Model

Update the `Task` model in `prisma/schema.prisma` to support one-off planned tasks:

```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Task type - determines how the task is handled
  taskType    TaskType   @default(IMMEDIATE)

  // Recurring task fields (existing)
  isRecurring Boolean @default(false)
  recurringType String? // 'daily', 'weekly', 'monthly'
  recurringInterval Int? @default(1) // every N days/weeks/months
  recurringDays String? // JSON array of day numbers (0=Sunday, 1=Monday, etc.) for weekly recurrence
  lastPrintedAt DateTime?
  nextPrintDate DateTime?
  isActive Boolean @default(true) // to pause/resume recurring tasks

  // One-off planned task fields (new)
  scheduledFor DateTime? // When the one-off task should be due
  isScheduled Boolean @default(false) // Whether this is a scheduled task
  isPrinted Boolean @default(false) // Whether the one-off task has been printed

  @@map("tasks")
}

enum TaskType {
  IMMEDIATE
  RECURRING
  SCHEDULED
}
```

### 2. Migration Strategy

- Add new fields with default values to avoid breaking existing data
- Create migration to set `taskType` based on existing `isRecurring` field:
  - `isRecurring: true` → `taskType: "recurring"`
  - `isRecurring: false` → `taskType: "immediate"`
- Gradually phase out `isRecurring` field in favor of `taskType`

## Backend Changes

### 1. Update Actions (`lib/actions.ts`)

#### New Functions:

```typescript
// Create one-off scheduled task
export async function createScheduledTask(
  title: string,
  categoryId: string,
  scheduledFor: Date
);

// Get tasks scheduled for today
export async function getTodaysScheduledTasks();

// Get upcoming scheduled tasks (next 30 days)
export async function getUpcomingScheduledTasks();

// Update task after printing (for one-off tasks)
export async function updateScheduledTaskAfterPrint(taskId: string);

// Combined function to get all tasks due today (recurring + scheduled)
export async function getTodaysDueTasks();
```

#### Modified Functions:

```typescript
// Update existing getTodaysDueTasks to include scheduled tasks
export async function getTodaysDueTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [recurringTasks, scheduledTasks] = await Promise.all([
    // Get recurring tasks due today
    db.task.findMany({
      where: {
        taskType: "recurring",
        isActive: true,
        nextPrintDate: { gte: today },
      },
      include: { category: true },
      orderBy: { nextPrintDate: "asc" },
    }),
    // Get scheduled tasks due today
    db.task.findMany({
      where: {
        taskType: "scheduled",
        isPrinted: false,
        scheduledFor: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // next day
        },
      },
      include: { category: true },
      orderBy: { scheduledFor: "asc" },
    }),
  ]);

  return [...recurringTasks, ...scheduledTasks];
}
```

### 2. Add Type Definitions

Create new types in `lib/types.ts`:

```typescript
export type TaskType = "immediate" | "recurring" | "scheduled";

export interface ScheduledTaskData {
  scheduledFor: Date;
  isScheduled: boolean;
}

export interface CreateScheduledTaskInput {
  title: string;
  categoryId: string;
  scheduledFor: Date;
}
```

## Frontend Changes

### 1. Update Components

#### A. Rename and Enhance `todays-recurring-tasks.tsx`

Rename to `todays-scheduled-tasks.tsx` and update to handle both recurring and one-off tasks:

```typescript
// Key changes:
- Update component name to `TodaysScheduledTasks`
- Modify title to "Today's Scheduled Tasks"
- Add support for displaying both recurring and one-off tasks
- Add different visual indicators for task types
- Update badges to show task type (recurring vs one-off)
```

#### B. Update `task-card.tsx`

Add support for scheduled tasks:

```typescript
// New props:
interface TaskCardProps {
  // ... existing props
  variant?: "recent" | "recurring" | "scheduled";
}

// New styling for scheduled tasks:
const cardColors = {
  // ... existing colors
  scheduled: {
    border: "border-blue-100",
    background: "bg-gradient-to-r from-white to-blue-50/50",
    title: "text-blue-800",
    hr: "border-blue-100",
  },
};
```

#### C. Create Task Creation Dialog

New component: `components/create-scheduled-task-dialog.tsx`

```typescript
// Features:
- Date picker for scheduling
- Category selection
- Task title input
- Validation for future dates only
- Integration with shadcn/ui DatePicker component
```

### 2. New shadcn/ui Components to Install

Install additional components for better UX:

```bash
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
```

### 3. Update Main Page

Add button to create scheduled tasks alongside existing functionality.

## Implementation Steps

### Phase 1: Database Schema

1. ✅ Update `prisma/schema.prisma` with new fields
2. ✅ Generate and run migration
3. ✅ Update existing data to use new `taskType` field

### Phase 2: Backend Logic

1. ✅ Add new action functions for scheduled tasks
2. ✅ Update existing functions to handle both task types
3. ✅ Add proper error handling and validation
4. ✅ Update type definitions

### Phase 3: Frontend Components

1. ✅ Install required shadcn/ui components
2. ✅ Create scheduled task creation dialog
3. ✅ Update task card component for new variant
4. ✅ Rename and enhance todays-recurring-tasks component

### Phase 4: Integration & Testing

1. ✅ Update main page to use new component
2. ✅ Test creation of scheduled tasks
3. ✅ Test display of mixed recurring/scheduled tasks
4. ✅ Test printing functionality for both types

### Phase 5: Polish & Optimization

1. ✅ Add better visual distinction between task types
2. ✅ Add sorting/filtering options
3. ✅ Optimize database queries
4. ✅ Add proper error states and loading indicators

## UI/UX Considerations

### Visual Design

- **Recurring tasks**: Purple theme (existing)
- **Scheduled tasks**: Blue theme (new)
- **Mixed views**: Clear visual separation with consistent styling

### User Experience

- Clear distinction between recurring and one-off tasks
- Intuitive date picker for scheduling
- Proper feedback when tasks are created/printed
- Responsive design for mobile and desktop

## Technical Considerations

### Performance

- Index database fields used in queries (`scheduledFor`, `taskType`)
- Efficient queries that combine both task types
- Lazy loading for upcoming tasks view

### Data Migration

- Backwards compatibility during transition
- Gradual migration of existing data
- Proper error handling for corrupted data

### Error Handling

- Validation for future dates only
- Proper error messages for failed operations
