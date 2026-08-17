import { useState, useEffect } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any; // Add initialData prop
}

export const CreateEventDialog = ({ open, onOpenChange, onSuccess, initialData }: CreateEventDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    club_name: "",
    event_date: "",
    event_time: "",
    venue: "",
    max_participants: "",
    registration_required: true,
  });

  // Populate form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        club_name: initialData.club_name || "",
        event_date: initialData.event_date || "",
        event_time: initialData.event_time || "",
        venue: initialData.venue || "",
        max_participants: initialData.max_participants ? initialData.max_participants.toString() : "",
        registration_required: initialData.registration_required !== false,
      });
    } else {
      // Reset form if opening in create mode
      setFormData({
        title: "",
        description: "",
        club_name: "",
        event_date: "",
        event_time: "",
        venue: "",
        max_participants: "",
        registration_required: true,
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.club_name.trim() || !formData.event_date || !formData.event_time || !formData.venue.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedDateTime = new Date(`${formData.event_date}T${formData.event_time}`);
    const now = new Date();

    if (selectedDateTime < now) {
      toast({
        title: "Validation Error",
        description: "Event date and time cannot be in the past.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in.");
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        club_name: formData.club_name,
        event_date: formData.event_date,
        event_time: formData.event_time,
        venue: formData.venue,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_required: formData.registration_required,
      };

      if (initialData) {
        // Update existing event
        await updateDoc(doc(db, "events", initialData.id), eventData);
        toast({ title: "Success", description: "Event updated successfully!" });
      } else {
        // Create new event
        await addDoc(collection(db, "events"), {
          ...eventData,
          created_at: new Date().toISOString(),
          created_by: user.uid,
          registered_users: []
        });
        toast({ title: "Success", description: "Event created successfully!" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save event.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Event" : "Create New Event"}</DialogTitle>
          <DialogDescription>
            Schedule a new event for students to register.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Event Title *</Label>
            <Input
              id="event-title"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="club-name">Club/Organization Name *</Label>
            <Input
              id="club-name"
              placeholder="Enter club name"
              value={formData.club_name}
              onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">Date *</Label>
              <Input
                id="event-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-time">Time *</Label>
              <Input
                id="event-time"
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Venue *</Label>
            <Input
              id="venue"
              placeholder="Enter venue"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              maxLength={200}
            />
          </div>



          <div className="space-y-2">
            <Label htmlFor="max-participants">Max Participants (optional)</Label>
            <Input
              id="max-participants"
              type="number"
              placeholder="Leave empty for unlimited"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
              min={1}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="registration-required"
              checked={formData.registration_required}
              onCheckedChange={(checked) => setFormData({ ...formData, registration_required: checked })}
            />
            <Label htmlFor="registration-required">Registration Required</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter event description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="btn-primary-gradient">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

