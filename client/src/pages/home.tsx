import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/bottom-nav";
import FeedingModal from "@/components/feeding-modal";
import { useLocation } from "wouter";
import type { ActivityItem, WalkWithEvents, FeedingWithUser } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

  // Fetch recent activity
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activity"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/activity?limit=5");
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json() as Promise<ActivityItem[]>;
    },
  });

  // Fetch last feeding
  const { data: lastFeeding } = useQuery({
    queryKey: ["/api/feedings/last"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/feedings/last");
      if (!response.ok) throw new Error("Failed to fetch last feeding");
      return response.json() as Promise<FeedingWithUser | null>;
    },
  });

  // Fetch active walk
  const { data: activeWalk } = useQuery({
    queryKey: ["/api/walks/active"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/walks/active");
      if (!response.ok) throw new Error("Failed to fetch active walk");
      return response.json() as Promise<WalkWithEvents | null>;
    },
  });

  // Start walk mutation
  const startWalkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/walks", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/walks/active"] });
      setLocation("/walk");
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
        description: "Failed to start walk",
        variant: "destructive",
      });
    },
  });

  const handleStartWalk = () => {
    if (activeWalk) {
      setLocation("/walk");
    } else {
      startWalkMutation.mutate();
    }
  };

  const getLastWalkInfo = () => {
    const lastWalk = activities.find(activity => activity.type === 'walk');
    if (lastWalk) {
      const timeDiff = Date.now() - new Date(lastWalk.timestamp).getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      return hours > 0 ? `${hours} hrs ago` : 'Recently';
    }
    return 'No walks yet';
  };

  const getLastFeedingInfo = () => {
    if (lastFeeding) {
      const timeDiff = Date.now() - new Date(lastFeeding.timestamp).getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      return hours > 0 ? `${hours} hrs ago` : 'Recently';
    }
    return 'No feeding yet';
  };

  const getUserInitial = (user: any) => {
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const getUserName = (user: any) => {
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getUserColor = (userId: string) => {
    const colors = ['bg-pet-green', 'bg-pet-blue', 'bg-pet-orange', 'bg-pet-purple'];
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pet-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${getUserColor(user.id)} rounded-full flex items-center justify-center`}>
                <span className="text-white font-semibold" data-testid="text-user-initial">
                  {getUserInitial(user)}
                </span>
              </div>
              <div>
                <div className="font-semibold text-gray-800" data-testid="text-user-name">
                  {getUserName(user)}
                </div>
                <div className="text-xs text-gray-500" data-testid="text-current-time">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt text-xl text-gray-600"></i>
            </Button>
          </div>
        </div>
      </header>

      {/* Dog Status Card */}
      <div className="p-4">
        <Card className="bg-white rounded-3xl shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <img 
                src="https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=300" 
                alt="Golden retriever dog" 
                className="w-16 h-16 rounded-full object-cover border-4 border-pet-orange"
                data-testid="img-dog-avatar"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-800" data-testid="text-dog-name">
                  Buddy
                </h2>
                <p className="text-gray-600" data-testid="text-dog-breed">
                  Golden Retriever
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-pet-blue bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-walking text-pet-blue text-lg"></i>
                </div>
                <div className="text-xs text-gray-500">Last Walk</div>
                <div className="font-semibold text-gray-800" data-testid="text-last-walk">
                  {getLastWalkInfo()}
                </div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-pet-orange bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-utensils text-pet-orange text-lg"></i>
                </div>
                <div className="text-xs text-gray-500">Last Feed</div>
                <div className="font-semibold text-gray-800" data-testid="text-last-feed">
                  {getLastFeedingInfo()}
                </div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-pet-green bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-heart text-pet-green text-lg"></i>
                </div>
                <div className="text-xs text-gray-500">Mood</div>
                <div className="font-semibold text-gray-800" data-testid="text-dog-mood">
                  Happy
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={handleStartWalk}
            disabled={startWalkMutation.isPending}
            className="bg-pet-blue hover:bg-pet-blue/90 text-white rounded-2xl p-6 h-auto flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl transition-all duration-200"
            data-testid="button-start-walk"
          >
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-walking text-2xl"></i>
            </div>
            <span className="font-semibold">
              {activeWalk ? 'Continue Walk' : 'Start Walk'}
            </span>
          </Button>
          
          <Button
            onClick={() => setShowFeedingModal(true)}
            className="bg-pet-orange hover:bg-pet-orange/90 text-white rounded-2xl p-6 h-auto flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl transition-all duration-200"
            data-testid="button-log-feeding"
          >
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-utensils text-2xl"></i>
            </div>
            <span className="font-semibold">Log Feeding</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mb-20">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-paw text-gray-400 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">No activities yet</h4>
                <p className="text-gray-600 text-sm">Start tracking Buddy's activities!</p>
              </CardContent>
            </Card>
          ) : (
            activities.map((activity) => (
              <Card key={activity.id} className="bg-white rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${activity.type === 'walk' ? 'bg-pet-blue' : 'bg-pet-orange'} bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <i className={`fas ${activity.type === 'walk' ? 'fa-walking' : 'fa-utensils'} ${activity.type === 'walk' ? 'text-pet-blue' : 'text-pet-orange'}`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {activity.type === 'walk' ? 'Walk completed' : 'Fed Buddy'}
                      </div>
                      {activity.type === 'walk' && activity.events && (
                        <div className="text-sm text-gray-600">
                          {activity.events.filter(e => e.eventType === 'pee').length} pee stop{activity.events.filter(e => e.eventType === 'pee').length !== 1 ? 's' : ''}, {activity.events.filter(e => e.eventType === 'poo').length} poo stop{activity.events.filter(e => e.eventType === 'poo').length !== 1 ? 's' : ''}
                        </div>
                      )}
                      {activity.type === 'feeding' && (
                        <div className="text-sm text-gray-600">
                          {(activity.data as any).mealType} - {(activity.data as any).portion} portion
                        </div>
                      )}
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        <span>by {getUserName(activity.user)}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(activity.timestamp.toString())}</span>
                      </div>
                    </div>
                    {activity.type === 'walk' && (activity.data as any).duration && (
                      <div className="text-sm font-semibold text-pet-blue">
                        {Math.floor((activity.data as any).duration)} min
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          
          {activities.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setLocation("/activity")}
              className="w-full bg-gray-100 text-gray-600 rounded-2xl p-4 hover:bg-gray-200"
              data-testid="button-view-all-activity"
            >
              <span className="font-medium">View All Activity</span>
              <i className="fas fa-arrow-right text-sm ml-2"></i>
            </Button>
          )}
        </div>
      </div>

      <BottomNav currentPage="home" />
      
      <FeedingModal 
        isOpen={showFeedingModal} 
        onClose={() => setShowFeedingModal(false)} 
      />
    </div>
  );
}
