import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { short_id } = req.query;

  try {
    const response = await axios.get(`http://quickshare-backend:8000/doc/${short_id}`);
    res.status(200).json(response.data);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to load document" });
  }
}
