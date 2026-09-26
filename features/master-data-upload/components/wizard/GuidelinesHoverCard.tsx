"use client"

import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

const GUIDELINES = [
  "Download the template for the selected master data type before uploading.",
  "Supported formats: .xlsx, .csv with a maximum size of 10 MB.",
  "Keep the template's column headers unchanged and upload one master type per file.",
  "The file is validated right after upload; track progress in Upload History below.",
]

/** "Guidelines" hover trigger for the upload card header. No props. */
export function GuidelinesHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground"
          >
            <Info className="mr-1.5 size-4" />
            Guidelines
          </Button>
        }
      />
      <HoverCardContent side="bottom" align="end" className="w-80">
        <p className="mb-1.5 font-medium">Upload Guidelines</p>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
          {GUIDELINES.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ol>
      </HoverCardContent>
    </HoverCard>
  )
}
