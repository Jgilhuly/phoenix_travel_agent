import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { mockHotels } from "@shared/schema";
import { Star } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type Hotel = typeof mockHotels[0];

export default function HotelSearch() {
  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels"],
  });

  return (
    <div className="space-y-4">
      {hotels.map((hotel) => (
        <Card key={hotel.id}>
          <CardContent className="p-0">
            <AspectRatio ratio={16 / 9}>
              <img
                src={hotel.image}
                alt={hotel.name}
                className="object-cover w-full h-full rounded-t-lg"
              />
            </AspectRatio>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{hotel.name}</h3>
                  <div className="text-sm text-muted-foreground">
                    {hotel.location}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium">{hotel.rating}</span>
                </div>
              </div>
              <div className="mt-2 font-bold">
                ${hotel.price} <span className="text-sm font-normal text-muted-foreground">per night</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}