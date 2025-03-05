import { useState } from "react";
import ChatInterface from "@/components/chat/chat-interface";
import FlightSearch from "@/components/booking/flight-search";
import HotelSearch from "@/components/booking/hotel-search";
import TripCalendar from "@/components/calendar/trip-calendar";
import DestinationCard from "@/components/travel/destination-card";
import { useQuery } from "@tanstack/react-query";
import { mockDestinations } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Destination = typeof mockDestinations[0];

export default function Home() {
  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Travel Assistant
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ChatInterface />
          </div>

          <div className="space-y-8">
            <Tabs defaultValue="flights" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="flights" className="flex-1">Flights</TabsTrigger>
                <TabsTrigger value="hotels" className="flex-1">Hotels</TabsTrigger>
                <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
              </TabsList>
              <TabsContent value="flights">
                <FlightSearch />
              </TabsContent>
              <TabsContent value="hotels">
                <HotelSearch />
              </TabsContent>
              <TabsContent value="calendar">
                <TripCalendar />
              </TabsContent>
            </Tabs>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Popular Destinations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {destinations.map((destination) => (
                  <DestinationCard key={destination.id} destination={destination} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}