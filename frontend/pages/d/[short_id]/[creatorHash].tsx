// pages/d/[short_id]/[creatorHash].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axios from "axios";

export default function EditPage() {
  const router = useRouter();
  // Extract short_id and creatorHash directly from the URL path parameters
  const { short_id, creatorHash } = router.query; // creatorHash is now directly available from the path

  // State to hold the creatorHash, which is crucial for authorization
  // We can directly use the 'creatorHash' from router.query, but keeping a state
  // for consistency with previous structure and potential future validation.
  const [currentCreatorHash, setCurrentCreatorHash] = useState<string | null>(null);
  // State to manage loading status
  const [loading, setLoading] = useState(true);
  // State to display error or success messages to the user
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize the Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit], // Use StarterKit for basic text editing features
    content: "", // Initial content is empty, will be loaded from backend
    onUpdate: ({ editor }) => {
      // Optional: You can add auto-save logic here if desired.
      // For this example, we'll rely on the explicit "Save Changes" button.
    },
  });

  // Effect to set the creatorHash from the URL path parameter
  useEffect(() => {
    if (creatorHash && typeof creatorHash === "string") {
      setCurrentCreatorHash(creatorHash);
    } else {
      // If creatorHash is missing in the URL, display an error
      setErrorMessage("Creator hash missing in URL. Cannot edit this document.");
      setLoading(false); // Stop loading as we can't proceed
    }
  }, [creatorHash]); // Re-run when creatorHash from router.query changes

  // Effect to fetch document content from the backend
  useEffect(() => {
    // Ensure all necessary data (short_id, currentCreatorHash, editor instance) is available
    if (!short_id || typeof short_id !== "string" || !currentCreatorHash || !editor) {
      // If currentCreatorHash is missing, an error message is already set by the previous effect.
      if (!currentCreatorHash) return;
      // If editor is not yet initialized, wait for it.
      if (!editor) return;
    }

    const fetchContent = async () => {
      setLoading(true); // Start loading
      setErrorMessage(null); // Clear any previous error messages

      try {
        // Make a POST request to the Next.js API proxy for fetching content
        const res = await axios.post("/api/get", {
          short_id,
          creator_hash: currentCreatorHash, // Send the creatorHash for authorization
        });
        // Set the fetched content to the editor
        editor.commands.setContent(res.data.content || "");
      } catch (err: any) {
        console.error("Error fetching document:", err);
        // Display a user-friendly error message
        setErrorMessage(err.response?.data?.detail || "Could not load document. Please check the short ID and creator hash.");
      } finally {
        setLoading(false); // End loading
      }
    };

    // Only fetch content if short_id, currentCreatorHash, and editor are all ready
    if (short_id && currentCreatorHash && editor) {
      fetchContent();
    }
  }, [short_id, currentCreatorHash, editor]); // Dependencies for this effect

  // Handler for saving document changes
  const handleUpdate = async () => {
    // Ensure editor is ready and we have the necessary IDs
    if (!editor || !currentCreatorHash || typeof short_id !== "string") {
      setErrorMessage("Editor or required document information not available.");
      return;
    }

    const content = editor.getHTML(); // Get the current HTML content from the editor
    try {
      // Make a POST request to the Next.js API proxy for updating content
      await axios.post("/api/update", {
        short_id,
        creator_hash: currentCreatorHash, // Send currentCreatorHash for authorization
        content,
      });
      // Display success message
      setErrorMessage("Document saved successfully!");
      // Clear the success message after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving document:", err);
      // Display error message
      setErrorMessage(err.response?.data?.detail || "Save failed. Please check the short ID and creator hash.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 font-sans bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 text-center">Edit Document</h1>

      {/* Display error or success messages */}
      {errorMessage && (
        <div className={`p-3 mb-4 rounded-md text-sm text-center shadow-md ${errorMessage.includes("saved successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {errorMessage}
        </div>
      )}

      {/* Conditional rendering based on loading state */}
      {loading ? (
        <p className="text-gray-600 text-center py-10">Loading document...</p>
      ) : (
        <>
          {editor && ( // Render editor only when it's initialized
            <div className="border border-gray-300 rounded-lg shadow-lg p-4 min-h-[300px] bg-white">
              {/* Apply Tailwind's prose class for better typography within the editor content */}
              <EditorContent editor={editor} className="prose max-w-none focus:outline-none" />
            </div>
          )}

          {/* Save Changes button */}
          <button
            onClick={handleUpdate}
            className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out text-lg font-semibold"
          >
            Save Changes
          </button>
        </>
      )}
    </div>
  );
}
