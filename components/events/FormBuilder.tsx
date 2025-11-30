"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "dropdown"
  | "file"
  | "textarea";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[]; // For dropdowns
  description?: string;
}

interface FormBuilderProps {
  initialSchema?: FormField[];
  onSave: (schema: FormField[]) => Promise<void>;
}

export function FormBuilder({ initialSchema = [], onSave }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialSchema);
  const [isSaving, setIsSaving] = useState(false);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: `New ${type} field`,
      required: false,
      options: type === "dropdown" ? ["Option 1", "Option 2"] : undefined,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(fields);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Registration Form Builder</h3>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Form
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-card border rounded-lg p-4 space-y-4 relative group"
          >
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeField(field.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Label</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    updateField(field.id, { label: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
                />
              </div>

              <div className="flex items-center gap-4 mt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateField(field.id, { required: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  Required
                </label>
                <span className="text-xs px-2 py-1 bg-secondary rounded uppercase">
                  {field.type}
                </span>
              </div>

              {field.type === "dropdown" && (
                <div className="col-span-full">
                  <label className="text-sm font-medium">
                    Options (comma separated)
                  </label>
                  <input
                    type="text"
                    value={field.options?.join(", ")}
                    onChange={(e) =>
                      updateField(field.id, {
                        options: e.target.value.split(",").map((s) => s.trim()),
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              <div className="col-span-full">
                <label className="text-sm font-medium">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={field.description || ""}
                  onChange={(e) =>
                    updateField(field.id, { description: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
                  placeholder="Help text for the user"
                />
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
            No fields added yet. Add fields to build your form.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={() => addField("text")}>
          <Plus className="w-4 h-4 mr-2" /> Text
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addField("textarea")}
        >
          <Plus className="w-4 h-4 mr-2" /> Long Text
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField("number")}>
          <Plus className="w-4 h-4 mr-2" /> Number
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField("date")}>
          <Plus className="w-4 h-4 mr-2" /> Date
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addField("dropdown")}
        >
          <Plus className="w-4 h-4 mr-2" /> Dropdown
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField("file")}>
          <Plus className="w-4 h-4 mr-2" /> File Upload
        </Button>
      </div>
    </div>
  );
}
