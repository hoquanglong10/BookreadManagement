import StoryArtwork from "./StoryArtwork.jsx";

const coverStyles = ["story-cover--teal", "story-cover--indigo", "story-cover--rose", "story-cover--amber", "story-cover--sage", "story-cover--slate"];
const coverStyleByTheme = { teal: "story-cover--teal", indigo: "story-cover--indigo", rose: "story-cover--rose", amber: "story-cover--amber", sage: "story-cover--sage", slate: "story-cover--slate", ink: "story-cover--teal", clay: "story-cover--rose", moss: "story-cover--sage", plum: "story-cover--indigo", ochre: "story-cover--amber", blue: "story-cover--slate" };

export default function StoryCover({ story, size = "regular" }) {
  const index = Math.abs(Number(story?.id) || 0) % coverStyles.length;
  const theme = coverStyleByTheme[String(story?.coverTheme || "").toLowerCase()] || coverStyles[index];
  const title = story?.title || "Truyện mới";
  return (
    <div className={`story-cover story-cover--${size} ${theme}`} aria-hidden="true">
      {!story?.coverUrl && <StoryArtwork theme={theme.replace("story-cover--", "")} storyId={story?.id} />}
      {story?.coverUrl && <img className="story-cover__image" src={story.coverUrl} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />}
      <span className="story-cover__rule" />
      <span className="story-cover__eyebrow">ĐỌC TRUYỆN · TUYỂN TẬP</span>
      <span className="story-cover__title">{title}</span>
      <span className="story-cover__ornament" />
      <span className="story-cover__author">{story?.author || "Tác giả"}</span>
    </div>
  );
}
