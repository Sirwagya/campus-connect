"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, use } from "react";
import Image from "next/image";
import { Event } from "@/types/events";
import type { EventParticipationType } from "@/types/events";
import { FormBuilder, FormField } from "@/components/events/FormBuilder";
import { notFound } from "next/navigation";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Event>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string>("");

  const [tagsInput, setTagsInput] = useState("");
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(true);

  const isParticipationType = (
    value: string
  ): value is EventParticipationType =>
    value === "solo" || value === "team" || value === "both";

  const participationValue: EventParticipationType =
    formData.participation_type &&
    isParticipationType(formData.participation_type)
      ? formData.participation_type
      : "solo";
  const showTeamSettings =
    participationValue === "team" || participationValue === "both";

  const fetchForm = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/form`);
      const data = (await res.json()) as { schema?: FormField[] };
      setFormSchema(data.schema || []);
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setLoadingSchema(false);
    }
  }, []);

  const fetchEvent = useCallback(
    async (id: string) => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) notFound();

        const eventData = data as Event;

        setFormData({
          ...eventData,
          start_ts: new Date(eventData.start_ts).toISOString().slice(0, 16), // Format for datetime-local
          end_ts: eventData.end_ts
            ? new Date(eventData.end_ts).toISOString().slice(0, 16)
            : "",
        });

        if (eventData.tags && Array.isArray(eventData.tags)) {
          setTagsInput(eventData.tags.join(", "));
        }

        if (eventData.image_path) {
          setImagePreview(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-banners/${eventData.image_path}`
          );
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    setEventId(id);
    void fetchEvent(id);
    void fetchForm(id);
  }, [id, fetchEvent, fetchForm]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleParticipationChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { value } = event.target;
    if (isParticipationType(value)) {
      setFormData({ ...formData, participation_type: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let image_path = formData.image_path;

      // 1. Upload new Image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        image_path = fileName;
      }

      // 2. Update Event
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? Number(formData.capacity) : null,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          image_path,
          participation_type: formData.participation_type,
          min_team_size: formData.min_team_size,
          max_team_size: formData.max_team_size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update event");
      }

      router.push("/admin/events");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update event";
      console.error("Error updating event:", error);
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForm = async (schema: FormField[]) => {
    try {
      const res = await fetch(`/api/events/${eventId}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema }),
      });

      if (!res.ok) throw new Error("Failed to save form");
      alert("Form saved successfully");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save form";
      alert(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Edit Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Event Title</label>
          <Input
            required
            value={formData.title || ""}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            required
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="min-h-[150px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date & Time</label>
            <Input
              required
              type="datetime-local"
              value={formData.start_ts || ""}
              onChange={(e) =>
                setFormData({ ...formData, start_ts: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date & Time</label>
            <Input
              type="datetime-local"
              value={formData.end_ts || ""}
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
              value={formData.location || ""}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Capacity (Optional)</label>
            <Input
              type="number"
              value={formData.capacity || ""}
              onChange={(e) =>
                setFormData({ ...formData, capacity: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Banner Image</label>
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setFormData({ ...formData, image_path: null });
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
              value={formData.category || ""}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tags (comma separated)
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
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
              value={formData.color_block || "#3b82f6"}
              onChange={(e) =>
                setFormData({ ...formData, color_block: e.target.value })
              }
              className="w-12 h-8 p-0 border-0"
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
                value={participationValue}
                onChange={handleParticipationChange}
              >
                <option value="solo">Solo Only</option>
                <option value="team">Team Only</option>
                <option value="both">Solo & Team</option>
              </select>
            </div>
            {showTeamSettings && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Team Size</label>
                  <Input
                    type="number"
                    value={formData.min_team_size || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_team_size: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Team Size</label>
                  <Input
                    type="number"
                    value={formData.max_team_size || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_team_size: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>

      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Registration Form</h2>
        {!loadingSchema && (
          <FormBuilder initialSchema={formSchema} onSave={handleSaveForm} />
        )}
      </div>
    </div>
  );
}
