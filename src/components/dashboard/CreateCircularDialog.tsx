import { useState, useEffect } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { MultiSelect } from "@/components/ui/multi-select";

interface CreateCircularDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

const departments = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Academic Office",
  "Library",
  "Administration",
  "Sports",
];

const departmentOptions = [
  { label: "All Departments", value: "All Departments" },
  ...departments.map(d => ({ label: d, value: d }))
];

const circularTypes = [
  { value: "general", label: "General" },
  { value: "important", label: "Important" },
  { value: "event", label: "Event" },
  { value: "notice", label: "Notice" },
];

export const CreateCircularDialog = ({ open, onOpenChange, onSuccess, initialData }: CreateCircularDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    department: string[];
    type: string;
  }>({
    title: "",
    content: "",
    department: [],
    type: "general",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        department: initialData.department ? (Array.isArray(initialData.department) ? initialData.department : [initialData.department]) : [],
        type: initialData.type || "general",
      });
    } else {
      setFormData({ title: "", content: "", department: [], type: "general" });
    }
  }, [initialData, open]);

  const handleDepartmentChange = (selected: string[]) => {
    // Check if "All Departments" was just selected
    const wasAllSelected = formData.department.includes("All Departments");
    const isAllSelected = selected.includes("All Departments");

    if (!wasAllSelected && isAllSelected) {
      // "All Departments" was just clicked -> Clear others
      setFormData({ ...formData, department: ["All Departments"] });
    } else if (wasAllSelected && isAllSelected && selected.length > 1) {
      // "All Departments" was already there, but user clicked something else -> Remove "All Departments"
      setFormData({ ...formData, department: selected.filter(d => d !== "All Departments") });
    } else if (wasAllSelected && !isAllSelected) {
      // User explicitly removed "All Departments"
      setFormData({ ...formData, department: [] });
    } else {
      // Normal multi-select behavior
      setFormData({ ...formData, department: selected });
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || formData.department.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title and at least one Department).",
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

      const circularData = {
        title: formData.title,
        content: formData.content,
        department: formData.department,
        type: formData.type,
      };

      if (initialData) {
        await updateDoc(doc(db, "circulars", initialData.id), circularData);
        toast({ title: "Success", description: "Circular updated successfully!" });
      } else {
        await addDoc(collection(db, "circulars"), {
          ...circularData,
          created_at: new Date().toISOString(),
          created_by: user.uid,
          author_name: user.displayName || "Unknown"
        });
        toast({ title: "Success", description: "Circular posted successfully!" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating circular:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post circular.",
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
          <DialogTitle>{initialData ? "Edit Circular" : "Post New Circular"}</DialogTitle>
          <DialogDescription>
            Create a new circular to share with students and faculty.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter circular title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Department *</Label>

            <MultiSelect
              options={departmentOptions}
              selected={formData.department}
              onChange={handleDepartmentChange}
              placeholder="Select departments..."
            />
          </div>



          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {circularTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Enter circular content..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="btn-primary-gradient">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? "Update Circular" : "Post Circular"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog >
  );
};

