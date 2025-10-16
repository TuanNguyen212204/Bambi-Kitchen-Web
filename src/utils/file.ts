import { getDownloadURL, ref, uploadBytes, type UploadMetadata } from "firebase/storage";
import { storage } from "../config/firebase";

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




