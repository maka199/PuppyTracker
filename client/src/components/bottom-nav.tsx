import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface BottomNavProps {
  currentPage: 'home' | 'activity' | 'stats' | 'profile';
}

export default function BottomNav({ currentPage }: BottomNavProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'fa-home',
      path: '/',
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: 'fa-list',
      path: '/activity',
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: 'fa-chart-line',
      path: '/stats',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'fa-user',
      path: '/profile',
    },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.id === 'stats') {
      // Stats screen is not implemented yet
      alert(`${item.label} screen coming soon!`);
      return;
    }
    setLocation(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-around">
        {navItems.map(item => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => handleNavClick(item)}
            className={`flex flex-col items-center space-y-1 py-2 px-4 ${
              currentPage === item.id ? 'text-pet-green' : 'text-gray-400'
            }`}
            data-testid={`button-nav-${item.id}`}
          >
            <i className={`fas ${item.icon} text-xl`}></i>
            <span className="text-xs font-medium">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
