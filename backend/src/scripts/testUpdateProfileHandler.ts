import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { updateProfile } from "../modules/seller/controllers/sellerAuthController";
import { Request, Response } from "express";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function testHandler() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    const req = {
      user: { userId: "69faf49b09470e0af914e30e" },
      body: { city: "Indore API Test" }
    } as any as Request;

    let responseData: any = null;
    const res = {
      status: (_code: number) => {
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    } as any as Response;

    await updateProfile(req, res, (err) => {
      if (err) console.error("Error passed to next():", err);
    });

    // Wait 2 seconds for async handler to resolve
    setTimeout(() => {
      console.log("Response from updateProfile Handler:", JSON.stringify(responseData, null, 2));
      process.exit(0);
    }, 2000);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testHandler();
