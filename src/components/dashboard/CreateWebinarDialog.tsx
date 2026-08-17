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

interface CreateWebinarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export const CreateWebinarDialog = ({ open, onOpenChange, onSuccess, initialData }: CreateWebinarDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    faculty_name: "",
    webinar_date: "",
    webinar_time: "",
    meeting_link: "",
    max_participants: "",
    registration_required: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        faculty_name: initialData.faculty_name || "",
        webinar_date: initialData.webinar_date || "",
        webinar_time: initialData.webinar_time || "",
        meeting_link: initialData.meeting_link || "",
        max_participants: initialData.max_participants ? initialData.max_participants.toString() : "",
        registration_required: initialData.registration_required !== false,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        faculty_name: "",
        webinar_date: "",
        webinar_time: "",
        meeting_link: "",
        max_participants: "",
        registration_required: true,
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.webinar_date || !formData.webinar_time || !formData.meeting_link.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedDateTime = new Date(`${formData.webinar_date}T${formData.webinar_time}`);
    const now = new Date();

    if (selectedDateTime < now) {
      toast({
        title: "Validation Error",
        description: "Webinar date and time cannot be in the past.",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(formData.meeting_link);
    } catch {
      toast({
        title: "Validation Error",
        description: "Please enter a valid meeting link URL.",
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

      const webinarData = {
        title: formData.title,
        description: formData.description,
        faculty_name: formData.faculty_name,
        webinar_date: formData.webinar_date,
        webinar_time: formData.webinar_time,
        meeting_link: formData.meeting_link,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_required: formData.registration_required,
      };

      if (initialData) {
        await updateDoc(doc(db, "webinars", initialData.id), webinarData);
        toast({ title: "Success", description: "Webinar updated successfully!" });
      } else {
        await addDoc(collection(db, "webinars"), {
          ...webinarData,
          created_at: new Date().toISOString(),
          created_by: user.uid,
          registered_users: []
        });
        toast({ title: "Success", description: "Webinar scheduled successfully!" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule webinar.",
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
          <DialogTitle>{initialData ? "Edit Webinar" : "Schedule New Webinar"}</DialogTitle>
          <DialogDescription>
            Create a new webinar session for students.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webinar-title">Webinar Title *</Label>
            <Input
              id="webinar-title"
              placeholder="Enter webinar title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty-name">Faculty Name</Label>
            <Input
              id="faculty-name"
              placeholder="Enter faculty name (optional)"
              value={formData.faculty_name}
              onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="webinar-date">Date *</Label>
              <Input
                id="webinar-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.webinar_date}
                onChange={(e) => setFormData({ ...formData, webinar_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webinar-time">Time *</Label>
              <Input
                id="webinar-time"
                type="time"
                value={formData.webinar_time}
                onChange={(e) => setFormData({ ...formData, webinar_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-link">Meeting Link *</Label>
            <Input
              id="meeting-link"
              type="url"
              placeholder="https://meet.google.com/..."
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
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
            <Label htmlFor="webinar-description">Description</Label>
            <Textarea
              id="webinar-description"
              placeholder="Enter webinar description..."
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
              {initialData ? "Update Webinar" : "Schedule Webinar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

