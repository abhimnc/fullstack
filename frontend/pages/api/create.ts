// pages/api/create.ts

import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { content } = req.body;

  // Validate content
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'content'" });
  }

  try {
    const payload = { content };

    const backendRes = await axios.post("http://quickshare-backend:8000/create", payload);
    res.status(200).json(backendRes.data);
  } catch (error: any) {
    console.error("Error creating document:", error?.response?.data || error.message);
    res.status(500).json({
      error: "Creation failed",
      details: error?.response?.data || null,
    });
  }
}
