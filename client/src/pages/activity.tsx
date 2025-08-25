import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/bottom-nav";
import type { ActivityItem } from "@shared/schema";

type FilterType = 'all' | 'walks' | 'feeding' | 'today' | 'week';

export default function Activity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Fetch activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activity"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/activity?limit=50");
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json() as Promise<ActivityItem[]>;
    },
  });

  const getUserName = (user: any) => {
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitial = (user: any) => {
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const getUserColor = (userId: string) => {
    const colors = ['bg-pet-green', 'bg-pet-blue', 'bg-pet-orange', 'bg-pet-purple'];
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeRange = (startTime: string, duration?: number) => {
    const start = new Date(startTime);
    const startStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    if (duration) {
      const end = new Date(start.getTime() + duration * 60000);
      const endStr = end.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${startStr} - ${endStr}`;
    }
    
    return startStr;
  };

  const isToday = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  };

  const filteredActivities = activities.filter(activity => {
    switch (activeFilter) {
      case 'walks':
        return activity.type === 'walk';
      case 'feeding':
        return activity.type === 'feeding';
      case 'today':
        return isToday(activity.timestamp.toString());
      case 'week':
        return isThisWeek(activity.timestamp.toString());
      default:
        return true;
    }
  });

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp).toDateString();
    const label = isToday(activity.timestamp.toString()) ? 'Today' : 
                  new Date(activity.timestamp).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  });
    
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  const filters = [
    { key: 'all' as FilterType, label: 'All' },
    { key: 'walks' as FilterType, label: 'Walks' },
    { key: 'feeding' as FilterType, label: 'Feeding' },
    { key: 'today' as FilterType, label: 'Today' },
    { key: 'week' as FilterType, label: 'This Week' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">Activity History</h1>
            <Button variant="ghost" size="sm" data-testid="button-filter">
              <i className="fas fa-filter text-lg text-gray-600"></i>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Filter Pills */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {filters.map(filter => (
            <Button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              variant={activeFilter === filter.key ? "default" : "outline"}
              size="sm"
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeFilter === filter.key 
                  ? 'bg-pet-green text-white hover:bg-pet-green/90' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              data-testid={`button-filter-${filter.key}`}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Activity Timeline */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedActivities).length === 0 ? (
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar-alt text-gray-400 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">No activities found</h4>
                <p className="text-gray-600 text-sm">
                  {activeFilter === 'all' 
                    ? "Start tracking Buddy's activities!" 
                    : `No ${activeFilter} activities found for the selected period.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedActivities).map(([dateLabel, dayActivities]) => (
              <div key={dateLabel}>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  {dateLabel}
                </div>
                
                <div className="space-y-3">
                  {dayActivities.map((activity) => (
                    <Card key={activity.id} className="bg-white rounded-2xl shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 ${activity.type === 'walk' ? 'bg-pet-blue' : 'bg-pet-orange'} bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                            <i className={`fas ${activity.type === 'walk' ? 'fa-walking' : 'fa-utensils'} ${activity.type === 'walk' ? 'text-pet-blue' : 'text-pet-orange'}`}></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-gray-800">
                                {activity.type === 'walk' ? 'Walk' : 'Feeding'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {activity.type === 'walk' 
                                  ? formatTimeRange(activity.timestamp.toString(), (activity.data as any).duration)
                                  : formatTime(activity.timestamp.toString())
                                }
                              </div>
                            </div>
                            
                            {activity.type === 'walk' && (activity.data as any).duration && (
                              <div className="text-sm text-gray-600 mb-2">
                                Duration: {Math.floor((activity.data as any).duration)} minutes
                              </div>
                            )}
                            
                            {activity.type === 'walk' && activity.events && (
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                                <div className="flex items-center space-x-1">
                                  <i className="fas fa-tint text-yellow-500"></i>
                                  <span>{activity.events.filter(e => e.eventType === 'pee').length} pee stop{activity.events.filter(e => e.eventType === 'pee').length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <i className="fas fa-seedling text-amber-600"></i>
                                  <span>{activity.events.filter(e => e.eventType === 'poo').length} poo stop{activity.events.filter(e => e.eventType === 'poo').length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            )}
                            
                            {activity.type === 'feeding' && (
                              <div className="text-sm text-gray-600 mb-2">
                                {(activity.data as any).mealType} - {(activity.data as any).portion} portion
                                {(activity.data as any).notes && (
                                  <div className="text-sm text-gray-500 italic mt-1">
                                    "{(activity.data as any).notes}"
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 ${getUserColor(activity.user.id)} rounded-full flex items-center justify-center`}>
                                <span className="text-white text-xs font-semibold">
                                  {getUserInitial(activity.user)}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600">
                                Logged by {getUserName(activity.user)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav currentPage="activity" />
    </div>
  );
}
