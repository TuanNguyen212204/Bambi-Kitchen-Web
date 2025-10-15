import { getDownloadURL, uploadBytes } from "firebase/storage";
import { storage } from "../config/firebase";
import { ref } from "process";

const uploadFile = async (file) => {
    //Lưu cái file này lên firebase storage
    //=> lấy cái đường dẫn đến file vừa tạo
    const storageRef = ref(storage, file.name);
    const response = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(response.ref);
    return downloadURL;
}

export default uploadFile;