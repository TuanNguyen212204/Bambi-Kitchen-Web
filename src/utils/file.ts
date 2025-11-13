import { getDownloadURL, ref, uploadBytes, type UploadMetadata } from "firebase/storage";
import { storage } from "../config/firebase";
import { API_BASE_URL } from "./http";

export interface UploadFileOptions {
    folder?: string;
    metadata?: UploadMetadata;
    fileName?: string;
}

export async function uploadFile(file: File | Blob, options: UploadFileOptions = {}): Promise<string> {
    const { folder = "uploads", metadata = {}, fileName } = options;
    const originalName = (file as File)?.name || "file";
    const ext = originalName.includes(".") ? originalName.split(".").pop() as string : "bin";
    const base = (fileName || originalName.replace(/\.[^/.]+$/, ""))
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-");
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const objectPath = `${folder}/${base}-${uniqueSuffix}.${ext}`;

    const storageRef = ref(storage, objectPath);
    const response = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(response.ref);
    return downloadURL;
}

/**
 * Normalize image URL để đảm bảo nó là absolute URL
 * Nếu URL là relative (bắt đầu bằng / hoặc không có protocol), 
 * thì prepend API_BASE_URL
 */
export function normalizeImageUrl(url?: string | null): string | undefined {
    if (!url || typeof url !== "string" || url.trim() === "") {
        return undefined;
    }
    
    const trimmedUrl = url.trim();
    
    // Nếu đã là absolute URL (có protocol), trả về nguyên
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
        return trimmedUrl;
    }
    
    // Nếu là protocol-relative URL (bắt đầu bằng //), thêm https:
    if (trimmedUrl.startsWith("//")) {
        return `https:${trimmedUrl}`;
    }
    
    // Nếu là data URL hoặc blob URL, trả về nguyên
    if (trimmedUrl.startsWith("data:") || trimmedUrl.startsWith("blob:")) {
        return trimmedUrl;
    }
    
    // Lấy API_BASE_URL
    const baseUrl = API_BASE_URL || "";
    
    // Debug: log API_BASE_URL trong development
    if (import.meta.env.DEV) {
        console.log("[normalizeImageUrl] API_BASE_URL:", baseUrl, "Original URL:", trimmedUrl);
    }
    
    // Nếu không có API_BASE_URL hoặc vẫn là localhost trong production, log warning
    if (!baseUrl || (import.meta.env.PROD && baseUrl === "http://localhost:8085")) {
        console.warn("[normalizeImageUrl] ⚠️ API_BASE_URL không được set đúng hoặc vẫn là localhost trong production!");
        console.warn("[normalizeImageUrl] API_BASE_URL hiện tại:", baseUrl);
        console.warn("[normalizeImageUrl] Vui lòng đảm bảo VITE_API_BASE_URL được set trong Vercel và đã rebuild deployment!");
        // Nếu URL bắt đầu bằng /, vẫn trả về để browser tự resolve (có thể hoạt động nếu cùng domain)
        return trimmedUrl.startsWith("/") ? trimmedUrl : `/${trimmedUrl}`;
    }
    
    // Loại bỏ trailing slash từ API_BASE_URL nếu có
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    
    // Nếu là relative URL (bắt đầu bằng /), prepend API_BASE_URL
    if (trimmedUrl.startsWith("/")) {
        const normalized = `${cleanBaseUrl}${trimmedUrl}`;
        if (import.meta.env.DEV) {
            console.log("[normalizeImageUrl] Normalized:", trimmedUrl, "->", normalized);
        }
        return normalized;
    }
    
    // Nếu không bắt đầu bằng /, prepend API_BASE_URL và thêm /
    const normalized = `${cleanBaseUrl}/${trimmedUrl}`;
    if (import.meta.env.DEV) {
        console.log("[normalizeImageUrl] Normalized:", trimmedUrl, "->", normalized);
    }
    return normalized;
}




