import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateWebinarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateWebinarDialog = ({ open, onOpenChange, onSuccess }: CreateWebinarDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    faculty_name: "",
    webinar_date: "",
    webinar_time: "",
    meeting_link: "",
  });

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

    // Validate URL
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from("webinars").insert({
        title: formData.title.trim(),
        description: formData.description.trim(),
        faculty_name: formData.faculty_name.trim() || user.user_metadata?.full_name || "Faculty",
        webinar_date: formData.webinar_date,
        webinar_time: formData.webinar_time,
        meeting_link: formData.meeting_link.trim(),
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Webinar scheduled successfully!",
      });

      setFormData({ title: "", description: "", faculty_name: "", webinar_date: "", webinar_time: "", meeting_link: "" });
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule New Webinar</DialogTitle>
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
              Schedule Webinar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
