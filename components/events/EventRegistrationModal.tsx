"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DynamicForm } from "./DynamicForm";
import type { FormState } from "./DynamicForm";
import { TeamManager } from "./TeamManager";
import { FormField } from "./FormBuilder";
import { Loader2, Users, User } from "lucide-react";
import { useRouter } from "next/navigation";
import type {
  EventParticipationType,
  EventRegistrationPayload,
  TeamMemberInput,
} from "@/types/events";

interface TeamState {
  name: string;
  code: string;
  members: TeamMemberInput[];
}

interface EventRegistrationModalProps {
  eventId: string;
  isRegistered: boolean;
  isFull: boolean;
  participationType: EventParticipationType;
  minTeamSize: number;
  maxTeamSize: number;
}

export function EventRegistrationModal({
  eventId,
  isRegistered,
  isFull,
  participationType,
  minTeamSize,
  maxTeamSize,
}: EventRegistrationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"type" | "team" | "form">("type");
  const [selectedType, setSelectedType] = useState<
    Exclude<EventParticipationType, "both">
  >("solo");
  const [teamAction, setTeamAction] = useState<"create" | "join">("create");
  const [teamData, setTeamData] = useState<TeamState>({
    name: "",
    code: "",
    members: [],
  });
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setLoadingSchema(true);
      fetch(`/api/events/${eventId}/form`)
        .then((res) => res.json())
        .then((data) => {
          setFormSchema(data.schema || []);
          // If only solo is allowed, skip type selection
          if (participationType === "solo") {
            setSelectedType("solo");
            setStep(data.schema?.length ? "form" : "form"); // Go to form even if empty to confirm?
          }
          // If only team is allowed, skip type selection
          else if (participationType === "team") {
            setSelectedType("team");
            setStep("team");
          }
        })
        .finally(() => setLoadingSchema(false));
    }
  }, [isOpen, eventId, participationType]);

  const handleTeamChange = (name: string, members: TeamMemberInput[]) => {
    setTeamData((prev) => ({ ...prev, name, members }));
  };

  const handleSubmit = async (formData: FormState) => {
    setSubmitting(true);
    try {
      const payload: EventRegistrationPayload = {
        participationType: selectedType,
        teamAction: selectedType === "team" ? teamAction : undefined,
        teamName: teamData.name || undefined,
        teamCode: teamData.code || undefined,
        members:
          selectedType === "team" && teamAction === "create"
            ? teamData.members
            : undefined,
        formData,
      };

      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data?.error || "Registration failed");
      }

      setIsOpen(false);
      router.refresh();
      alert("Registration successful!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Registration failed";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnregister = async () => {
    if (!confirm("Are you sure you want to unregister?")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unregister");
      router.refresh();
      alert("Unregistered successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to unregister";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isRegistered) {
    return (
      <Button
        variant="outline"
        className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
        onClick={handleUnregister}
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <span className="mr-2">✓</span>
        )}
        Registered
      </Button>
    );
  }

  if (isFull) {
    return <Button disabled>Event Full</Button>;
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Register Now</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Event Registration"
      >
        {loadingSchema ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {step === "type" && participationType === "both" && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`p-6 border rounded-xl flex flex-col items-center gap-3 hover:bg-secondary transition-colors ${
                    selectedType === "solo"
                      ? "border-primary bg-secondary/50"
                      : ""
                  }`}
                  onClick={() => setSelectedType("solo")}
                >
                  <User className="w-8 h-8" />
                  <span className="font-medium">Solo</span>
                </button>
                <button
                  className={`p-6 border rounded-xl flex flex-col items-center gap-3 hover:bg-secondary transition-colors ${
                    selectedType === "team"
                      ? "border-primary bg-secondary/50"
                      : ""
                  }`}
                  onClick={() => setSelectedType("team")}
                >
                  <Users className="w-8 h-8" />
                  <span className="font-medium">Team</span>
                </button>
                <Button
                  className="col-span-2"
                  onClick={() =>
                    setStep(selectedType === "team" ? "team" : "form")
                  }
                >
                  Next
                </Button>
              </div>
            )}

            {step === "team" && (
              <div className="space-y-4">
                <div className="flex gap-4 border-b pb-4">
                  <button
                    className={`text-sm font-medium pb-1 ${
                      teamAction === "create"
                        ? "border-b-2 border-primary"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setTeamAction("create")}
                  >
                    Create Team
                  </button>
                  <button
                    className={`text-sm font-medium pb-1 ${
                      teamAction === "join"
                        ? "border-b-2 border-primary"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setTeamAction("join")}
                  >
                    Join Team
                  </button>
                </div>

                {teamAction === "create" ? (
                  <TeamManager
                    minSize={minTeamSize || 1}
                    maxSize={maxTeamSize || 5}
                    onTeamChange={handleTeamChange}
                  />
                ) : (
                  <div>
                    <label className="text-sm font-medium">Team Code</label>
                    <input
                      type="text"
                      className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
                      placeholder="Enter 6-digit code"
                      value={teamData.code}
                      onChange={(e) =>
                        setTeamData({ ...teamData, code: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setStep(participationType === "both" ? "type" : "type")
                    }
                  >
                    Back
                  </Button>
                  <Button onClick={() => setStep("form")}>Next</Button>
                </div>
              </div>
            )}

            {step === "form" && (
              <div>
                <DynamicForm
                  schema={formSchema}
                  eventId={eventId}
                  onSubmit={handleSubmit}
                  isSubmitting={submitting}
                />
                {formSchema.length === 0 && (
                  <div className="space-y-4">
                    <p>No additional details required.</p>
                    <Button
                      onClick={() => handleSubmit({})}
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin mr-2" />
                      ) : null}
                      Confirm Registration
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
