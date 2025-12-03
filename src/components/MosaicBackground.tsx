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

export function MosaicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <div className="blur-md opacity-20">
        <ResponsiveMasonry
          columnsCountBreakPoints={{ 350: 2, 750: 3, 1024: 4 }}
        >
          <Masonry gutter="8px">
            {images.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                className="w-full block"
              />
            ))}
          </Masonry>
        </ResponsiveMasonry>
      </div>
    </div>
  );
}
