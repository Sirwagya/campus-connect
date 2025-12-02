"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Upload } from "lucide-react";
import { FormField } from "./FormBuilder";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type {
  EventRegistrationFormData,
  EventRegistrationFormValue,
} from "@/types/events";

export type FormValue = EventRegistrationFormValue;
export type FormState = EventRegistrationFormData;

interface DynamicFormProps {
  schema: FormField[];
  eventId: string;
  onSubmit: (data: FormState) => Promise<void>;
  isSubmitting?: boolean;
}

export function DynamicForm({
  schema,
  eventId,
  onSubmit,
  isSubmitting = false,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<FormState>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const supabase = createBrowserSupabase();

  const handleChange = (id: string, value: FormValue) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileUpload = async (id: string, file: File) => {
    setUploading((prev) => ({ ...prev, [id]: true }));
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${eventId}/${crypto.randomUUID()}.${fileExt}`;
      const { error } = await supabase.storage
        .from("event-uploads")
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("event-uploads")
        .getPublicUrl(fileName);
      handleChange(id, data.publicUrl);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("File upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Basic validation
    for (const field of schema) {
      if (field.required && !formData[field.id]) {
        alert(`${field.label} is required`);
        return;
      }
    }
    onSubmit(formData);
  };

  if (schema.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {schema.map((field) => (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-medium">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>

          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}

          {field.type === "text" && (
            <input
              type="text"
              required={field.required}
              className="w-full px-3 py-2 bg-background border rounded-md"
              onChange={(event) => handleChange(field.id, event.target.value)}
            />
          )}

          {field.type === "textarea" && (
            <textarea
              required={field.required}
              className="w-full px-3 py-2 bg-background border rounded-md min-h-[100px]"
              onChange={(event) => handleChange(field.id, event.target.value)}
            />
          )}

          {field.type === "number" && (
            <input
              type="number"
              required={field.required}
              className="w-full px-3 py-2 bg-background border rounded-md"
              onChange={(event) => {
                const value = event.target.value;
                handleChange(
                  field.id,
                  value === "" ? "" : Number(value)
                );
              }}
            />
          )}

          {field.type === "date" && (
            <input
              type="date"
              required={field.required}
              className="w-full px-3 py-2 bg-background border rounded-md"
              onChange={(event) => handleChange(field.id, event.target.value)}
            />
          )}

          {field.type === "dropdown" && (
            <select
              required={field.required}
              className="w-full px-3 py-2 bg-background border rounded-md"
              onChange={(event) => handleChange(field.id, event.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                Select an option
              </option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {field.type === "file" && (
            <div className="flex items-center gap-4">
              <input
                type="file"
                required={field.required && !formData[field.id]}
                className="hidden"
                id={`file-${field.id}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(field.id, file);
                }}
              />
              <label
                htmlFor={`file-${field.id}`}
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-secondary"
              >
                <Upload className="w-4 h-4" />
                {formData[field.id] ? "File Uploaded" : "Upload File"}
              </label>
              {uploading[field.id] && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {typeof formData[field.id] === "string" && (
                <a
                  href={formData[field.id] as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  View File
                </a>
              )}
            </div>
          )}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : null}
        Submit Registration
      </Button>
    </form>
  );
}
