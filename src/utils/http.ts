import axios from "axios"

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080"

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
})


