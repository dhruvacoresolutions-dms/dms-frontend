"use client"

import * as React from "react"
import { Clock, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type TimePickerProps = {
  id?: string
  /** 24-hour time string in `HH:MM` format */
  value?: string | null
  onValueChange?: (value: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  className?: string
}

const SIZE = 232
const CENTER = SIZE / 2
const OUTER_R = 92
const INNER_R = 62
const MINUTE_R = 92

const OUTER_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const INNER_HOURS = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

function split(value?: string | null): [string, string] {
  if (!value) return ["", ""]
  const [h = "", m = ""] = value.split(":")
  return [h.padStart(2, "0").slice(0, 2), m.padStart(2, "0").slice(0, 2)]
}

function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) }
}

export function TimePicker({
  id,
  value,
  onValueChange,
  placeholder = "Pick a time",
  disabled,
  hasError,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<"hour" | "minute">("hour")
  const [hour, minute] = split(value)
  const [text, setText] = React.useState(value || "")

  React.useEffect(() => {
    if (open) setView("hour")
  }, [open])

  React.useEffect(() => {
    setText(value || "")
  }, [value])

  const commitText = () => {
    if (/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(text)) {
      onValueChange?.(text)
    } else {
      setText(value || "")
    }
  }

  const handleHour = (h: string) => {
    onValueChange?.(`${h}:${minute || "00"}`)
    setView("minute")
  }

  const handleMinuteClick = (m: number) => {
    const mm = String(m).padStart(2, "0")
    onValueChange?.(`${hour || "00"}:${mm}`)
  }

  const handleMinuteRingClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - CENTER
    const y = e.clientY - rect.top - CENTER
    const angle = (Math.atan2(y, x) * 180) / Math.PI // -180..180, 0 right
    // convert: 0 deg = top? We use standard atan2 (0 right). Need map.
    let deg = angle + 90 // top = 0
    if (deg < 0) deg += 360
    const m = Math.round(deg / 6) % 60
    handleMinuteClick(m)
  }

  const handleNow = () => {
    const now = new Date()
    const h = String(now.getHours()).padStart(2, "0")
    const m = String(now.getMinutes()).padStart(2, "0")
    onValueChange?.(`${h}:${m}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative w-full", className)}>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder ?? "HH:MM"}
          value={text}
          disabled={disabled}
          aria-invalid={!!hasError}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commitText()
            }
          }}
          className={cn(
            "pr-10 font-mono tabular-nums",
            hasError && "border-destructive"
          )}
        />
        <PopoverTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              aria-label="Open time picker"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Clock className="size-4" />
            </button>
          }
        />
      </div>
      <PopoverContent
        className="w-auto overflow-hidden rounded-lg border bg-popover p-0 text-popover-foreground shadow-md"
        align="start"
        sideOffset={4}
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Select time
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("hour")}
              className={cn(
                "rounded px-2 py-0.5 font-mono text-sm tabular-nums transition-colors",
                view === "hour"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              {hour || "00"}
            </button>
            <span className="text-muted-foreground">:</span>
            <button
              type="button"
              onClick={() => setView("minute")}
              className={cn(
                "rounded px-2 py-0.5 font-mono text-sm tabular-nums transition-colors",
                view === "minute"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              {minute || "00"}
            </button>
          </div>
        </div>

        <div className="p-3">
          {view === "hour" ? (
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="mx-auto"
            >
              <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_R + 14}
                className="fill-muted/30"
              />
              {OUTER_HOURS.map((h, i) => {
                const angle = i * 30
                const pos = polar(angle, OUTER_R)
                const sel = String(h).padStart(2, "0") === hour
                return (
                  <g
                    key={`o-${h}`}
                    onClick={() => handleHour(String(h).padStart(2, "0"))}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={16}
                      className={cn(
                        "transition-colors",
                        sel ? "fill-primary" : "fill-transparent hover:fill-accent"
                      )}
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={cn(
                        "select-none text-xs font-medium",
                        sel ? "fill-primary-foreground" : "fill-foreground"
                      )}
                    >
                      {String(h).padStart(2, "0")}
                    </text>
                  </g>
                )
              })}
              {INNER_HOURS.map((h, i) => {
                const angle = i * 30
                const pos = polar(angle, INNER_R)
                const sel = String(h).padStart(2, "0") === hour
                return (
                  <g
                    key={`i-${h}`}
                    onClick={() => handleHour(String(h).padStart(2, "0"))}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={14}
                      className={cn(
                        "transition-colors",
                        sel ? "fill-primary" : "fill-transparent hover:fill-accent"
                      )}
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={cn(
                        "select-none text-[10px] font-medium",
                        sel ? "fill-primary-foreground" : "fill-muted-foreground"
                      )}
                    >
                      {String(h).padStart(2, "0")}
                    </text>
                  </g>
                )
              })}
            </svg>
          ) : (
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="mx-auto cursor-pointer"
              onClick={handleMinuteRingClick}
            >
              <circle
                cx={CENTER}
                cy={CENTER}
                r={MINUTE_R + 14}
                className="fill-muted/30"
              />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={MINUTE_R + 14}
                className="fill-none stroke-border"
                strokeWidth={1}
              />
              {/* minute ticks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = i * 6
                const outer = polar(angle, MINUTE_R + 10)
                const inner = polar(angle, MINUTE_R + 4)
                const isMajor = i % 5 === 0
                return (
                  <line
                    key={`tick-${i}`}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    className={cn(
                      "stroke-muted-foreground/40",
                      isMajor && "stroke-muted-foreground"
                    )}
                    strokeWidth={isMajor ? 2 : 1}
                  />
                )
              })}
              {Array.from({ length: 12 }).map((_, i) => {
                const m = i * 5
                const angle = i * 30
                const pos = polar(angle, MINUTE_R)
                const sel = Number(minute) === m
                return (
                  <g
                    key={`min-${m}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMinuteClick(m)
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={16}
                      className={cn(
                        "transition-colors",
                        sel ? "fill-primary" : "fill-transparent hover:fill-accent"
                      )}
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={cn(
                        "select-none text-xs font-medium",
                        sel ? "fill-primary-foreground" : "fill-foreground"
                      )}
                    >
                      {String(m).padStart(2, "0")}
                    </text>
                  </g>
                )
              })}
              {/* hand */}
              {(() => {
                const m = Number(minute || 0)
                const angle = m * 6
                const tip = polar(angle, MINUTE_R)
                return (
                  <g>
                    <line
                      x1={CENTER}
                      y1={CENTER}
                      x2={tip.x}
                      y2={tip.y}
                      className="stroke-primary"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                    <circle
                      cx={tip.x}
                      cy={tip.y}
                      r={16}
                      className="fill-primary"
                    />
                    <text
                      x={tip.x}
                      y={tip.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="select-none text-xs font-medium fill-primary-foreground"
                    >
                      {String(m).padStart(2, "0")}
                    </text>
                    <circle
                      cx={CENTER}
                      cy={CENTER}
                      r={4}
                      className="fill-primary"
                    />
                  </g>
                )
              })()}
            </svg>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-2 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleNow}
          >
            <RotateCcw className="size-3.5" />
            Now
          </Button>
          <span className="text-[11px] text-muted-foreground">
            24-hour · click ring for exact minute
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}