import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { mockDestinations } from "@shared/schema";

interface DestinationCardProps {
  destination: typeof mockDestinations[0];
}

export default function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <AspectRatio ratio={16 / 9}>
          <img
            src={destination.image}
            alt={destination.name}
            className="object-cover w-full h-full"
          />
        </AspectRatio>
        <div className="p-4">
          <h3 className="font-semibold">{destination.name}</h3>
          <p className="text-sm text-muted-foreground">
            {destination.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
