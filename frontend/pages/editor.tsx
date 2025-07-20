// frontend/pages/editor.tsx

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useRouter } from "next/router";

export default function EditorPage() {
  const [creatorHash, setCreatorHash] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();

  // Load or generate creator hash
  useEffect(() => {
    let stored = localStorage.getItem("creator_hash");
    if (!stored) {
      stored = uuidv4();
      localStorage.setItem("creator_hash", stored);
    }
    setCreatorHash(stored);
  }, []);

  // Initialize the TipTap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: "", // Start with blank input
    autofocus: true,
  });

  // Handle publishing to backend
  const handlePublish = async () => {
    if (!editor || !creatorHash) return;

    const content = editor.getHTML();
    if (!content || content.length > 1_000_000) {
      alert("Content is empty or too large.");
      return;
    }

    setIsPublishing(true);
    try {
      const response = await axios.post("/api/create", {
        content,
        creator_hash: creatorHash,
      });

      const { short_id } = response.data;
      router.push(`/d/${short_id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to publish document.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Quick Share — Editor</h1>

      <div className="border rounded p-4 min-h-[300px]">
        {editor && <EditorContent editor={editor} />}
      </div>

      <button
        onClick={handlePublish}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        disabled={isPublishing}
      >
        {isPublishing ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}
