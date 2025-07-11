# Task Selection System Guide

## Overview

I have successfully implemented a comprehensive task selection system that allows users to select one or many tasks across different overview sections. The system includes individual task selection, section-wide selection, group-specific selection, and bulk actions.

## Features Implemented

### 1. Individual Task Selection

- **Checkbox UI**: Each task card displays a checkbox when selection mode is active
- **Visual Feedback**: Selected tasks are highlighted with a blue ring and background tint
- **Toggle Selection**: Users can check/uncheck individual tasks

### 2. Section-Wide Selection

- **Select All Button**: Header includes a "Select All" / "Deselect All" button
- **Selection Mode Toggle**: Users can enter/exit selection mode with a "Select" / "Done" button
- **Count Display**: Shows number of selected tasks in the header

### 3. Group-Level Selection

- **Group Select All**: Each TaskGroup (e.g., time-based groups) has its own "Select All" button
- **Group Count**: Shows how many tasks are selected within each group
- **Independent Operation**: Groups can be selected independently of other groups

### 4. Bulk Actions

- **Floating Action Bar**: Appears at bottom of screen when tasks are selected
- **Bulk Print**: Print all selected tasks at once (for recurring tasks)
- **Bulk Delete**: Delete multiple selected tasks with confirmation
- **Clear Selection**: Quick way to deselect all tasks

## Components Enhanced

### TaskCard Component

**New Props:**

- `selectionMode?: boolean` - Enables/disables selection UI
- `isSelected?: boolean` - Whether the task is currently selected
- `onSelectionChange?: (taskId: string, selected: boolean) => void` - Selection change handler

**Usage:**

```tsx
<TaskCard
  task={task}
  onPrint={handlePrint}
  selectionMode={selectionMode}
  isSelected={selectedTaskIds.has(task.id)}
  onSelectionChange={handleTaskSelection}
  // ... other props
/>
```

### TaskSectionHeader Component

**New Props:**

- `selectionMode?: boolean` - Whether section is in selection mode
- `selectedCount?: number` - Number of selected tasks
- `totalCount?: number` - Total number of tasks in section
- `onToggleSelection?: () => void` - Handler for "Select All" / "Deselect All"
- `onToggleSelectionMode?: () => void` - Handler for entering/exiting selection mode

**Usage:**

```tsx
<TaskSectionHeader
  icon={<Repeat className="w-5 h-5" />}
  title="Today's Recurring Tasks"
  count={dueTasks.length}
  countLabel="due"
  selectionMode={selectionMode}
  selectedCount={selectedTaskIds.size}
  totalCount={totalTaskCount}
  onToggleSelection={handleToggleAllSelection}
  onToggleSelectionMode={handleToggleSelectionMode}
  colorScheme="purple"
/>
```

### TaskGroup Component

**New Props:**

- `selectionMode?: boolean` - Whether group is in selection mode
- `selectedCount?: number` - Number of selected tasks in this group
- `onToggleGroupSelection?: () => void` - Handler for group-level "Select All"

**Usage:**

```tsx
<TaskGroup
  title="Around 14:00"
  icon={<Clock className="w-4 h-4" />}
  count={hourTasks.length}
  countLabel="task"
  selectionMode={selectionMode}
  selectedCount={groupSelectedCount}
  onToggleGroupSelection={() => handleToggleGroupSelection(hourTasks)}
  colorScheme="green"
>
  {/* TaskCard components */}
</TaskGroup>
```

### TaskBulkActions Component (New)

**Props:**

- `selectedCount: number` - Number of selected tasks
- `onBulkPrint?: () => void` - Handler for bulk print action
- `onBulkDelete?: () => void` - Handler for bulk delete action
- `onClearSelection?: () => void` - Handler for clearing selection
- `isPrintingBulk?: boolean` - Whether bulk printing is in progress
- `colorScheme?: "rose" | "purple" | "green" | "amber"` - Color theme

**Usage:**

```tsx
<TaskBulkActions
  selectedCount={selectedTaskIds.size}
  onBulkPrint={handleBulkPrint}
  onBulkDelete={handleBulkDelete}
  onClearSelection={() => setSelectedTaskIds(new Set())}
  isPrintingBulk={isPrintingBulk}
  colorScheme="purple"
/>
```

## Implementation Details

### State Management

Each component that supports selection maintains:

```tsx
// Selection state
const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
const [selectionMode, setSelectionMode] = useState(false);
const [isPrintingBulk, setIsPrintingBulk] = useState(false); // If bulk actions supported
```

### Key Handler Functions

#### Individual Task Selection

