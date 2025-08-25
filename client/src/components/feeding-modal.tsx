import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface FeedingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedingModal({ isOpen, onClose }: FeedingModalProps) {
  const { toast } = useToast();
  const [selectedMealType, setSelectedMealType] = useState<string>('lunch');
  const [selectedPortion, setSelectedPortion] = useState<string>('regular');
  const [notes, setNotes] = useState('');

  const saveFeedingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/feedings", {
        mealType: selectedMealType,
        portion: selectedPortion,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedings/last"] });
      toast({
        title: "Feeding Logged!",
        description: "Buddy's meal has been recorded.",
      });
      handleClose();
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
        description: "Failed to log feeding",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSelectedMealType('lunch');
    setSelectedPortion('regular');
    setNotes('');
    onClose();
  };

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', icon: 'fa-sun' },
    { id: 'lunch', label: 'Lunch', icon: 'fa-utensils' },
    { id: 'dinner', label: 'Dinner', icon: 'fa-moon' },
  ];

  const portions = [
    { id: 'small', label: 'Small', emoji: '🥄' },
    { id: 'regular', label: 'Regular', emoji: '🍽️' },
    { id: 'large', label: 'Large', emoji: '🍽️🍽️' },
    { id: 'treats', label: 'Treats', emoji: '🦴' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <Card className="w-full max-w-md rounded-t-3xl transform transition-transform duration-300">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">Log Feeding</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600"
              data-testid="button-close-feeding-modal"
            >
              <i className="fas fa-times text-xl"></i>
            </Button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Meal Type</label>
              <div className="grid grid-cols-3 gap-3">
                {mealTypes.map(mealType => (
                  <Button
                    key={mealType.id}
                    onClick={() => setSelectedMealType(mealType.id)}
                    variant="outline"
                    className={`p-3 h-auto flex flex-col items-center space-y-1 transition-colors ${
                      selectedMealType === mealType.id
                        ? 'border-pet-orange bg-pet-orange bg-opacity-10'
                        : 'border-gray-200 hover:border-pet-orange'
                    }`}
                    data-testid={`button-meal-${mealType.id}`}
                  >
                    <i className={`fas ${mealType.icon} text-pet-orange text-xl`}></i>
                    <div className="text-sm font-medium">{mealType.label}</div>
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Portion Size</label>
              <div className="grid grid-cols-4 gap-2">
                {portions.map(portion => (
                  <Button
                    key={portion.id}
                    onClick={() => setSelectedPortion(portion.id)}
                    variant="outline"
                    className={`p-3 h-auto flex flex-col items-center space-y-1 transition-colors ${
                      selectedPortion === portion.id
                        ? 'border-pet-green bg-pet-green bg-opacity-10'
                        : 'border-gray-200 hover:border-pet-green'
                    }`}
                    data-testid={`button-portion-${portion.id}`}
                  >
                    <div className="text-lg">{portion.emoji}</div>
                    <div className="text-xs">{portion.label}</div>
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes..."
                className="w-full p-3 border border-gray-300 rounded-xl resize-none"
                rows={3}
                data-testid="textarea-feeding-notes"
              />
            </div>
            
            <Button
              onClick={() => saveFeedingMutation.mutate()}
              disabled={saveFeedingMutation.isPending}
              className="w-full bg-pet-orange hover:bg-pet-orange/90 text-white rounded-2xl py-4 font-semibold text-lg shadow-lg"
              data-testid="button-save-feeding"
            >
              {saveFeedingMutation.isPending ? 'Logging...' : 'Log Feeding'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
