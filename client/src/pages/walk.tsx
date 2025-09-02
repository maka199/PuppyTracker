import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { WalkWithEvents } from "@shared/schema";

export default function Walk() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [walkTimer, setWalkTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Fetch active walk
  const { data: activeWalk, isLoading: walkLoading } = useQuery({
    queryKey: ["/api/walks/active"],
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/walks/active");
      if (!response.ok) throw new Error("Failed to fetch active walk");
      return response.json() as Promise<WalkWithEvents | null>;
    },
  });

  // Timer effect
  useEffect(() => {
    if (!activeWalk || isPaused) return;

    const startTime = new Date(activeWalk.startTime).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setWalkTimer(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeWalk, isPaused]);

  // Log walk event mutation
  const logEventMutation = useMutation({
    mutationFn: async (eventType: 'pee' | 'poo') => {
      if (!activeWalk) throw new Error("No active walk");
      await apiRequest("POST", `/api/walks/${activeWalk.id}/events`, {
        eventType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/walks/active"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to log event",
        variant: "destructive",
      });
    },
  });

  // Complete walk mutation
  const completeWalkMutation = useMutation({
    mutationFn: async () => {
      if (!activeWalk) throw new Error("No active walk");
      const duration = Math.floor(walkTimer / 60); // Convert to minutes
      await apiRequest("PUT", `/api/walks/${activeWalk.id}`, {
        endTime: new Date(),
        duration,
        isCompleted: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/walks/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Walk Completed!",
        description: "Great job walking Buddy!",
      });
      setLocation("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to complete walk",
        variant: "destructive",
      });
    },
  });

  const handleEndWalk = () => {
    setLocation("/");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPeeCount = () => {
    return activeWalk?.events?.filter(e => e.eventType === 'pee').length || 0;
  };

  const getPooCount = () => {
    return activeWalk?.events?.filter(e => e.eventType === 'poo').length || 0;
  };

  if (isLoading || walkLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading walk...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!activeWalk) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-pet-orange bg-opacity-30 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-walking text-pet-orange text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold mb-4">No Active Walk</h2>
          <p className="text-gray-300 mb-6">Start a walk from the home screen</p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-pet-green hover:bg-pet-green/90 text-white rounded-2xl px-8 py-3"
            data-testid="button-go-home"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
        <div className="absolute top-32 right-8 w-16 h-16 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-32 left-6 w-24 h-24 border-2 border-white rounded-full"></div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEndWalk}
          className="p-2 text-white hover:bg-white/10"
          data-testid="button-end-walk"
        >
          <i className="fas fa-times text-xl"></i>
        </Button>
        <div className="text-center">
          <div className="text-lg font-semibold">Walk in Progress</div>
          <div className="text-sm opacity-80" data-testid="text-walk-status">
            {isPaused ? 'Paused' : 'Active'}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPaused(!isPaused)}
          className="p-2 text-white hover:bg-white/10"
          data-testid="button-pause-walk"
        >
          <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'} text-xl`}></i>
        </Button>
      </div>

      {/* Walk Stats */}
      <div className="relative z-10 px-4 py-6">
        <div className="text-center mb-8">
          <div className="text-5xl font-bold mb-2" data-testid="text-walk-timer">
            {formatTime(walkTimer)}
          </div>
          <div className="text-lg opacity-80">Walking Time</div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 bg-opacity-30 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-tint text-yellow-400 text-2xl"></i>
            </div>
            <div className="text-2xl font-bold" data-testid="text-pee-count">
              {getPeeCount()}
            </div>
            <div className="text-sm opacity-80">Pee Stops</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-600 bg-opacity-30 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-seedling text-amber-400 text-2xl"></i>
            </div>
            <div className="text-2xl font-bold" data-testid="text-poo-count">
              {getPooCount()}
            </div>
            <div className="text-sm opacity-80">Poo Stops</div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="relative z-10 px-4 space-y-4 mb-8">
        <Button
          onClick={() => logEventMutation.mutate('pee')}
          disabled={logEventMutation.isPending}
          className="w-full bg-yellow-500 hover:bg-yellow-500/90 text-gray-900 rounded-2xl py-4 text-lg font-semibold shadow-lg"
          data-testid="button-log-pee"
        >
          <i className="fas fa-tint text-xl mr-3"></i>
          <span>Log Pee Stop</span>
        </Button>
        
        <Button
          onClick={() => logEventMutation.mutate('poo')}
          disabled={logEventMutation.isPending}
          className="w-full bg-amber-600 hover:bg-amber-600/90 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg"
          data-testid="button-log-poo"
        >
          <i className="fas fa-seedling text-xl mr-3"></i>
          <span>Log Poo Stop</span>
        </Button>
        
        <Button
          onClick={() => completeWalkMutation.mutate()}
          disabled={completeWalkMutation.isPending}
          className="w-full bg-pet-green hover:bg-pet-green/90 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg"
          data-testid="button-complete-walk"
        >
          <i className="fas fa-check text-xl mr-3"></i>
          <span>Complete Walk</span>
        </Button>
      </div>
    </div>
  );
}
