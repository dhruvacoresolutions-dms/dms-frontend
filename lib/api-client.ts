import axios, { AxiosError } from "axios"

import { handleUnauthorized } from "@/lib/unauthorized-handler"

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof AxiosError && error.response?.status === 401) {
      handleUnauthorized()
    }

    return Promise.reject(error)
  }
)