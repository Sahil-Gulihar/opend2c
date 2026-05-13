"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-gray-900",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md flex items-center justify-center transition-colors",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
        row: "flex w-full mt-1",
        cell: cn(
          "relative flex-1 text-center text-sm p-0 focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 mx-auto rounded-md",
          "hover:bg-gray-100 transition-colors flex items-center justify-center text-sm",
        ),
        day_range_start: "!bg-blue-600 !text-white hover:!bg-blue-700 rounded-md",
        day_range_end: "!bg-blue-600 !text-white hover:!bg-blue-700 rounded-md",
        day_selected: "bg-blue-600 text-white hover:bg-blue-700",
        day_today: "bg-gray-100 text-gray-900 font-semibold",
        day_outside: "text-gray-300 opacity-50",
        day_disabled: "text-gray-300 opacity-50",
        day_range_middle: "aria-selected:bg-blue-50 aria-selected:text-blue-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
