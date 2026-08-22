"use client"

import { useAccessStore } from "@/stores/access-store"

export function useHasPermission() {
  return useAccessStore((state) => state.hasPermission)
}

export function useHasAnyPermission() {
  return useAccessStore((state) => state.hasAnyPermission)
}

export function useHasAllPermissions() {
  return useAccessStore((state) => state.hasAllPermissions)
}

export function useHasFeature() {
  return useAccessStore((state) => state.hasFeature)
}
