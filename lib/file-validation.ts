const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
const maxSizeMB = 2;

export default function validateFiles(files: File[]) {
  for (const file of files) {
    const contentType = file.type;
    const sizeMB = file.size / (1024 * 1024);

    if (!allowedTypes.includes(contentType)) {
      return { success: false, error: "Invalid file type" };
    }

    if (sizeMB > maxSizeMB) {
      return { success: false, error: `File size exceeds ${maxSizeMB}MB` };
    }
    return { success: true };
  }
}
