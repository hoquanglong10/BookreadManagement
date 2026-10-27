import { Link } from "react-router-dom";
import { displayStatus } from "../utils/format.js";
import StoryCover from "./StoryCover.jsx";

export default function StoryCard({ story, compact = false }) {
  return (
    <article className={`story-card${compact ? " story-card--compact" : ""}`}>
      <Link className="story-card__cover-link" to={`/story/${story.id}`} aria-label={`Xem truyện ${story.title}`}>
        <StoryCover story={story} />
      </Link>
      <div className="story-card__body">
        <div className="story-card__meta">
          <span className="genre-label">{story.genre || "Chưa phân loại"}</span>
          <span className={`status-dot${displayStatus(story.status) === "Hoàn thành" ? " status-dot--done" : ""}`}>{displayStatus(story.status)}</span>
        </div>
        <h3 className="story-card__title"><Link to={`/story/${story.id}`} title={story.title}>{story.title}</Link></h3>
        <p className="story-card__author">{story.author}</p>
        <p className="story-card__description">{story.description}</p>
        <div className="story-card__foot"><span>{story.storyChapterCount ?? 0} chương · {story.episodeCount ?? story.chapterCount ?? 0} tập</span><Link to={`/story/${story.id}`}>Chi tiết <span aria-hidden="true">→</span></Link></div>
      </div>
    </article>
  );
}
