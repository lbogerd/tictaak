import { Badge } from "@/components/ui/badge";
import { getTasksPrintedToday } from "@/lib/actions";
import { Prisma } from "@prisma/client";
import {
	CheckCircle,
	Clock,
	Loader2,
	PrinterCheck,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import TaskCard from "./task-card";

type Task = Prisma.TaskGetPayload<{
	include: { category: true };
}>;

interface TodaysPrintedTasksProps {
	refreshTrigger?: number; // Can be used to refresh when new tasks are printed
}

export default function TodaysPrintedTasks({
	refreshTrigger,
}: TodaysPrintedTasksProps) {
	const [printedTasks, setPrintedTasks] = useState<Task[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadPrintedTasks();
	}, [refreshTrigger]);

	const loadPrintedTasks = async () => {
		try {
			setIsLoading(true);
			const tasks = await getTasksPrintedToday();
			setPrintedTasks(tasks);
		} catch (error) {
			console.error("Failed to load printed tasks:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const getTaskTypeBadge = (task: Task) => {
		if (task.recurringType) {
			return (
				<Badge
					key="task-type"
					variant="outline"
					className="text-xs rounded-full border-green-200 text-green-700 bg-green-50 capitalize"
				>
					Recurring • {task.recurringType}
				</Badge>
			);
		} else {
			return (
				<Badge
					key="task-type"
					variant="outline"
					className="text-xs rounded-full border-green-200 text-green-700 bg-green-50"
				>
					One-time
				</Badge>
			);
		}
	};

	const getPrintedTimeBadge = (task: Task) => {
		if (!task.lastPrintedAt) return null;

		const printedTime = DateTime.fromJSDate(task.lastPrintedAt);
		const now = DateTime.now();
		const diffInMinutes = now.diff(printedTime, "minutes").minutes;

		let timeText;
		if (diffInMinutes < 1) {
			timeText = "Just now";
		} else if (diffInMinutes < 60) {
			timeText = `${Math.floor(diffInMinutes)}m ago`;
		} else {
			timeText = printedTime.toFormat("h:mm a");
		}

		return (
			<Badge
				key="printed-time"
				variant="outline"
				className="text-xs rounded-full border-emerald-200 text-emerald-700 bg-emerald-50"
			>
				<Clock className="w-3 h-3 mr-1" />
				Printed {timeText}
			</Badge>
		);
	};

	const groupTasksByHour = (tasks: Task[]) => {
		const groups: { [key: string]: Task[] } = {};

		tasks.forEach((task) => {
			if (task.lastPrintedAt) {
				const hourKey = DateTime.fromJSDate(task.lastPrintedAt).startOf("hour").toFormat("h:mm a");
				if (!groups[hourKey]) {
					groups[hourKey] = [];
				}
				groups[hourKey].push(task);
			}
		});

		// Sort by time (most recent first)
		return Object.entries(groups).sort(([a], [b]) => {
			const timeA = DateTime.fromFormat(a, "h:mm a");
			const timeB = DateTime.fromFormat(b, "h:mm a");
			return timeB.valueOf() - timeA.valueOf();
		});
	};

	if (isLoading) {
		return (
			<div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-green-100 p-8 mb-8">
				<div className="flex items-center justify-center py-8">
					<Loader2 className="w-6 h-6 animate-spin text-green-500" />
					<span className="ml-2 text-green-700">
						Loading today&apos;s printed tasks...
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-green-100 p-8 mb-8">
			<div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
				<div className="flex flex-col space-y-2 sm:space-y-0">
					<h2 className="text-xl sm:text-2xl font-bold text-green-800 flex items-center gap-2 flex-wrap">
						<PrinterCheck className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
						<span className="min-w-0">Today&apos;s Printed Tasks</span>
						{printedTasks.length > 0 && (
							<Badge
								variant="outline"
								className="bg-green-50 border-green-200 text-green-700 text-xs sm:text-sm"
							>
								{printedTasks.length} completed
							</Badge>
						)}
					</h2>
				</div>
			</div>

			{printedTasks.length === 0 ? (
				<div className="text-center py-4 md:py-8 text-green-600">
					<div className="text-4xl mb-4">📝</div>
					<p className="text-lg">No tasks printed today yet!</p>
					<p className="text-sm bg-green-50 rounded-2xl px-6 py-3 inline-block mt-2">
						Start printing some tasks to see them here 🖨️
					</p>
				</div>
			) : (
				<div className="space-y-6">
					{groupTasksByHour(printedTasks).map(([hourKey, hourTasks]) => (
						<div key={hourKey}>
							<h3 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
								<CheckCircle className="w-4 h-4" />
								Around {hourKey}
								<Badge
									variant="outline"
									className="text-xs bg-green-50 border-green-200 text-green-700"
								>
									{hourTasks.length} task{hourTasks.length !== 1 ? "s" : ""}
								</Badge>
							</h3>

							<div className="space-y-3 ml-6">
								{hourTasks.map((task) => (
									<TaskCard
										key={`printed-${task.id}`}
										task={task}
										onPrint={() => { }} // No-op for printed tasks
										isPrinting={false}
										variant="recent"
										additionalBadges={[
											getTaskTypeBadge(task),
											getPrintedTimeBadge(task),
										].filter(Boolean)}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			)}

			{printedTasks.length > 0 && (
				<div className="mt-6 pt-4 border-t border-green-100">
					<p className="text-xs text-green-600 text-center">
						Great job! You&apos;ve completed {printedTasks.length} task
						{printedTasks.length !== 1 ? "s" : ""} today 🎉
					</p>
				</div>
			)}
		</div>
	);
}
