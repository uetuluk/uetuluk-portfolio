import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

const images = [
  "/assets/kiwi-chat.png",
  "/assets/kiwi-annotate.png",
  "/assets/kiwi-analytics.png",
  "/assets/kiwi-ide.png",
  "/assets/ask-chat.png",
  "/assets/ask-tts.png",
  "/assets/ask-multiple-experiences.png",
  "/assets/spiegel-main.png",
  "/assets/spiegel-obs.png",
  "/assets/vtuber-youtube.png",
  "/assets/vtuber-twitch.png",
  "/assets/vtuber-overlay.png",
];

function MasonryGrid({ keyPrefix }: { keyPrefix: string }) {
  return (
    <ResponsiveMasonry columnsCountBreakPoints={{ 350: 2, 750: 3, 1024: 4 }}>
      <Masonry gutter="8px">
        {images.map((src, index) => (
          <img
            key={`${keyPrefix}-${src}-${index}`}
            src={src}
            alt=""
            loading="eager"
            decoding="async"
            className="w-full block"
          />
        ))}
      </Masonry>
    </ResponsiveMasonry>
  );
}

export function MosaicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {/* Rotation wrapper - rotates and scales to cover corners */}
      <div className="absolute inset-0 rotate-[30deg] scale-150 origin-center">
        {/* Animation wrapper - floats upward */}
        <div className="animate-float-up blur-sm opacity-20">
          {/* Two identical grids stacked for seamless looping */}
          <MasonryGrid keyPrefix="grid1" />
          <MasonryGrid keyPrefix="grid2" />
        </div>
      </div>
    </div>
  );
}
