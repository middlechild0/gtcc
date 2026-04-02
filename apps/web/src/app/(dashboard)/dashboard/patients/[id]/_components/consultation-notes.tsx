"use client";

import { Button } from "@visyx/ui/button";
import { useToast } from "@visyx/ui/use-toast";
import { useEffect, useState } from "react";
import { trpc } from "@/trpc/client";

interface ConsultationNotesProps {
  visitId: string;
  existingNotes: string | null;
  visitStatus: string;
}

export function ConsultationNotes({
  visitId,
  existingNotes,
  visitStatus,
}: ConsultationNotesProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState(existingNotes ?? "");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setNotes(existingNotes ?? "");
    setIsDirty(false);
  }, [existingNotes, visitId]);

  const saveNotes = trpc.queue.saveConsultationNotes.useMutation({
    onSuccess: async () => {
      toast({
        title: "Consultation notes saved",
        description: "The visit notes were updated successfully.",
      });
      setIsDirty(false);
      await utils.patients.getVisitHistory.invalidate();
    },
    onError: (err) => {
      toast({
        title: "Failed to save notes",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const isEditable = visitStatus === "IN_PROGRESS";

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Consultation Notes</h3>
        {!isEditable ? (
          <span className="text-xs text-muted-foreground">
            Move visit to IN_PROGRESS to edit notes
          </span>
        ) : null}
      </div>

      <textarea
        className="min-h-[160px] w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Enter clinical observations, findings, and diagnosis..."
        value={notes}
        disabled={!isEditable || saveNotes.isPending}
        onChange={(event) => {
          setNotes(event.target.value);
          setIsDirty(true);
        }}
      />

      {isEditable ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={
              !isDirty || saveNotes.isPending || notes.trim().length === 0
            }
            onClick={() =>
              saveNotes.mutate({
                visitId,
                notes: notes.trim(),
              })
            }
          >
            {saveNotes.isPending ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
