"use client";

import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { Calendar } from "lucide-react";
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
    <DropdownMenu
      trigger={
        <Button variant="outline" className="w-full">
          <Calendar className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>
      }
    >
      <DropdownMenuItem
        onClick={() => window.open(googleCalendarUrl(), "_blank")}
      >
        Google Calendar
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => window.open(outlookCalendarUrl(), "_blank")}
      >
        Outlook
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => window.open(`/api/events/${event.id}/ics`, "_blank")}
      >
        Apple Calendar (.ics)
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
