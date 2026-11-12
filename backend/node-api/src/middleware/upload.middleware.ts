
import multer from "multer";
import path from "node:path";

// Supported resume formats and their expected MIME types.
const allowedTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Validate the uploaded file.
const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const expectedMimeType = allowedTypes[extension];

  if (!expectedMimeType || file.mimetype !== expectedMimeType) {
    return cb(
      new Error("Only PDF and DOCX resume files are allowed.")
    );
  }

  cb(null, true);
};

// Keep the uploaded file in memory.
// No permanent or temporary disk file is created.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

// Frontend must use the field name "resume".
export const uploadResume = upload.single("resume");
