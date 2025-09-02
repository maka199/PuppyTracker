import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditWalkModalProps {
  isOpen: boolean;
  onClose: () => void;
  walk: any;
}

const EditWalkModal: React.FC<EditWalkModalProps> = ({ isOpen, onClose, walk }) => {
  const { toast } = useToast();
  const [startTime, setStartTime] = useState(walk?.timestamp ? new Date(walk.timestamp).toISOString().slice(0, 16) : "");
  const [duration, setDuration] = useState(walk?.duration || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", `/api/walks/${walk.id}`,
        { startTime: new Date(startTime).toISOString(), duration: Number(duration) });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({ title: "Walk updated" });
      onClose();
    } catch (e) {
      toast({ title: "Error", description: "Failed to update walk", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Walk</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Start Time</span>
            <input
              type="datetime-local"
              className="w-full border rounded p-2 mt-1"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Duration (minutes)</span>
            <input
              type="number"
              className="w-full border rounded p-2 mt-1"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              min={1}
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-pet-blue text-white">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditWalkModal;
