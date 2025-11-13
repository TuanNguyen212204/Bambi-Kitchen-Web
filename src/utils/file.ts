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
    if (!url) return undefined;
    
    // Nếu đã là absolute URL (có protocol), trả về nguyên
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
        return url;
    }
    
    // Nếu là relative URL (bắt đầu bằng /), prepend API_BASE_URL
    if (url.startsWith("/")) {
        // Loại bỏ trailing slash từ API_BASE_URL nếu có
        const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        return `${baseUrl}${url}`;
    }
    
    // Nếu không bắt đầu bằng /, cũng prepend API_BASE_URL và thêm /
    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${baseUrl}/${url}`;
}




