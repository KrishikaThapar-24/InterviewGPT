import multer from "multer";
import path from "node:path";

const allowedTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedMimeType = allowedTypes[extension];

  if (!expectedMimeType || file.mimetype !== expectedMimeType) {
    return cb(new Error("Only PDF and DOCX resume files are allowed."));
  }
  cb(null, true);
};

// Memory storage is intentional: no uploaded resume is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export const uploadResume = upload.single("resume");
