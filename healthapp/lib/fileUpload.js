import path from 'path';
import { writeFile, mkdir, unlink } from 'fs/promises';
import fs from 'fs';

const CONFIG = {
    ALLOWED_TYPES: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
    MAX_SIZE: 10 * 1024 * 1024, 
    UPLOAD_DIR: "storage" 
};

export async function saveFile(file, subfolder = '') {
    if (!file || typeof file === 'string') {
        throw new Error("No file uploaded");
    }

    const fileExt = path.extname(file.name).toLowerCase();
    if (!CONFIG.ALLOWED_TYPES.includes(fileExt)) {
        throw new Error(`Invalid file type. Allowed: ${CONFIG.ALLOWED_TYPES.join(', ')}`);
    }

    if (file.size > CONFIG.MAX_SIZE) {
        throw new Error(`File too large. Max size is ${CONFIG.MAX_SIZE / (1024 * 1024)}MB.`);
    }

    const storageDir = path.join(process.cwd(), CONFIG.UPLOAD_DIR, subfolder);
    
    if (!fs.existsSync(storageDir)) {
        await mkdir(storageDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + "-" + file.name.replace(/\s+/g, '-');
    const filePath = path.join(storageDir, uniqueSuffix);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    return {
        filename: uniqueSuffix,
        originalName: file.name,
        size: file.size,
        type: fileExt.substring(1),
        fullPath: filePath
    };
}

export async function deleteFile(filename) {
    if (!filename) return;

    const storageDir = path.join(process.cwd(), 'storage');
    const filePath = path.join(storageDir, filename);

    try {
        if (fs.existsSync(filePath)) {
            await unlink(filePath);
            return true;
        }
    } catch (error) {
        console.error(`Error deleting file ${filename}:`, error);
    }
    return false;
}