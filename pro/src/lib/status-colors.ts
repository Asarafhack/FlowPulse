// Small shared helper: colour-coded pill classes for project status,
// task status, and task priority — so progress is scannable at a glance.

export function projectStatusClass(status: string): string {
  switch (status) {
    case "In Progress":
      return "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200";
    case "Completed":
      return "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "Not Started":
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200";
  }
}

export function taskStatusClass(status: string): string {
  switch (status) {
    case "In Progress":
      return "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200";
    case "Completed":
      return "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "Pending":
    default:
      return "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200";
  }
}

export function taskPriorityClass(priority: string): string {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-700 ring-1 ring-inset ring-red-200";
    case "Medium":
      return "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "Low":
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200";
  }
}

// A small coloured dot, used next to status text for a quick visual scan
// (e.g. in tables where the pill alone might be too subtle).
export function statusDotClass(status: string): string {
  switch (status) {
    case "In Progress":
      return "bg-blue-500";
    case "Completed":
      return "bg-emerald-500";
    case "Pending":
    case "Not Started":
    default:
      return "bg-slate-400";
  }
}
