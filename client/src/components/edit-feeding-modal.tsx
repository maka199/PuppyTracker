import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface EditFeedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeding: any;
}

export default function EditFeedingModal({ isOpen, onClose, feeding }: EditFeedingModalProps) {
  const { toast } = useToast();
  const [selectedMealType, setSelectedMealType] = useState<string>(feeding.mealType);
  const [selectedPortion, setSelectedPortion] = useState<string>(feeding.portion);
  const [notes, setNotes] = useState(feeding.notes || "");
  const [feedingTime, setFeedingTime] = useState(() => {
    const date = new Date(feeding.timestamp);
    date.setSeconds(0, 0);
    return date.toISOString().slice(0, 16);
  });

  const saveEditMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/feedings/${feeding.id}`,
        {
          mealType: selectedMealType,
          portion: selectedPortion,
          notes: notes.trim() || undefined,
          timestamp: new Date(feedingTime).toISOString(),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedings/last"] });
      toast({
        title: "Feeding Updated!",
        description: "The feeding log has been updated.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feeding log.",
        variant: "destructive",
      });
    },
  });

  if (!isOpen) return null;

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', icon: 'fa-coffee' },
    { id: 'lunch', label: 'Lunch', icon: 'fa-utensils' },
    { id: 'dinner', label: 'Dinner', icon: 'fa-moon' },
  ];
  const portions = [
    { id: 'small', label: 'Small', emoji: '🥄' },
    { id: 'regular', label: 'Regular', emoji: '🍽️' },
    { id: 'large', label: 'Large', emoji: '🍽️🍽️' },
    { id: 'treats', label: 'Treats', emoji: '🦴' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <Card className="w-full max-w-md rounded-t-3xl transform transition-transform duration-300">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">Edit Feeding</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
              data-testid="button-close-edit-feeding-modal"
            >
              <i className="fas fa-times text-xl"></i>
            </Button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Feeding Time</label>
              <input
                type="datetime-local"
                value={feedingTime}
                onChange={e => setFeedingTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-xl mb-4"
                data-testid="input-edit-feeding-time"
                max={new Date().toISOString().slice(0, 16)}
              />
            </div>
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
                    data-testid={`button-edit-meal-${mealType.id}`}
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
                    data-testid={`button-edit-portion-${portion.id}`}
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
                data-testid="textarea-edit-feeding-notes"
              />
            </div>
            <Button
              onClick={() => saveEditMutation.mutate()}
              disabled={saveEditMutation.isPending}
              className="w-full bg-pet-orange hover:bg-pet-orange/90 text-white rounded-2xl py-4 font-semibold text-lg shadow-lg"
              data-testid="button-save-edit-feeding"
            >
              {saveEditMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