```tsx
const handleTaskSelection = (taskId: string, selected: boolean) => {
  setSelectedTaskIds((prev: Set<string>) => {
    const newSet = new Set(prev);
    if (selected) {
      newSet.add(taskId);
    } else {
      newSet.delete(taskId);
    }
    return newSet;
  });
};
```

#### Toggle Selection Mode

```tsx
const handleToggleSelectionMode = () => {
  setSelectionMode(!selectionMode);
  if (selectionMode) {
    setSelectedTaskIds(new Set()); // Clear selection when exiting
  }
};
```

#### Section-Wide Selection

```tsx
const handleToggleAllSelection = () => {
  const allTaskIds = allTasks.map((task) => task.id);
  const allSelected = allTaskIds.every((id) => selectedTaskIds.has(id));

  if (allSelected) {
    setSelectedTaskIds(new Set());
  } else {
    setSelectedTaskIds(new Set(allTaskIds));
  }
};
```

#### Group-Level Selection

```tsx
const handleToggleGroupSelection = (tasks: Task[]) => {
  const groupTaskIds = tasks.map((task) => task.id);
  const allGroupSelected = groupTaskIds.every((id) => selectedTaskIds.has(id));

  setSelectedTaskIds((prev: Set<string>) => {
    const newSet = new Set(prev);

    if (allGroupSelected) {
      groupTaskIds.forEach((id) => newSet.delete(id));
    } else {
      groupTaskIds.forEach((id) => newSet.add(id));
    }

    return newSet;
  });
};
```

#### Bulk Actions

```tsx
const handleBulkPrint = async () => {
  if (selectedTaskIds.size === 0) return;

  setIsPrintingBulk(true);
  const selectedTasks = allTasks.filter((task) => selectedTaskIds.has(task.id));

  try {
    for (const task of selectedTasks) {
      await handlePrint(task);
    }
    setSelectedTaskIds(new Set());
  } catch (error) {
    console.error("Bulk print failed:", error);
  } finally {
    setIsPrintingBulk(false);
  }
};

const handleBulkDelete = async () => {
  if (selectedTaskIds.size === 0) return;

  if (!confirm(`Delete ${selectedTaskIds.size} selected tasks?`)) return;

  try {
    for (const taskId of selectedTaskIds) {
      await deleteTask(taskId);
    }
    // Update local state to remove deleted tasks
    setTasks((prev) => prev.filter((task) => !selectedTaskIds.has(task.id)));
    setSelectedTaskIds(new Set());
  } catch (error) {
    console.error("Bulk delete failed:", error);
  }
};
```

## User Experience Flow

### Entering Selection Mode

1. User clicks "Select" button in any section header
2. Section enters selection mode:
   - Action buttons in header change to selection controls
   - Checkboxes appear on all task cards
   - "Select All" and "Done" buttons become available

### Selecting Tasks

1. **Individual Selection**: Click checkbox on any task card
2. **Group Selection**: Click "Select All" link in any TaskGroup header
3. **Section Selection**: Click "Select All" button in section header
4. **Visual Feedback**: Selected tasks show blue highlight and checkmark

### Bulk Actions

1. When tasks are selected, floating action bar appears at bottom
2. Available actions depend on section:
   - **Recurring Tasks**: Print All, Delete, Clear Selection
   - **Printed Tasks**: Clear Selection only (no printing since already printed)
3. Actions provide appropriate feedback and confirmation dialogs

### Exiting Selection Mode

1. Click "Done" button in header
2. All selections are cleared
3. UI returns to normal view mode

## Benefits

### User Experience

- **Efficiency**: Select and act on multiple tasks at once
- **Flexibility**: Choose individual tasks, groups, or entire sections
- **Clear Feedback**: Visual indicators for selected state and action progress
- **Safety**: Confirmation dialogs for destructive actions

### Developer Experience

- **Reusable Components**: Selection system works across all task sections
- **Consistent API**: Same props and handlers across all components
- **Type Safety**: Full TypeScript support for all selection features
- **Maintainable**: Centralized logic that's easy to understand and modify

### Performance

- **Efficient State**: Uses Set for O(1) lookup of selected tasks
- **Minimal Re-renders**: Optimized state updates to reduce unnecessary renders
- **Bulk Operations**: Single API call pattern for bulk actions

## Future Enhancements

1. **Keyboard Shortcuts**: Add Ctrl+A for select all, Escape to exit selection mode
2. **Multi-Section Selection**: Allow selection across different sections simultaneously
3. **Smart Selection**: Select tasks based on filters (e.g., all tasks in a category)
4. **Drag Selection**: Click and drag to select multiple consecutive tasks
5. **Selection Persistence**: Remember selection when navigating between views

The task selection system provides a comprehensive, user-friendly way to manage multiple tasks efficiently while maintaining the clean, intuitive interface of the application.
