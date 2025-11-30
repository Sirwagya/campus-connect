"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateEventPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_ts: "",
    end_ts: "",
    location: "",
    capacity: "",
    category: "",
    tags: "",
    color_block: "#3b82f6", // Default blue
    participation_type: "solo",
    min_team_size: "1",
    max_team_size: "1",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let image_path = null;

      // 1. Upload Image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        image_path = fileName;
      }

      // 2. Create Event
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          participation_type: formData.participation_type,
          min_team_size: parseInt(formData.min_team_size),
          max_team_size: parseInt(formData.max_team_size),
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          image_path,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      router.push("/events");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating event:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create New Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Event Title</label>
          <Input
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g. Annual Hackathon 2025"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            required
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe your event..."
            className="min-h-[150px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date & Time</label>
            <Input
              required
              type="datetime-local"
              value={formData.start_ts}
              onChange={(e) =>
                setFormData({ ...formData, start_ts: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date & Time</label>
            <Input
              type="datetime-local"
              value={formData.end_ts}
              onChange={(e) =>
                setFormData({ ...formData, end_ts: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g. Main Auditorium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Capacity (Optional)</label>
            <Input
              type="number"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: e.target.value })
              }
              placeholder="Leave empty for unlimited"
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Participation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full px-3 py-2 bg-background border rounded-md"
                value={formData.participation_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    participation_type: e.target.value,
                  })
                }
              >
                <option value="solo">Solo Only</option>
                <option value="team">Team Only</option>
                <option value="both">Solo & Team</option>
              </select>
            </div>
            {formData.participation_type !== "solo" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Team Size</label>
                  <Input
                    type="number"
                    value={formData.min_team_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_team_size: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Team Size</label>
                  <Input
                    type="number"
                    value={formData.max_team_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_team_size: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Banner Image</label>
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="flex-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Input
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="e.g. Workshop, Social, Tech"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tags (comma separated)
            </label>
            <Input
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="coding, food, music"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Fallback Color</label>
          <div className="flex gap-2">
            {[
              "#3b82f6",
              "#ef4444",
              "#10b981",
              "#f59e0b",
              "#8b5cf6",
              "#ec4899",
            ].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color_block: color })}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  formData.color_block === color
                    ? "border-black ring-2 ring-offset-2 ring-black"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <Input
              type="color"
              value={formData.color_block}
              onChange={(e) =>
                setFormData({ ...formData, color_block: e.target.value })
              }
              className="w-12 h-8 p-0 border-0"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </div>
      </form>
    </div>
  );
}
