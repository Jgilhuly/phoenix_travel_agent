import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { mockFlights } from "@shared/schema";
import { Plane } from "lucide-react";

type Flight = typeof mockFlights[0];

export default function FlightSearch() {
  const { data: flights = [] } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  return (
    <div className="space-y-4">
      {flights.map((flight) => (
        <Card key={flight.id}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plane className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{flight.airline}</h3>
                  <span className="text-lg font-bold">${flight.price}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {flight.from} → {flight.to}
                </div>
                <div className="text-sm text-muted-foreground">
                  {flight.date} • {flight.duration}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}