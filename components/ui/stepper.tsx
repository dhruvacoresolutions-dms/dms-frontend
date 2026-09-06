"use client"

import * as React from "react"
import { Check, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepDefinition = {
  id: string
  title: string
  description?: string
  optional?: boolean
  icon?: React.ReactNode
}

export type StepState = "completed" | "current" | "upcoming" | "error"

type StepperOrientation = "horizontal" | "vertical"
type StepperVariant = "default" | "compact"

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: StepDefinition[]
  currentStep: number // 0-indexed
  onStepChange?: (stepIndex: number) => void
  orientation?: StepperOrientation
  variant?: StepperVariant
  linear?: boolean
  errorSteps?: number[]
}

// ---------------------------------------------------------------------------
// Context (for compositional usage if needed)
// ---------------------------------------------------------------------------

type StepperContextValue = {
  currentStep: number
  orientation: StepperOrientation
  linear: boolean
  onStepChange?: (stepIndex: number) => void
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

function useStepperContext() {
  const ctx = React.useContext(StepperContext)
  if (!ctx) throw new Error("Stepper compound components must be used within <Stepper>")
  return ctx
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStepState(
  index: number,
  currentStep: number,
  errorSteps: number[] = []
): StepState {
  if (errorSteps.includes(index)) return "error"
  if (index < currentStep) return "completed"
  if (index === currentStep) return "current"
  return "upcoming"
}

// ---------------------------------------------------------------------------
// Root Component
// ---------------------------------------------------------------------------

function Stepper({
  steps,
  currentStep,
  onStepChange,
  orientation = "horizontal",
  variant = "default",
  linear = true,
  errorSteps = [],
  className,
  ...props
}: StepperProps) {
  const isVertical = orientation === "vertical"

  return (
    <StepperContext.Provider
      value={{ currentStep, orientation, linear, onStepChange }}
    >
      <div
        data-slot="stepper"
        data-orientation={orientation}
        data-variant={variant}
        role="navigation"
        aria-label="Progress"
        className={cn(
          "w-full",
          isVertical ? "flex flex-col" : "flex flex-col",
          className
        )}
        {...props}
      >
        {/* keyframes for shimmer used in connectors & progress bar */}
        <style>{`@keyframes stepper-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
        <ol
          data-slot="stepper-list"
          className={cn(
            "flex w-full list-none",
            isVertical
              ? "flex-col gap-0"
              : "flex-row items-center justify-between gap-0",
            variant === "compact" && !isVertical && "gap-1"
          )}
        >
          {steps.map((step, index) => {
            const state = getStepState(index, currentStep, errorSteps)
            const isLast = index === steps.length - 1
            const isClickable =
              !!onStepChange && (!linear || index <= currentStep || state === "completed")

            return (
              <li
                key={step.id}
                data-slot="stepper-item"
                data-state={state}
                data-orientation={orientation}
                className={cn(
                  "group flex flex-1 flex-col",
                  isVertical
                    ? "flex-row gap-3 pb-6 last:pb-0"
                    : "items-center text-center",
                  !isVertical && isLast && "flex-none sm:flex-1",
                  isVertical && "relative"
                )}
              >
                {/* Vertical connector line - never red on validation error, keep muted */}
                {isVertical && !isLast && (
                  <span
                    data-slot="stepper-vertical-separator"
                    aria-hidden
                    className={cn(
                      "absolute left-[17px] top-[36px] h-[calc(100%-8px)] w-[2px] rounded-full transition-colors duration-300",
                      state === "completed" ? "bg-primary" : "bg-muted"
                    )}
                  >
                    {(state === "completed" || state === "current") && (
                      <span
                        className={cn(
                          "absolute inset-0 rounded-full bg-primary transition-all duration-500",
                          state === "completed" ? "h-full" : "h-0"
                        )}
                      />
                    )}
                  </span>
                )}

                {isVertical ? (
                  <div className="flex flex-row items-start gap-3">
                    {/* Indicator */}
                    <button
                      type="button"
                      data-slot="stepper-trigger"
                      data-state={state}
                      aria-current={state === "current" ? "step" : undefined}
                      aria-label={`${step.title}${state === "completed" ? " completed" : state === "current" ? " current" : ""}`}
                      disabled={!isClickable}
                      onClick={() => {
                        if (isClickable) onStepChange?.(index)
                      }}
                      className={cn(
                        "relative flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        state === "completed" &&
                          "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20",
                        state === "current" &&
                          "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-[6px] ring-primary/15 scale-105",
                        state === "upcoming" &&
                          "border-muted-foreground/20 bg-muted text-muted-foreground",
                        state === "error" &&
                          "border-destructive bg-destructive text-destructive-foreground shadow-md",
                        isClickable
                          ? "cursor-pointer hover:scale-105 hover:shadow-lg"
                          : "cursor-default",
                        !isClickable && state === "upcoming" && "opacity-80"
                      )}
                    >
                      {state === "current" && (
                        <span
                          aria-hidden
                          className="absolute inset-0 -z-10 rounded-full bg-primary/20 animate-ping [animation-duration:2s]"
                        />
                      )}
                      {state === "completed" ? (
                        <Check className="size-4" strokeWidth={2.5} aria-hidden />
                      ) : state === "error" ? (
                        <AlertCircle className="size-4" aria-hidden />
                      ) : step.icon ? (
                        <span className="size-4 [&_svg]:size-4">{step.icon}</span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </button>
                    <div className="flex flex-col items-start text-left pt-0.5">
                      <span
                        data-slot="stepper-title"
                        className={cn(
                          "text-sm font-medium leading-none transition-colors",
                          state === "current" && "text-foreground",
                          state === "completed" && "text-foreground",
                          state === "upcoming" && "text-muted-foreground",
                          state === "error" && "text-destructive",
                          isClickable && "group-hover:text-foreground",
                          variant === "compact" && "text-xs"
                        )}
                      >
                        {step.title}
                        {step.optional && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            (Optional)
                          </span>
                        )}
                      </span>
                      {step.description && (
                        <span
                          data-slot="stepper-description"
                          className={cn(
                            "mt-1 text-xs leading-tight text-muted-foreground/80",
                            variant === "compact" && "hidden sm:block"
                          )}
                        >
                          {step.description}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center">
                    {/* Top row: indicator centered + connector in between steps at equal distance */}
                    <div className="relative flex w-full items-center justify-center">
                      <button
                        type="button"
                        data-slot="stepper-trigger"
                        data-state={state}
                        aria-current={state === "current" ? "step" : undefined}
                        aria-label={`${step.title}${state === "completed" ? " completed" : state === "current" ? " current" : ""}`}
                        disabled={!isClickable}
                        onClick={() => {
                          if (isClickable) onStepChange?.(index)
                        }}
                        className={cn(
                          "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-background text-sm font-semibold transition-all duration-300",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          state === "completed" &&
                            "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20",
                          state === "current" &&
                            "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-[6px] ring-primary/15 scale-105",
                          state === "upcoming" &&
                            "border-muted-foreground/20 bg-muted text-muted-foreground",
                          state === "error" &&
                            "border-destructive bg-destructive text-destructive-foreground shadow-md",
                          isClickable
                            ? "cursor-pointer hover:scale-105 hover:shadow-lg"
                            : "cursor-default",
                          !isClickable && state === "upcoming" && "opacity-80"
                        )}
                      >
                        {state === "current" && (
                          <span
                            aria-hidden
                            className="absolute inset-0 -z-10 rounded-full bg-primary/20 animate-ping [animation-duration:2s]"
                          />
                        )}
                        {state === "completed" ? (
                          <Check className="size-4" strokeWidth={2.5} aria-hidden />
                        ) : state === "error" ? (
                          <AlertCircle className="size-4" aria-hidden />
                        ) : step.icon ? (
                          <span className="size-4 [&_svg]:size-4">{step.icon}</span>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </button>
                      {/* Connector line at equal distance between two steps - absolute centered, equal gap on both sides */}
                      {!isLast && (
                        <div
                          data-slot="stepper-separator"
                          aria-hidden
                          className="absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-1/2 flex h-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                              index < currentStep ? "w-full bg-primary" : "w-0 bg-primary"
                            )}
                          />
                          {index === currentStep && (
                            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-primary/15 to-transparent opacity-60 [animation:stepper-shimmer_2s_ease-in-out_infinite]" />
                          )}
                        </div>
                      )}
                    </div>
                    {/* Label below indicator */}
                    <div className="mt-2 flex flex-col items-center text-center">
                      <span
                        data-slot="stepper-title"
                        className={cn(
                          "text-sm font-medium leading-none transition-colors",
                          state === "current" && "text-foreground",
                          state === "completed" && "text-foreground",
                          state === "upcoming" && "text-muted-foreground",
                          state === "error" && "text-destructive",
                          isClickable && "group-hover:text-foreground",
                          variant === "compact" && "text-xs"
                        )}
                      >
                        {step.title}
                        {step.optional && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            (Optional)
                          </span>
                        )}
                      </span>
                      {step.description && (
                        <span
                          data-slot="stepper-description"
                          className={cn(
                            "mt-1 max-w-[16ch] text-xs leading-tight sm:max-w-none",
                            state === "current"
                              ? "text-muted-foreground"
                              : "text-muted-foreground/80",
                            variant === "compact" && "hidden sm:block"
                          )}
                        >
                          {step.description}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>

      </div>
    </StepperContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Compositional sub-components (for advanced usage)
// ---------------------------------------------------------------------------

function StepperItem({
  className,
  ...props
}: React.ComponentProps<"li"> & { state?: StepState }) {
  return (
    <li
      data-slot="stepper-item"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function StepperTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { onStepChange } = useStepperContext()
  void onStepChange
  return (
    <button
      data-slot="stepper-trigger"
      className={cn("", className)}
      {...props}
    />
  )
}

function StepperSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-separator"
      className={cn("h-px flex-1 bg-border", className)}
      {...props}
    />
  )
}

function StepperContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="stepper-content" className={cn("mt-4", className)} {...props} />
  )
}

export {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperSeparator,
  StepperContent,
  useStepperContext,
}
