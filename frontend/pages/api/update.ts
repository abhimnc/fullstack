import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const backendRes = await axios.post("http://quickshare-backend:8000/update", req.body);
    res.status(200).json(backendRes.data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to update document" });
  }
}
