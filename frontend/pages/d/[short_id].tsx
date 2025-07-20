import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function DocumentPage() {
  const router = useRouter();
  const { short_id } = router.query;
  const [doc, setDoc] = useState<any>(null);

  useEffect(() => {
    if (!short_id) return;
    axios
      .get(`/api/doc/${short_id}`)
      .then((res) => setDoc(res.data))
      .catch(() => setDoc({ content: "<p>Not Found or Expired</p>" }));
  }, [short_id]);

  if (!doc) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: doc.content }}
      />
    </div>
  );
}
