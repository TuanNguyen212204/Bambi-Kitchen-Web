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
 * Hỗ trợ cả Firebase Storage URLs và Cloudinary URLs từ backend
 */
export function normalizeImageUrl(url?: string | null): string | undefined {
    if (!url || typeof url !== "string" || url.trim() === "") {
        return undefined;
    }
    
    const trimmedUrl = url.trim();
    
    // Nếu đã là absolute URL (có protocol), trả về nguyên
    // Bao gồm cả Cloudinary URLs (https://res.cloudinary.com/...)
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
    
    // Nếu là Cloudinary URL không có protocol (bắt đầu bằng res.cloudinary.com)
    // Thêm https://
    if (trimmedUrl.startsWith("res.cloudinary.com")) {
        return `https://${trimmedUrl}`;
    }
    
    // Lấy API_BASE_URL
    const baseUrl = API_BASE_URL || "";
    
    // Nếu không có API_BASE_URL hoặc vẫn là localhost trong production
    // Và URL là relative, trả về URL gốc (browser sẽ tự resolve nếu cùng domain)
    if (!baseUrl || (import.meta.env.PROD && baseUrl.includes("localhost"))) {
        // Nếu URL bắt đầu bằng /, trả về nguyên (có thể hoạt động nếu backend serve static files)
        // Nếu không, có thể là Cloudinary path, thử thêm https://
        if (trimmedUrl.startsWith("/")) {
            return trimmedUrl;
        }
        // Nếu không bắt đầu bằng /, có thể là relative path, thêm /
        return `/${trimmedUrl}`;
    }
    
    // Loại bỏ trailing slash từ API_BASE_URL nếu có
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    
    // Nếu là relative URL (bắt đầu bằng /), prepend API_BASE_URL
    if (trimmedUrl.startsWith("/")) {
        return `${cleanBaseUrl}${trimmedUrl}`;
    }
    
    // Nếu không bắt đầu bằng /, prepend API_BASE_URL và thêm /
    return `${cleanBaseUrl}/${trimmedUrl}`;
}




