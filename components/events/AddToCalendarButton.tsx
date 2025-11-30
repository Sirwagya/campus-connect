"use client";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Calendar, ChevronDown } from "lucide-react";
import { Event } from "@/types/events";

interface AddToCalendarButtonProps {
  event: Event;
}

export function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  const googleCalendarUrl = () => {
    const startDate = new Date(event.start_ts)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");
    const endDate = event.end_ts
      ? new Date(event.end_ts).toISOString().replace(/-|:|\.\d\d\d/g, "")
      : new Date(new Date(event.start_ts).getTime() + 60 * 60 * 1000)
          .toISOString()
          .replace(/-|:|\.\d\d\d/g, "");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: event.description || "",
      location: event.location || "",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const outlookCalendarUrl = () => {
    const startDate = new Date(event.start_ts).toISOString();
    const endDate = event.end_ts
      ? new Date(event.end_ts).toISOString()
      : new Date(
          new Date(event.start_ts).getTime() + 60 * 60 * 1000
        ).toISOString();

    const params = new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      startdt: startDate,
      enddt: endDate,
      subject: event.title,
      body: event.description || "",
      location: event.location || "",
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-[#18181B] border-[#27272a] hover:bg-[#27272a] hover:text-white hover:border-primary/50 transition-all duration-300 group"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Add to Calendar</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[200px] bg-[#18181B] border-[#27272a]"
      >
        <DropdownMenuItem
          onClick={() => window.open(googleCalendarUrl(), "_blank")}
          className="cursor-pointer hover:bg-[#27272a] hover:text-primary focus:bg-[#27272a] focus:text-primary"
        >
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(outlookCalendarUrl(), "_blank")}
          className="cursor-pointer hover:bg-[#27272a] hover:text-primary focus:bg-[#27272a] focus:text-primary"
        >
          Outlook
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(`/api/events/${event.id}/ics`, "_blank")}
          className="cursor-pointer hover:bg-[#27272a] hover:text-primary focus:bg-[#27272a] focus:text-primary"
        >
          Apple Calendar (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
