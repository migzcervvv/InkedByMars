import InstagramFeed from "../components/instagram/InstagramFeed.jsx";
import { useInstagramFeed } from "../hooks/useInstagramFeed";

export default function GalleryPage() {
  const feed = useInstagramFeed();

  return (
    <section className="min-h-screen bg-bg px-6 pb-24 pt-32 lg:pb-32">
      <div className="mx-auto max-w-7xl">
        <InstagramFeed {...feed} />
      </div>
    </section>
  );
}
