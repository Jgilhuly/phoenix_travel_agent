import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Booking } from "@shared/schema";

export default function TripCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const bookedDates = bookings.map(booking => new Date(booking.date));

  return (
    <Card>
      <CardContent className="p-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          modifiers={{
            booked: bookedDates,
          }}
          modifiersStyles={{
            booked: {
              backgroundColor: "hsl(var(--primary))",
              color: "white",
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
