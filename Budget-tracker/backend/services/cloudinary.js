import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const cleanEnv = (val) => val ? val.replace(/^["']|["']$/g, '').trim() : '';

cloudinary.config({
  cloud_name: cleanEnv(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: cleanEnv(process.env.CLOUDINARY_API_KEY),
  api_secret: cleanEnv(process.env.CLOUDINARY_API_SECRET)
});


// ==========================
// UPLOAD FILE
// ==========================

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("Local file path missing");
    }

    // Standard upload to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "profile_pictures"
    });

    // delete local temp file after success
    if (fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (e) {}
    }

    return {
      secure_url: response.secure_url,
      public_id: response.public_id,
      bytes: response.bytes,
      resource_type: response.resource_type,
      format: response.format,
      original_filename: response.original_filename
    };

  } catch (error) {
    console.error("CLOUDINARY ERROR DETAILS:", error);

    // remove temp file if upload fails
    if (localFilePath && fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (e) {}
    }

    throw new Error(error.message || error.error?.message || "Cloudinary upload failed");
  }
};


// ==========================
// DELETE FILE
// ==========================

const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;

  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let pathAfterUpload = url.slice(uploadIndex + "/upload/".length);
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, "");

    const segments = pathAfterUpload.split("/");
    while (
      segments.length > 1 &&
      segments[0].includes("_") &&
      !segments[0].includes(".")
    ) {
      segments.shift();
    }

    const publicId = segments.join("/").replace(/\.[^/.]+$/, "");
    return publicId || null;
  } catch {
    return null;
  }
};

const deleteFromCloudinary = async (
  publicId,
  resourceType = "image"
) => {

  try {

    return await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: resourceType
      }
    );

  } catch (error) {

    console.log(
      "CLOUDINARY DELETE ERROR:",
      error
    );

    throw new Error(
      error.message || "Cloudinary delete failed"
    );
  }
};

export {
  uploadOnCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};