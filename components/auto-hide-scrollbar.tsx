"use client"

import { useEffect } from "react"

export function AutoHideScrollbar() {
  useEffect(() => {
    let timeout: number | undefined

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document
      const el =
        target instanceof HTMLElement ? target : document.documentElement

      el.classList.add("is-scrolling")
      document.documentElement.classList.add("is-scrolling")
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        el.classList.remove("is-scrolling")
        document.documentElement.classList.remove("is-scrolling")
      }, 900)
    }

    // Capture scroll events from any scrollable element
    document.addEventListener("scroll", handleScroll, true)
    window.addEventListener("scroll", handleScroll, true)

    return () => {
      document.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("scroll", handleScroll, true)
      window.clearTimeout(timeout)
    }
  }, [])

  return null
}
