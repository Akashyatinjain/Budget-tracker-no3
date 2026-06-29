import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

const cleanEnv = (val) => val ? val.replace(/^["']|["']$/g, '').trim() : '';

console.log("Testing Cloudinary config:");
console.log("Cloud Name:", cleanEnv(process.env.CLOUDINARY_CLOUD_NAME));
console.log("API Key:", cleanEnv(process.env.CLOUDINARY_API_KEY));

cloudinary.config({
  cloud_name: cleanEnv(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: cleanEnv(process.env.CLOUDINARY_API_KEY),
  api_secret: cleanEnv(process.env.CLOUDINARY_API_SECRET)
});

async function test() {
  try {
    const res = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/sample.jpg", {
      folder: "test"
    });
    console.log("SUCCESS:", res.secure_url);
  } catch (err) {
    console.error("FAILURE DETAILS:", err);
  }
}
test();
