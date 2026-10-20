import { useId } from "react";

const scenes = {
  teal: { sky: ["#83c3cf", "#29576e"], sun: "#ffe7ad", far: "#688f9b", near: "#315b6d", ground: "#19384d", mark: "#d0aa72" },
  indigo: { sky: ["#a9aed5", "#36345f"], sun: "#f5e7bd", far: "#8588ad", near: "#50547e", ground: "#292c4b", mark: "#cec9ea" },
  rose: { sky: ["#f4b9a8", "#814b62"], sun: "#ffe0b0", far: "#d78f87", near: "#a85e68", ground: "#60394c", mark: "#f5c77a" },
  amber: { sky: ["#f3c77e", "#76513e"], sun: "#fff0bb", far: "#d29b5e", near: "#986742", ground: "#513c31", mark: "#ffe2a1" },
  sage: { sky: ["#a9d0a1", "#326b63"], sun: "#f8e9b0", far: "#83a879", near: "#477765", ground: "#1b4948", mark: "#d7dc96" },
  slate: { sky: ["#a9cad8", "#304962"], sun: "#e8eff0", far: "#7799a8", near: "#476679", ground: "#20384e", mark: "#d0d7e4" }
};

export default function StoryArtwork({ theme = "teal", className = "", storyId }) {
  const palette = scenes[theme] || scenes.teal;
  const gradientId = `story-sky-${useId().replaceAll(":", "")}`;
  const scene = ((Math.abs(Number(storyId) || 1) - 1) % 6);

  return <svg className={`story-artwork ${className}`.trim()} viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0.18" y2="1"><stop stopColor={palette.sky[0]} /><stop offset="1" stopColor={palette.sky[1]} /></linearGradient>
      <linearGradient id={`${gradientId}-water`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={palette.near} /><stop offset="1" stopColor={palette.ground} /></linearGradient>
    </defs>
    <rect width="800" height="500" fill={`url(#${gradientId})`} />
    <circle cx="603" cy="137" r="48" fill={palette.sun} opacity=".9" />
    <circle cx="603" cy="137" r="70" fill={palette.sun} opacity=".12" />
    <path d="M0 282 112 211l91 76 110-130 122 130 98-92 150 102 117-70v273H0Z" fill={palette.far} opacity=".92" />
    <path d="m0 325 136-86 97 69 131-112 114 116 102-86 109 63 111-56v267H0Z" fill={palette.near} />
    <path d="M0 350q126-50 242 7t236 1q122-56 322-4v146H0Z" fill={`url(#${gradientId}-water)`} />
    <path d="M0 390q113-22 220 9t225 6q160-36 355-1" fill="none" stroke={palette.mark} strokeOpacity=".58" strokeWidth="3" />
    <path d="M0 424q117-18 224 7t212 8q176-25 364 1" fill="none" stroke={palette.mark} strokeOpacity=".32" strokeWidth="2" />
    <g fill={palette.ground}>
      <path d="M0 326 33 267l33 59h-18l31 56H10l25-56Z" />
      <path d="M74 342 112 270l39 72h-21l31 67H61l32-67Z" />
      <path d="M646 329 681 257l38 72h-20l30 66h-93l31-66Z" />
      <path d="M713 339 752 265l39 74h-22l31 69h-97l32-69Z" />
    </g>
    <g fill={palette.mark} opacity=".8">
      <circle cx="180" cy="156" r="3" /><circle cx="238" cy="110" r="2" /><circle cx="337" cy="176" r="2.5" />
      <circle cx="472" cy="96" r="2" /><circle cx="706" cy="191" r="3" />
    </g>
    {scene === 0 && <g>
      <path d="M82 405V286l102-75 103 75v119Z" fill="#263f43" />
      <path d="m66 293 118-89 119 89-15 16-104-77-104 77Z" fill="#d39b66" />
      <rect x="111" y="305" width="66" height="69" rx="2" fill="#f0c77e" opacity=".9" />
      <rect x="190" y="305" width="66" height="100" fill="#142c38" />
      <path d="M104 298h160v15H104Z" fill="#e2ac70" />
      <path d="M218 334h20m-20 10h20m-20 10h20" stroke="#f6dda2" strokeWidth="4" />
      <path d="M80 410h212" stroke="#e0b277" strokeOpacity=".7" strokeWidth="4" />
    </g>}
    {scene === 1 && <g fill="none" stroke={palette.mark} strokeWidth="3" strokeOpacity=".8">
      <path d="m468 165 62-48 53 32 52-64 63 43" /><circle cx="468" cy="165" r="5" fill={palette.mark} /><circle cx="530" cy="117" r="5" fill={palette.mark} /><circle cx="583" cy="149" r="5" fill={palette.mark} /><circle cx="635" cy="85" r="5" fill={palette.mark} /><circle cx="698" cy="128" r="5" fill={palette.mark} />
    </g>}
    {scene === 2 && <g fill="none" stroke={palette.mark} strokeOpacity=".72" strokeWidth="4">
      <path d="m34 343 172-112 178 112M170 343l155-100 164 100" />
      <path d="M76 262 56 309m96-91-20 49m105-78-21 51m103-14-21 50m103-26-21 50m117-33-21 50m104-23-21 50" />
      <path d="M120 370q74-10 144 0m120 10q75-10 144 0" />
    </g>}
    {scene === 3 && <g>
      <path d="M72 408 172 313l96 95Z" fill="#283b48" />
      <path d="m476 391 65-58 53 10 81-75 75 123Z" fill="#263f4c" />
      <path d="m542 275 36-60 36 60h-13l11 112h-68l11-112Z" fill="#f2dfbb" />
      <path d="M536 278h84v14h-84Zm12 43h60v13h-60Z" fill="#c67055" />
      <path d="M563 246h30" stroke="#fff2c8" strokeWidth="5" />
      <path d="m578 255 132-53-120 72m-9-19L454 194l127 75" stroke={palette.mark} strokeOpacity=".52" strokeWidth="6" />
    </g>}
    {scene === 4 && <g>
      <path d="M0 430q122-74 221-7t200-6q115-67 379 15v68H0Z" fill="#173f43" />
      <path d="M104 430q9-118 27-160m-19 109q-54-30-66-75m75 42q44-34 58-81m387 168q6-113 24-156m-17 98q-51-38-61-82m73 48q42-37 53-79" fill="none" stroke="#bdd58b" strokeWidth="8" strokeLinecap="round" />
      <g fill={palette.mark}><circle cx="87" cy="298" r="16"/><circle cx="181" cy="280" r="18"/><circle cx="546" cy="283" r="15"/><circle cx="638" cy="299" r="17"/></g>
      <path d="m331 347 59-33 59 33-59 36Z" fill="#f5e4bd" /><path d="m390 314 59 33-59 36Z" fill="#d7b57d" /><path d="m351 346 39 22m-21-33 40 22" stroke="#836b4b" strokeWidth="3" />
    </g>}
    {scene === 5 && <g>
      <path d="M36 413V300h75v113Zm88 0V247h90v166Zm104 0V286h67v127Zm80 0V220h91v193Zm105 0V270h82v143Zm97 0V237h72v176Zm86 0V294h82v119Z" fill="#203544" />
      <g fill={palette.mark} opacity=".85">
        <path d="M52 319h14v18H52zm29 0h14v18H81zm29-49h15v18h-15zm28 0h15v18h-15zm28 0h15v18h-15zm29 40h14v18h-14zm0 30h14v18h-14zm98-95h15v18h-15zm29 0h15v18h-15zm29 30h15v18h-15zm0 31h15v18h-15zm39 49h15v18h-15zm41-71h15v18h-15zm29 0h15v18h-15zm96-34h15v18h-15zm29 30h15v18h-15z" />
      </g>
    </g>}
  </svg>;
}
