import React, { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Search, Bell, Settings, Heart, MoreHorizontal, Shuffle, SkipBack, SkipForward,
  Repeat, ListMusic, SlidersHorizontal, Activity, Type, Share2, Menu, ChevronUp,
  Home, Compass, ScanLine, History, User, Plus, X, Mic2, Camera, Sun, Moon, Check,
  Library, Lock, Unlock, Users2, Play, Save, Trophy, Crown, Star, Mic, Flame, Shuffle as Dice, Music2,
} from "lucide-react";

const PRESETS = [
  { id: "pulse", name: "Pulse", a: "#8B5CF6", b: "#4DD8FF" },
  { id: "rockero", name: "Rockero", a: "#FF3B6B", b: "#E8B923" },
  { id: "aurora", name: "Aurora", a: "#00E0A3", b: "#00C8E0" },
  { id: "fuego", name: "Fuego", a: "#FF7A3D", b: "#FF3B3B" },
  { id: "oceano", name: "Océano", a: "#2563EB", b: "#38BDF8" },
];

const DARK = { bg: "#080912", panel: "rgba(255,255,255,0.05)", panelBorder: "rgba(255,255,255,0.12)", text: "#F4F5FA", muted: "#8B90A8", navBg: "#0B0C17", aurora: true };
const LIGHT = { bg: "#F1F1F8", panel: "rgba(255,255,255,0.75)", panelBorder: "rgba(0,0,0,0.08)", text: "#1B1E2E", muted: "#6B7086", navBg: "#FFFFFF", aurora: false };

const MOCK_RESULTS = [
  { id: "r1", title: "Bohemian Rhapsody", artist: "Queen", hue: 0 },
  { id: "r2", title: "La Bamba", artist: "Ritchie Valens", hue: 1 },
  { id: "r3", title: "Uptown Funk", artist: "Bruno Mars", hue: 2 },
  { id: "r4", title: "Cielito Lindo", artist: "Trío Los Panchos", hue: 3 },
  { id: "r5", title: "Despacito", artist: "Luis Fonsi", hue: 4 },
];

const INITIAL_QUEUE = [
  { id: "q0", code: "A2", title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", duration: "4:41", votes: 8, addedBy: "José", hue: 0, playing: true, youtubeId: "kJQP7kiw5Fk" },
  { id: "q1", code: "A3", title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", duration: "4:30", votes: 5, addedBy: "Tía Marcela", hue: 1, youtubeId: "OPf0YbXqDm0" },
  { id: "q2", code: "A4", title: "Bohemian Rhapsody", artist: "Queen", duration: "5:59", votes: 3, addedBy: "Primo Beto", hue: 2, youtubeId: "fJ9rUzIMcZQ" },
];

const INITIAL_PLAYLISTS = [
  { id: "p1", name: "Favoritas de la Familia", count: 24, collab: ["JP", "TM", "MA"], hue: 0 },
  { id: "p2", name: "Cumpleaños Mamá 2026", count: 18, collab: ["JP", "MA"], hue: 2 },
  { id: "p3", name: "Solo para Mí", count: 9, collab: ["JP"], hue: 4 },
];

const INITIAL_LEADERBOARD = [
  { id: "k1", singer: "Mamá", initials: "MA", hue: 2, gender: "F", song: "Rayando el Sol", avgScore: 4.9, votes: 6 },
  { id: "k2", singer: "Tía Marcela", initials: "TM", hue: 0, gender: "F", song: "Oye Como Va", avgScore: 4.6, votes: 5 },
  { id: "k3", singer: "Primo Beto", initials: "PB", hue: 1, gender: "M", song: "La Bamba", avgScore: 3.8, votes: 4 },
];

const NOW_PLAYING = { code: "A2", title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", addedBy: "José", duration: 228, youtubeId: "kJQP7kiw5Fk" };

const LYRICS_DEMO = [
  { t: 0, line: "♪ Aquí aparecerá la letra sincronizada ♪" },
  { t: 8, line: "Cada línea se resalta en el momento exacto" },
  { t: 16, line: "Así se vería con la letra real del proveedor" },
  { t: 24, line: "La línea actual se ilumina más brillante" },
  { t: 32, line: "Las anteriores quedan atenuadas arriba" },
  { t: 40, line: "Y las siguientes esperan más abajo" },
  { t: 48, line: "Se desplaza sola siguiendo la canción" },
  { t: 56, line: "Perfecto para cantar con toda la familia" },
  { t: 64, line: "♪ Letra de ejemplo — sigue sonando ♪" },
  { t: 72, line: "Cuando conectemos el proveedor real, esto cobra vida" },
];

const MOCK_USERS = [
  { name: "Tía Marcela", initials: "TM", hue: 0, gender: "F" },
  { name: "Primo Beto", initials: "PB", hue: 1, gender: "M" },
  { name: "Mamá", initials: "MA", hue: 2, gender: "F" },
  { name: "Camila", initials: "CA", hue: 3, gender: "F" },
  { name: "José", initials: "JP", hue: 4, gender: "M" },
];

const HUES = [
  ["#8B5CF6", "#4DD8FF"], ["#D6285F", "#8B5CF6"], ["#4DD8FF", "#3DFFB0"], ["#8B5CF6", "#D6285F"], ["#4DD8FF", "#8B5CF6"],
];
const grad = (hue) => `linear-gradient(135deg, ${HUES[hue % HUES.length][0]}, ${HUES[hue % HUES.length][1]})`;

const EQ_DELAYS = [0, 0.18, 0.36, 0.09, 0.27, 0.45, 0.05, 0.23, 0.41, 0.14, 0.32, 0.5];
const EQ_DURATIONS = [1.1, 0.9, 1.3, 1.0, 1.2, 0.95, 1.15, 1.05, 0.85, 1.25, 1.0, 1.1];

// Demo time is accelerated 60x (1 real hour = 1 demo minute) so you can see
// the 40min / 2h / 5h / 30min mechanics play out without waiting for real.
const DEMO_MS = { round: 40 * 1000, deadline: 300 * 1000, cycle: 120 * 1000, block: 30 * 1000 };

const GENRES = [
  { id: "80s", label: "Años 80" },
  { id: "90s", label: "Años 90" },
  { id: "2000s", label: "Años 2000" },
  { id: "actual", label: "Actual" },
];

function useLetterCodes(startIndex) {
  const ref = useRef(startIndex);
  return () => `A${6 + ref.current++}`;
}

// ---------- (reproductor simplificado a iframe directo, ver NowPlayingCard) ----------

function parseDurationToSeconds(str) {
  if (!str || typeof str !== "string") return 0;
  const [m, s] = str.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

function parseISODuration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return "0:00";
  const h = parseInt(m[1] || 0, 10), min = parseInt(m[2] || 0, 10), s = parseInt(m[3] || 0, 10);
  const total = h * 60 + min;
  return `${total}:${String(s).padStart(2, "0")}`;
}

async function searchYouTube(query) {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!key) return { error: "no-key" };
  try {
    const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=8&q=${encodeURIComponent(query)}&key=${key}`);
    const searchData = await searchRes.json();
    if (searchData.error) return { error: searchData.error.message };
    const ids = searchData.items.map((it) => it.id.videoId).join(",");
    if (!ids) return { items: [] };
    const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${key}`);
    const detailsData = await detailsRes.json();
    const durationById = Object.fromEntries((detailsData.items || []).map((d) => [d.id, parseISODuration(d.contentDetails.duration)]));
    return {
      items: searchData.items.map((it) => ({
        id: it.id.videoId,
        youtubeId: it.id.videoId,
        title: it.snippet.title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        artist: it.snippet.channelTitle,
        thumbnail: it.snippet.thumbnails?.default?.url,
        duration: durationById[it.id.videoId] || "0:00",
      })),
    };
  } catch (e) {
    return { error: "network" };
  }
}

function randomRoomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function rowToSong(row, index) {
  return {
    id: row.id,
    code: `A${index + 2}`,
    title: row.title,
    artist: row.artist,
    duration: row.duration,
    votes: row.votes,
    addedBy: row.added_by,
    playing: row.playing,
    hue: row.hue,
    youtubeId: row.youtube_id,
  };
}

// ---------- Sala: crea o entra a una sala vía ?sala=CODIGO en el link ----------
function useRoom() {
  const [room, setRoom] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      let code = params.get("sala");

      if (code) {
        const { data } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle();
        if (data) {
          setRoom(data);
          setReady(true);
          return;
        }
      }

      // no había código válido en el link: crear una sala nueva
      code = randomRoomCode();
      const { data, error } = await supabase.from("rooms").insert({ code }).select().single();
      if (!error && data) {
        const url = new URL(window.location.href);
        url.searchParams.set("sala", code);
        window.history.replaceState({}, "", url);
        setRoom(data);
      }
      setReady(true);
    })();
  }, []);

  return { room, ready };
}

function nextSongId(queue, currentId, dir) {
  const playable = queue.filter((s) => s.youtubeId);
  if (playable.length === 0) return currentId;
  const idx = playable.findIndex((s) => s.id === currentId);
  const next = (idx + dir + playable.length) % playable.length;
  return playable[next].id;
}

function fmtClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function GlobalStyle() {
  return (
    <style>{`
      @keyframes eqPulse { 0%{height:18%} 20%{height:80%} 40%{height:35%} 60%{height:95%} 80%{height:50%} 100%{height:22%} }
      .eq-fill { position:absolute; bottom:0; left:0; width:100%; animation-name:eqPulse; animation-iteration-count:infinite; animation-timing-function:steps(6,end); animation-direction:alternate; }
      @keyframes drift1 { 0%,100%{transform:translate(-8%,-6%) scale(1)} 50%{transform:translate(10%,6%) scale(1.2)} }
      @keyframes drift2 { 0%,100%{transform:translate(8%,4%) scale(1.1)} 50%{transform:translate(-10%,-8%) scale(0.9)} }
      @keyframes portalSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
      @keyframes wordFade { 0%,100%{opacity:0.18} 50%{opacity:1} }
      @keyframes floatUp { 0%{transform:translateY(0) scale(1); opacity:1;} 100%{transform:translateY(-100px) scale(1.5); opacity:0;} }
      @keyframes crownBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
      @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:0.35} }
      @keyframes flameFlicker { 0%,100%{transform:scale(1) rotate(-2deg)} 50%{transform:scale(1.1) rotate(2deg)} }
    `}</style>
  );
}

function Aurora({ a1, a2 }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ mixBlendMode: "screen" }}>
      <div style={{ position: "absolute", top: "-15%", left: "-10%", width: "65%", height: "65%", background: `radial-gradient(circle, ${a1}55 0%, transparent 70%)`, filter: "blur(55px)", animation: "drift1 18s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "65%", height: "65%", background: `radial-gradient(circle, ${a2}40 0%, transparent 70%)`, filter: "blur(55px)", animation: "drift2 22s ease-in-out infinite" }} />
    </div>
  );
}

function Equalizer({ T, count = 12, height = 40, barWidth = 4, gap = 3 }) {
  return (
    <div className="flex items-end" style={{ gap, height }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="relative rounded-sm overflow-hidden" style={{ width: barWidth, height: "100%", background: `${T.a1}22` }}>
          <div className="eq-fill" style={{ background: T.gradient, animationDelay: `${EQ_DELAYS[i % EQ_DELAYS.length]}s`, animationDuration: `${EQ_DURATIONS[i % EQ_DURATIONS.length]}s` }} />
        </div>
      ))}
    </div>
  );
}

function AlbumArt({ size = 130, colors }) {
  const [c1, c2] = colors;
  return (
    <div className="relative rounded-2xl overflow-hidden shrink-0" style={{ width: size, height: size, background: "linear-gradient(160deg,#1a0f2e,#0a1f33 60%,#241033)" }}>
      <div className="absolute inset-0 flex items-center justify-center" style={{ animation: "portalSpin 14s linear infinite" }}>
        {[0.85, 0.65, 0.45, 0.28].map((r, i) => (
          <div key={i} className="absolute rounded-full" style={{ width: size * r, height: size * r, border: `1.5px solid ${i % 2 === 0 ? c1 : c2}`, opacity: 0.55 - i * 0.08, boxShadow: `0 0 ${10 + i * 4}px ${i % 2 === 0 ? c1 : c2}` }} />
        ))}
      </div>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 65%, rgba(255,170,90,0.25), transparent 55%)" }} />
    </div>
  );
}

function ProfileAvatar({ T, avatar, onChange, size = 54 }) {
  const fileRef = useRef(null);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <button onClick={() => fileRef.current?.click()} className="rounded-full overflow-hidden flex items-center justify-center w-full h-full"
        style={{ background: "#1a1c2c", border: "2px solid transparent", backgroundImage: `linear-gradient(#1a1c2c,#1a1c2c), ${T.gradient}`, backgroundOrigin: "border-box", backgroundClip: "content-box, border-box", boxShadow: `0 0 16px -2px ${T.a1}88` }}>
        {avatar ? <img src={avatar} alt="Perfil" className="w-full h-full object-cover" /> : <span style={{ color: "#fff", fontWeight: 800, fontSize: size * 0.34 }}>JP</span>}
      </button>
      <div className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center cursor-pointer" style={{ width: size * 0.38, height: size * 0.38, background: T.a1, border: "2px solid #080912" }} onClick={() => fileRef.current?.click()}>
        <Camera size={size * 0.19} color="#fff" />
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const reader = new FileReader(); reader.onload = () => onChange(reader.result); reader.readAsDataURL(f);
      }} />
    </div>
  );
}

function ConnectedUsers({ T, compact = false }) {
  const shown = compact ? MOCK_USERS.slice(0, 4) : MOCK_USERS;
  const avatarSize = compact ? 24 : 30;
  return (
    <div className="flex items-center gap-2">
      <div className="flex" style={{ marginLeft: 6 }}>
        {shown.map((u, i) => (
          <div key={u.name} className="relative rounded-full flex items-center justify-center font-bold shrink-0" style={{ width: avatarSize, height: avatarSize, marginLeft: -6, background: grad(u.hue), border: `2px solid ${T.bg}`, color: "#fff", fontSize: avatarSize * 0.34, zIndex: shown.length - i }}>
            {u.initials}
            <span className="absolute rounded-full" style={{ width: 7, height: 7, background: "#3DFFB0", bottom: -1, right: -1, border: `2px solid ${T.bg}` }} />
          </div>
        ))}
      </div>
      {!compact && <span className="text-xs font-bold text-right leading-tight" style={{ color: T.muted }}>{MOCK_USERS.length}<br />CONECTADOS</span>}
    </div>
  );
}

function GlassPanel({ T, children, className = "", style = {} }) {
  return <div className={`rounded-3xl border backdrop-blur-xl ${className}`} style={{ background: T.panel, borderColor: T.panelBorder, ...style }}>{children}</div>;
}

function Toggle({ T, checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} className="relative rounded-full shrink-0 transition-colors" style={{ width: 44, height: 24, background: checked ? T.gradient : T.panelBorder }}>
      <div className="absolute rounded-full bg-white transition-all" style={{ width: 18, height: 18, top: 3, left: checked ? 23 : 3, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

function PulseMark({ T, size = 18 }) {
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 64 24" fill="none">
      <polyline points="0,12 12,12 16,4 20,20 24,8 28,16 32,12 64,12" stroke={T.a1} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${T.a1})` }}>
        <animate attributeName="stroke" values={`${T.a1};${T.a2};${T.a1}`} dur="2.4s" repeatCount="indefinite" />
      </polyline>
      <circle cx="32" cy="12" r="3" fill={T.a2} style={{ animation: "pulseDot 1.2s ease-in-out infinite" }} />
    </svg>
  );
}

function AnimatedTagline({ T, text }) {
  const words = text.split(" ");
  return (
    <div className="text-[10px] font-semibold mt-1 flex gap-1 flex-wrap" style={{ color: T.muted }}>
      {words.map((w, i) => <span key={i} style={{ display: "inline-block", animation: "wordFade 3.2s ease-in-out infinite", animationDelay: `${i * 0.25}s` }}>{w}</span>)}
    </div>
  );
}

function TopBar({ T, avatar, setAvatar, onOpenSettings, locked }) {
  return (
    <div className="flex items-center justify-between px-1 pt-1 pb-3">
      <div className="flex items-center gap-3">
        <ProfileAvatar T={T} avatar={avatar} onChange={setAvatar} size={52} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl leading-none tracking-wide" style={{ fontFamily: "'Metal Mania', cursive", color: T.a1 }}>Pulse</span>
            <PulseMark T={T} size={18} />
            {locked && <Lock size={14} style={{ color: T.muted }} />}
          </div>
          <AnimatedTagline T={T} text="El ritmo jamás se detiene." />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Search size={18} style={{ color: T.muted }} />
        <div className="relative"><Bell size={18} style={{ color: T.muted }} /><span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: T.a1 }} /></div>
        <button onClick={onOpenSettings}><Settings size={18} style={{ color: T.muted }} /></button>
      </div>
    </div>
  );
}

function ModeTabs({ T, screenMode, setScreenMode }) {
  const tabs = [
    { id: "musica", label: "Música", icon: Activity },
    { id: "letras", label: "Letras", icon: Mic2 },
    { id: "playlists", label: "Playlists", icon: Library },
    { id: "concurso", label: "Concurso", icon: Trophy },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5 mb-3">
      {tabs.map((m) => (
        <button key={m.id} onClick={() => setScreenMode(m.id)} className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl border text-[9px] font-bold"
          style={{ background: screenMode === m.id ? `${T.a1}22` : T.panel, borderColor: screenMode === m.id ? T.a2 : T.panelBorder, color: screenMode === m.id ? T.text : T.muted, boxShadow: screenMode === m.id ? `0 0 18px -4px ${T.a2}88` : "none" }}>
          <m.icon size={14} /> {m.label}
        </button>
      ))}
    </div>
  );
}

function NowPlayingCard({ T, song, playing, onPlaySpotify, spotifyStatus, audioSource }) {
  const spotifyHabilitado = audioSource === "spotify";
  return (
    <GlassPanel T={T} className="p-4 flex gap-4 items-start relative overflow-hidden">
      <div className="rounded-2xl overflow-hidden shrink-0" style={{ width: 128, height: 96, background: "#000" }}>
        {spotifyHabilitado ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: "#0d1f14" }}>
            <span style={{ fontSize: 22 }}>🎧</span>
            <div className="text-[9px] font-bold text-center px-1" style={{ color: "#1DB954" }}>AUDIO EN SPOTIFY</div>
          </div>
        ) : playing && song?.youtubeId ? (
          <iframe
            key={song.youtubeId}
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${song.youtubeId}?autoplay=1`}
            title={song.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: T.muted }}>
            EN PAUSA
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-start justify-between">
          <div className="text-xs font-bold tracking-wide" style={{ color: T.a1 }}>SONANDO AHORA · {song.code}</div>
          <div className="flex items-center gap-2 shrink-0">
            <Heart size={17} style={{ color: T.a1 }} fill={T.a1} />
            <MoreHorizontal size={17} style={{ color: T.muted }} />
          </div>
        </div>
        <div className="text-xl font-black leading-tight mt-1" style={{ color: T.text }}>{song.title}</div>
        <div className="text-sm mt-1" style={{ color: T.text }}>{song.artist}</div>
        <div className="text-xs" style={{ color: T.muted }}>agregada por {song.addedBy}</div>
        <div className="mt-2.5 flex items-center justify-between">
          <Equalizer T={T} count={14} height={26} barWidth={3} gap={2.5} />
          <button
            onClick={() => spotifyHabilitado && onPlaySpotify(song)}
            disabled={spotifyStatus === "loading" || !spotifyHabilitado}
            title={!spotifyHabilitado ? "Activa el modo Spotify en Ajustes para usar esto" : undefined}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold shrink-0"
            style={
              spotifyHabilitado
                ? { background: "#1DB954", color: "#000" }
                : { background: "#2A2C3A", color: "#6B6F85", cursor: "not-allowed" }
            }
          >
            🎧 {spotifyStatus === "loading" ? "Conectando…" : "Spotify"}
          </button>
        </div>
        {!spotifyHabilitado && (
          <div className="text-[11px] mt-1.5 font-bold" style={{ color: T.muted }}>Modo YouTube activo — cambia a Spotify en Ajustes para usar este botón</div>
        )}
        {spotifyHabilitado && spotifyStatus === "playing" && <div className="text-[11px] mt-1.5 font-bold" style={{ color: "#1DB954" }}>▶️ Sonando en tu Spotify</div>}
        {spotifyHabilitado && spotifyStatus === "error" && <div className="text-[11px] mt-1.5 font-bold" style={{ color: "#FF3B6B" }}>No se pudo — revisa que Spotify esté abierto en algún dispositivo</div>}
      </div>
    </GlassPanel>
  );
}

function ProgressControls({ T, playing, onToggle, elapsed, duration, onNext, onPrev }) {
  const pct = duration ? (elapsed / duration) * 100 : 0;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, "0")}`;
  return (
    <GlassPanel T={T} className="p-4 mt-3">
      <div className="relative h-1.5 rounded-full mb-1.5" style={{ background: `${T.a1}22` }}>
        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${pct}%`, background: T.gradient }} />
        <div className="absolute rounded-full" style={{ left: `calc(${pct}% - 6px)`, top: -4.5, width: 13, height: 13, background: "#fff", boxShadow: `0 0 8px ${T.a1}` }} />
      </div>
      <div className="flex justify-between text-xs font-semibold mb-3" style={{ color: T.muted }}>
        <span>{fmt(elapsed)}</span><span>{fmt(duration)}</span>
      </div>
      <div className="flex items-center justify-between px-1">
        <Shuffle size={19} style={{ color: T.muted }} />
        <button onClick={onPrev}><SkipBack size={22} style={{ color: T.text }} fill={T.text} /></button>
        <button onClick={onToggle} className="relative rounded-full flex items-center justify-center" style={{ width: 60, height: 60, border: `2px solid ${T.a2}`, boxShadow: `0 0 22px -2px ${T.a2}aa` }}>
          {playing ? (
            <div className="flex gap-1.5"><div style={{ width: 5, height: 20, background: T.text, borderRadius: 2 }} /><div style={{ width: 5, height: 20, background: T.text, borderRadius: 2 }} /></div>
          ) : (
            <div style={{ width: 0, height: 0, marginLeft: 4, borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderLeft: `18px solid ${T.text}` }} />
          )}
        </button>
        <button onClick={onNext}><SkipForward size={22} style={{ color: T.text }} fill={T.text} /></button>
        <Repeat size={19} style={{ color: T.muted }} />
      </div>
    </GlassPanel>
  );
}

function QuickActions({ T, queueCount, onOpenQueue }) {
  const items = [
    { icon: ListMusic, label: "Cola de\nreproducción", badge: queueCount, onClick: onOpenQueue },
    { icon: SlidersHorizontal, label: "Ecualizador" },
    { icon: Activity, label: "Efectos" },
    { icon: Type, label: "Letra" },
    { icon: Share2, label: "Compartir" },
  ];
  return (
    <div className="grid grid-cols-5 gap-2 mt-3">
      {items.map((it, i) => (
        <button key={i} onClick={it.onClick} className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-3" style={{ background: T.panel, borderColor: T.panelBorder }}>
          {it.badge != null && <span className="absolute top-1.5 right-1.5 text-[9px] font-bold rounded-full px-1.5 py-0.5" style={{ background: T.a1, color: "#fff" }}>{it.badge}</span>}
          <it.icon size={17} style={{ color: T.text }} />
          <span className="text-[9px] leading-tight text-center font-semibold" style={{ color: T.muted, whiteSpace: "pre-line" }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function QueuePanel({ T, queue, open, setOpen, onSelect }) {
  return (
    <GlassPanel T={T} className="mt-3 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Mic2 size={14} style={{ color: T.muted }} />
          <span className="text-xs font-bold tracking-wide" style={{ color: T.text }}>COLA DE REPRODUCCIÓN</span>
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: `${T.a1}33`, color: T.a1 }}>{queue.length}</span>
        </div>
        <ChevronUp size={16} style={{ color: T.muted, transform: open ? "none" : "rotate(180deg)", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1">
          {queue.map((song) => (
            <button key={song.id} onClick={() => onSelect(song.id)} disabled={!song.youtubeId} className="w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left" style={{ background: song.playing ? `${T.a1}14` : "transparent", opacity: song.youtubeId ? 1 : 0.45 }}>
              <AlbumArt size={40} colors={HUES[song.hue % HUES.length]} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: T.text }}>{song.title}</div>
                <div className="text-xs truncate" style={{ color: T.muted }}>{song.artist} · {song.duration}{!song.youtubeId && " · sin audio todavía"}</div>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: T.muted, border: `1px solid ${T.panelBorder}` }}>{song.code}</span>
              <Menu size={15} style={{ color: T.muted }} />
            </button>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

function limpiarTituloLetra(texto) {
  return (texto || "")
    .replace(/\(.*?\)/g, " ")
    .replace(/\[.*?\]/g, " ")
    .replace(/official\s*(music\s*)?video/gi, " ")
    .replace(/official\s*audio/gi, " ")
    .replace(/lyric[s]?\s*video/gi, " ")
    .replace(/\blyrics\b/gi, " ")
    .replace(/\bhd\b|\b4k\b|\bhq\b/gi, " ")
    .replace(/video\s*oficial/gi, " ")
    .replace(/audio\s*oficial/gi, " ")
    .replace(/vevo/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function LyricsView({ T, song }) {
  const [estado, setEstado] = useState("cargando"); // cargando | ok | vacio | error
  const [letra, setLetra] = useState("");

  const artistaLimpio = limpiarTituloLetra(song?.artist);
  const tituloLimpio = limpiarTituloLetra(song?.title);

  useEffect(() => {
    if (!song?.title || !song?.artist) return;
    setEstado("cargando");
    setLetra("");

    const controller = new AbortController();
    fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artistaLimpio)}/${encodeURIComponent(tituloLimpio)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data?.lyrics && data.lyrics.trim().length > 0) {
          setLetra(data.lyrics.trim());
          setEstado("ok");
        } else {
          setEstado("vacio");
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") setEstado("error");
      });

    return () => controller.abort();
  }, [song?.title, song?.artist]);

  const geniusUrl = `https://genius.com/search?q=${encodeURIComponent(`${tituloLimpio} ${artistaLimpio}`)}`;

  return (
    <GlassPanel T={T} className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold tracking-wide" style={{ color: T.a1 }}>LETRA · {song?.title}</div>
      </div>

      {estado === "cargando" && (
        <div className="text-center py-8 text-sm" style={{ color: T.muted }}>Buscando letra…</div>
      )}

      {estado === "ok" && (
        <div className="whitespace-pre-line text-center leading-relaxed text-[15px] font-semibold" style={{ color: T.text, maxHeight: 340, overflowY: "auto" }}>
          {letra}
        </div>
      )}

      {(estado === "vacio" || estado === "error") && (
        <div className="text-center py-8">
          <div className="text-sm mb-4" style={{ color: T.muted }}>No se encontró letra disponible para esta canción.</div>
          <a
            href={geniusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: T.gradient, color: "#fff" }}
          >
            Buscar letra en Genius
          </a>
        </div>
      )}
    </GlassPanel>
  );
}

function PlaylistsView({ T, playlists, setPlaylists, queue }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [collaborative, setCollaborative] = useState(false);
  const createPlaylist = () => {
    if (!name.trim()) return;
    setPlaylists((prev) => [...prev, { id: `pl_${Date.now()}`, name: name.trim(), count: 0, collab: collaborative ? ["JP", "TM"] : ["JP"], hue: prev.length }]);
    setName(""); setCollaborative(false); setCreating(false);
  };
  const saveCurrentQueue = () => setPlaylists((prev) => [...prev, { id: `pl_${Date.now()}`, name: `Cola guardada · ${new Date().toLocaleDateString("es-CL")}`, count: queue.length, collab: ["JP"], hue: prev.length }]);
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={saveCurrentQueue} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold" style={{ background: T.panel, borderColor: T.panelBorder, color: T.text }}><Save size={14} /> Guardar cola actual</button>
        <button onClick={() => setCreating(!creating)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold" style={{ background: T.gradient, color: "#fff" }}><Plus size={14} /> Nueva playlist</button>
      </div>
      {creating && (
        <GlassPanel T={T} className="p-3 space-y-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la playlist" className="w-full bg-transparent outline-none text-sm px-3 py-2 rounded-xl border" style={{ borderColor: T.panelBorder, color: T.text }} />
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: T.muted }}><Users2 size={13} /> Colaborativa</span>
            <Toggle T={T} checked={collaborative} onChange={setCollaborative} />
          </div>
          <button onClick={createPlaylist} className="w-full py-2.5 rounded-xl text-sm font-bold" style={{ background: T.gradient, color: "#fff" }}>Crear</button>
        </GlassPanel>
      )}
      <div className="space-y-2">
        {playlists.map((p) => (
          <GlassPanel T={T} key={p.id} className="p-3 flex items-center gap-3">
            <AlbumArt size={52} colors={HUES[p.hue % HUES.length]} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate" style={{ color: T.text }}>{p.name}</div>
              <div className="text-xs" style={{ color: T.muted }}>{p.count} canciones {p.collab.length > 1 ? "· colaborativa" : "· personal"}</div>
            </div>
            <button className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: T.gradient }}><Play size={15} color="#fff" fill="#fff" /></button>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

function StarRating({ T, value, onRate, size = 26 }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(n)} className="active:scale-90 transition-transform">
          <Star size={size} fill={n <= value ? T.a1 : "none"} stroke={n <= value ? T.a1 : T.muted} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

function KaraokeIdolPanel({ T, performance, setPerformance, leaderboard, setLeaderboard, onCrown }) {
  const [myRating, setMyRating] = useState(0);
  const [floats, setFloats] = useState([]);
  const addFloat = (emoji) => {
    const id = Date.now() + Math.random(); const x = Math.random() * 70 - 35;
    setFloats((f) => [...f, { id, emoji, x }]);
    setTimeout(() => setFloats((f) => f.filter((fl) => fl.id !== id)), 1500);
  };
  const rate = (stars) => { setMyRating(stars); setPerformance((p) => ({ ...p, ratings: [...p.ratings, stars] })); };
  const avg = performance ? performance.ratings.reduce((a, b) => a + b, 0) / (performance.ratings.length || 1) : 0;
  const startPerformance = () => { setPerformance({ singer: "Tú", initials: "JP", hue: 4, gender: "M", song: NOW_PLAYING.title, ratings: [] }); setMyRating(0); };
  const finishPerformance = () => {
    if (!performance) return;
    setLeaderboard((prev) => [...prev, { id: `k_${Date.now()}`, singer: performance.singer, initials: performance.initials, hue: performance.hue, gender: performance.gender, song: performance.song, avgScore: Number(avg.toFixed(1)) || 0, votes: performance.ratings.length }]);
    setPerformance(null);
  };
  const sorted = [...leaderboard].sort((a, b) => b.avgScore - a.avgScore);
  return (
    <div className="space-y-3">
      {performance ? (
        <GlassPanel T={T} className="p-4 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none" style={{ height: 0 }}>
            {floats.map((f) => <span key={f.id} className="absolute text-2xl" style={{ left: `calc(50% + ${f.x}px)`, animation: "floatUp 1.5s ease-out forwards" }}>{f.emoji}</span>)}
          </div>
          <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 rounded-full" style={{ background: "#FF3B3B", animation: "liveDot 1s ease-in-out infinite" }} /><span className="text-xs font-bold tracking-wide" style={{ color: T.a1 }}>PRESENTACIÓN EN VIVO</span></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full flex items-center justify-center font-black shrink-0" style={{ width: 46, height: 46, background: grad(performance.hue), color: "#fff" }}>{performance.initials}</div>
            <div className="min-w-0"><div className="font-black truncate" style={{ color: T.text }}>{performance.singer}</div><div className="text-xs truncate" style={{ color: T.muted }}>cantando "{performance.song}"</div></div>
            <div className="ml-auto text-right shrink-0"><div className="text-2xl font-black" style={{ color: T.a1 }}>{avg ? avg.toFixed(1) : "—"}</div><div className="text-[10px]" style={{ color: T.muted }}>{performance.ratings.length} votos</div></div>
          </div>
          <div className="text-xs font-bold text-center mb-2" style={{ color: T.muted }}>TU CALIFICACIÓN</div>
          <StarRating T={T} value={myRating} onRate={rate} />
          <div className="flex gap-3 justify-center mt-4">{["🔥", "❤️", "👏", "😂"].map((e) => <button key={e} onClick={() => addFloat(e)} className="text-2xl active:scale-125 transition-transform">{e}</button>)}</div>
          <button onClick={finishPerformance} className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: T.panelBorder, color: T.muted }}>Finalizar presentación</button>
        </GlassPanel>
      ) : (
        <button onClick={startPerformance} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold" style={{ background: T.gradient, color: "#fff" }}><Mic size={16} /> Anotarme para cantar</button>
      )}
      <GlassPanel T={T} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Trophy size={15} style={{ color: T.a1 }} /><span className="text-xs font-bold tracking-wide" style={{ color: T.text }}>TABLA DE POSICIONES</span></div>
          {sorted[0] && <button onClick={() => onCrown(sorted[0])} className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: `${T.a1}22`, color: T.a1 }}><Crown size={11} /> Coronar</button>}
        </div>
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-sm font-black w-4 shrink-0" style={{ color: T.muted }}>{i + 1}</span>
              <div className="relative rounded-full flex items-center justify-center font-bold shrink-0" style={{ width: 32, height: 32, background: grad(p.hue), color: "#fff", fontSize: 11 }}>
                {p.initials}
                {i === 0 && <Crown size={14} style={{ position: "absolute", top: -12, color: "#E8B923", animation: "crownBob 1.4s ease-in-out infinite" }} fill="#E8B923" />}
              </div>
              <div className="flex-1 min-w-0"><div className="text-sm font-bold truncate" style={{ color: T.text }}>{p.singer}</div><div className="text-[11px] truncate" style={{ color: T.muted }}>{p.song}</div></div>
              <div className="flex items-center gap-1 shrink-0"><Star size={13} fill={T.a1} stroke={T.a1} /><span className="text-sm font-black" style={{ color: T.a1 }}>{p.avgScore}</span></div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

// ---------- El Protagonista de la Fiesta ----------
function ProtagonistaPanel({ T, state, setState }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const totalVotes = Object.values(state.votes).reduce((a, b) => a + b, 0) || 1;
  const ranked = MOCK_USERS.map((u) => ({ ...u, votes: state.votes[u.name] || 0, pct: ((state.votes[u.name] || 0) / totalVotes) * 100 })).sort((a, b) => b.pct - a.pct);

  const vote = (name) => {
    if (state.votedThisRound || state.winner) return;
    setState((s) => ({ ...s, votes: { ...s.votes, [name]: (s.votes[name] || 0) + 1 }, votedThisRound: true }));
  };

  const roundLeft = state.roundEndsAt - now;
  const deadlineLeft = state.deadlineAt - now;

  return (
    <div className="space-y-3">
      <GlassPanel T={T} className="p-4">
        <div className="flex items-center gap-2 mb-1"><Flame size={16} style={{ color: T.a1, animation: "flameFlicker 1.4s ease-in-out infinite" }} /><span className="font-black text-sm" style={{ color: T.text }}>El Protagonista de la Fiesta</span></div>
        <div className="text-[11px] mb-3" style={{ color: T.muted }}>Vota cada 40 min por el alma de la fiesta. En 5 h se corona al ganador. <span style={{ opacity: 0.7 }}>(demo acelerada 60x)</span></div>

        {state.winner ? (
          <div className="text-center py-3">
            <Crown size={28} style={{ color: "#E8B923", margin: "0 auto 6px" }} fill="#E8B923" />
            <div className="font-black text-lg" style={{ color: T.text }}>{state.winner} es el Protagonista</div>
            <div className="text-xs" style={{ color: T.muted }}>¡Felicidades de parte de toda la fiesta!</div>
          </div>
        ) : (
          <div className="flex gap-3 text-center mb-1">
            <div className="flex-1 rounded-xl py-2" style={{ background: `${T.a1}14` }}>
              <div className="text-[10px] font-bold" style={{ color: T.muted }}>PRÓXIMA VOTACIÓN</div>
              <div className="text-lg font-black" style={{ color: T.a1 }}>{fmtClock(roundLeft)}</div>
            </div>
            <div className="flex-1 rounded-xl py-2" style={{ background: `${T.a1}14` }}>
              <div className="text-[10px] font-bold" style={{ color: T.muted }}>RESULTADO FINAL</div>
              <div className="text-lg font-black" style={{ color: T.a1 }}>{fmtClock(deadlineLeft)}</div>
            </div>
          </div>
        )}
      </GlassPanel>

      <GlassPanel T={T} className="p-4 space-y-3">
        {ranked.map((u, i) => (
          <div key={u.name}>
            <div className="flex items-center gap-2 mb-1">
              <div className="rounded-full flex items-center justify-center font-bold shrink-0" style={{ width: 22, height: 22, background: grad(u.hue), color: "#fff", fontSize: 9 }}>{u.initials}</div>
              <span className="text-xs font-bold flex-1 truncate" style={{ color: T.text }}>{u.name} {i === 0 && u.pct > 0 && "🔥"}</span>
              <span className="text-xs font-black" style={{ color: T.a1 }}>{u.pct.toFixed(0)}%</span>
              {!state.winner && !state.votedThisRound && (
                <button onClick={() => vote(u.name)} className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: T.gradient, color: "#fff" }}>Votar</button>
              )}
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: `${T.a1}18` }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${u.pct}%`, background: T.gradient }} />
            </div>
          </div>
        ))}
        {state.votedThisRound && !state.winner && <div className="text-[10px] text-center pt-1" style={{ color: T.muted }}>Ya votaste en esta ronda — vuelve a intentar en la próxima.</div>}
      </GlassPanel>
    </div>
  );
}

// ---------- Modo Desorden ----------
function DesordenPanel({ T, protagonistaState, state, setState }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const totalVotes = Object.values(protagonistaState.votes).reduce((a, b) => a + b, 0) || 1;
  const leader = MOCK_USERS.map((u) => ({ ...u, pct: ((protagonistaState.votes[u.name] || 0) / totalVotes) * 100 })).sort((a, b) => b.pct - a.pct)[0];

  const awaiting = !state.active && now >= state.nextTriggerAt;
  const choose = (genre) => {
    const endsAt = now + DEMO_MS.block;
    setState({ active: { genre, endsAt }, nextTriggerAt: endsAt + DEMO_MS.cycle });
  };
  if (state.active && now >= state.active.endsAt) {
    setTimeout(() => setState((s) => ({ active: null, nextTriggerAt: s.nextTriggerAt })), 0);
  }

  return (
    <div className="space-y-3">
      <GlassPanel T={T} className="p-4">
        <div className="flex items-center gap-2 mb-1"><Dice size={16} style={{ color: T.a1 }} /><span className="font-black text-sm" style={{ color: T.text }}>Modo Desorden</span></div>
        <div className="text-[11px] mb-3" style={{ color: T.muted }}>Cada 2 h, quien más lidere en "Protagonista de la Fiesta" elige el estilo musical por 30 min. <span style={{ opacity: 0.7 }}>(demo acelerada 60x)</span></div>

        {state.active ? (
          <div className="text-center py-3">
            <div className="text-[10px] font-bold" style={{ color: T.muted }}>SONANDO AHORA</div>
            <div className="text-xl font-black" style={{ color: T.a1 }}>{GENRES.find((g) => g.id === state.active.genre)?.label}</div>
            <div className="text-xs mt-1" style={{ color: T.muted }}>elegido por {leader?.name || "—"} · quedan {fmtClock(state.active.endsAt - now)}</div>
          </div>
        ) : awaiting ? (
          <div>
            <div className="text-center text-xs font-bold mb-3" style={{ color: T.a1 }}>{leader?.name || "El líder"} puede elegir el estilo ahora:</div>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((g) => (
                <button key={g.id} onClick={() => choose(g.id)} className="py-3 rounded-xl text-sm font-bold border" style={{ background: `${T.a1}14`, borderColor: T.panelBorder, color: T.text }}>{g.label}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center rounded-xl py-3" style={{ background: `${T.a1}14` }}>
            <div className="text-[10px] font-bold" style={{ color: T.muted }}>PRÓXIMO CAMBIO DE ESTILO</div>
            <div className="text-lg font-black" style={{ color: T.a1 }}>{fmtClock(state.nextTriggerAt - now)}</div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>Líder actual: {leader?.name || "—"}</div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

// ---------- Karaoke Idol reign banner (30 min gender-themed block) ----------
function ReignBanner({ T, reign, setReign }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!reign) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [reign]);
  useEffect(() => { if (reign && now >= reign.endsAt) setReign(null); }, [now, reign, setReign]);
  if (!reign) return null;
  const bloque = reign.gender === "F" ? "Reinado Femenino" : "Reinado Masculino";
  return (
    <GlassPanel T={T} className="p-3.5 mb-3 flex items-center gap-3">
      <Crown size={22} style={{ color: "#E8B923" }} fill="#E8B923" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-black truncate" style={{ color: T.text }}>{bloque} · {reign.singer}</div>
        <div className="text-[11px]" style={{ color: T.muted }}>elige la música por 30 min · quedan {fmtClock(reign.endsAt - now)}</div>
      </div>
    </GlassPanel>
  );
}

function ConcursoHub(props) {
  const { T, performance, setPerformance, leaderboard, setLeaderboard, protagonistaState, setProtagonistaState, desordenState, setDesordenState, reign, setReign } = props;
  const [sub, setSub] = useState("idol");

  const crown = (top) => setReign({ singer: top.singer, gender: top.gender, endsAt: Date.now() + DEMO_MS.block });

  return (
    <div>
      <ReignBanner T={T} reign={reign} setReign={setReign} />
      <div className="flex gap-1.5 mb-3">
        {[{ id: "idol", label: "Karaoke Idol" }, { id: "protagonista", label: "Protagonista" }, { id: "desorden", label: "Desorden" }].map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)} className="flex-1 py-2 rounded-xl text-[10px] font-bold border" style={{ background: sub === s.id ? `${T.a1}22` : T.panel, borderColor: sub === s.id ? T.a2 : T.panelBorder, color: sub === s.id ? T.text : T.muted }}>{s.label}</button>
        ))}
      </div>
      {sub === "idol" && <KaraokeIdolPanel T={T} performance={performance} setPerformance={setPerformance} leaderboard={leaderboard} setLeaderboard={setLeaderboard} onCrown={crown} />}
      {sub === "protagonista" && <ProtagonistaPanel T={T} state={protagonistaState} setState={setProtagonistaState} />}
      {sub === "desorden" && <DesordenPanel T={T} protagonistaState={protagonistaState} state={desordenState} setState={setDesordenState} />}
    </div>
  );
}

function BottomNav({ T, onScan }) {
  const items = [
    { id: "inicio", label: "Inicio", icon: Home, active: true },
    { id: "explorar", label: "Explorar", icon: Compass },
    { id: "scan", label: "", icon: ScanLine, center: true },
    { id: "historial", label: "Historial", icon: History },
    { id: "perfil", label: "Perfil", icon: User },
  ];
  return (
    <div className="flex items-center justify-around px-2 py-3 border-t" style={{ background: T.navBg, borderColor: T.panelBorder }}>
      {items.map((it) => it.center ? (
        <button key={it.id} onClick={onScan} className="rounded-full flex items-center justify-center" style={{ width: 44, height: 44, border: `2px solid ${T.a2}`, boxShadow: `0 0 16px -2px ${T.a2}aa` }}><it.icon size={18} style={{ color: T.a2 }} /></button>
      ) : (
        <div key={it.id} className="flex flex-col items-center gap-1"><it.icon size={19} style={{ color: it.active ? T.a1 : T.muted }} /><span className="text-[9px] font-semibold" style={{ color: it.active ? T.a1 : T.muted }}>{it.label}</span></div>
      ))}
    </div>
  );
}

function RoomPanel({ T, room, onClose }) {
  const link = typeof window !== "undefined" ? window.location.href : "";
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}`;
  const share = () => {
    if (navigator.share) navigator.share({ title: "Pulse", url: link });
    else { navigator.clipboard.writeText(link); }
  };
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center" style={{ background: `${T.bg}f7`, backdropFilter: "blur(10px)" }}>
      <button onClick={onClose} className="absolute top-4 right-4"><X size={22} style={{ color: T.muted }} /></button>
      <div className="text-xs font-bold tracking-widest mb-2" style={{ color: T.muted }}>TU SALA</div>
      <div className="text-4xl font-black mb-5 tracking-widest" style={{ color: T.a1, fontFamily: "'Bebas Neue', 'Metal Mania', sans-serif" }}>{room?.code}</div>
      <img src={qrSrc} alt="QR de la sala" className="rounded-2xl mb-5" style={{ border: `3px solid ${T.a2}` }} />
      <div className="text-xs mb-5 px-4" style={{ color: T.muted }}>Comparte este código o QR solo con quienes participen — es lo único que necesitan para entrar a esta reunión.</div>
      <button onClick={share} className="px-6 py-3 rounded-full text-sm font-bold" style={{ background: T.gradient, color: "#fff" }}>Compartir enlace</button>
    </div>
  );
}

function SettingsPanel({ T, accentId, setAccentId, mode, setMode, locked, setLocked, password, setPassword, soloMode, setSoloMode, audioSource, setAudioSource, onClose }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col p-4 overflow-y-auto" style={{ background: `${T.bg}f5`, backdropFilter: "blur(10px)" }}>
      <div className="flex items-center justify-between mb-5"><span className="font-black text-lg" style={{ color: T.text }}>Ajustes</span><button onClick={onClose}><X size={20} style={{ color: T.muted }} /></button></div>
      <div className="text-xs font-bold tracking-wide mb-3" style={{ color: T.muted }}>MODO</div>
      <div className="flex gap-2 mb-6">
        {[{ id: "dark", label: "Oscuro", Icon: Moon }, { id: "light", label: "Claro", Icon: Sun }].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setMode(id)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-bold" style={{ background: mode === id ? `${T.a1}22` : T.panel, borderColor: mode === id ? T.a2 : T.panelBorder, color: T.text }}><Icon size={15} /> {label}</button>
        ))}
      </div>
      <div className="text-xs font-bold tracking-wide mb-3" style={{ color: T.muted }}>COLOR DE LA PLATAFORMA</div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => setAccentId(p.id)} className="relative flex items-center gap-3 rounded-2xl border p-3" style={{ background: T.panel, borderColor: accentId === p.id ? p.b : T.panelBorder }}>
            <div className="w-9 h-9 rounded-full shrink-0" style={{ background: `linear-gradient(135deg,${p.a},${p.b})` }} />
            <span className="text-sm font-bold" style={{ color: T.text }}>{p.name}</span>
            {accentId === p.id && <Check size={15} style={{ color: p.b, marginLeft: "auto" }} />}
          </button>
        ))}
      </div>
      <div className="text-xs font-bold tracking-wide mb-3" style={{ color: T.muted }}>SEGURIDAD DE LA SALA</div>
      <GlassPanel T={T} className="p-3.5 space-y-4">
        <div className="flex items-center justify-between">
          <div><div className="text-sm font-bold flex items-center gap-1.5" style={{ color: T.text }}>{locked ? <Lock size={14} /> : <Unlock size={14} />} Bloquear sala con contraseña</div><div className="text-[11px] mt-0.5" style={{ color: T.muted }}>Los invitados deberán ingresarla para entrar</div></div>
          <Toggle T={T} checked={locked} onChange={setLocked} />
        </div>
        {locked && <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña de la sala" className="w-full bg-transparent outline-none text-sm px-3 py-2.5 rounded-xl border" style={{ borderColor: T.panelBorder, color: T.text }} />}
        <div className="h-px" style={{ background: T.panelBorder }} />
        <div className="flex items-center justify-between">
          <div><div className="text-sm font-bold" style={{ color: T.text }}>Modo solitario</div><div className="text-[11px] mt-0.5" style={{ color: T.muted }}>Solo tú escuchas; los invitados no pueden agregar ni votar</div></div>
          <Toggle T={T} checked={soloMode} onChange={setSoloMode} />
        </div>
      </GlassPanel>

      <div className="text-xs font-bold tracking-wide mb-3 mt-6" style={{ color: T.muted }}>FUENTE DE AUDIO</div>
      <GlassPanel T={T} className="p-3.5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold" style={{ color: T.text }}>Reproducir desde Spotify</div>
            <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>
              {audioSource === "spotify" ? "Activo — el botón de Spotify funciona para todos" : "Apagado — solo se reproduce por YouTube, el botón de Spotify queda bloqueado"}
            </div>
          </div>
          <Toggle T={T} checked={audioSource === "spotify"} onChange={(v) => setAudioSource(v ? "spotify" : "youtube")} />
        </div>
      </GlassPanel>
      <GlassPanel T={T} className="p-3.5">
        <div className="text-sm font-bold mb-1" style={{ color: T.text }}>Conectar Spotify (anfitrión)</div>
        <div className="text-[11px] mb-3" style={{ color: T.muted }}>Solo tú necesitas hacer esto, una vez. Tus invitados no necesitan cuenta de Spotify.</div>
        <a
          href={`https://accounts.spotify.com/authorize?client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(import.meta.env.VITE_SPOTIFY_REDIRECT_URI || "")}&scope=${encodeURIComponent("user-read-playback-state user-modify-playback-state user-read-currently-playing")}`}
          className="block text-center py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "#1DB954", color: "#000" }}
        >
          Conectar con Spotify
        </a>
      </GlassPanel>
    </div>
  );
}

function VistaInvitado(props) {
  const { T, queue, setQueue, playlists, setPlaylists, avatar, setAvatar, playing, setPlaying, screenMode, setScreenMode,
    accentId, setAccentId, mode, setMode, locked, setLocked, password, setPassword, soloMode, setSoloMode,
    audioSource, setAudioSource,
    performance, setPerformance, leaderboard, setLeaderboard, protagonistaState, setProtagonistaState, desordenState, setDesordenState, reign, setReign } = props;

  const [queueOpen, setQueueOpen] = useState(true);
  const [roomPanelOpen, setRoomPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [q, setQ] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(228);
  const currentSong = queue.find((s) => s.playing) || queue[0];
  const nextCode = useLetterCodes(queue.length);

  useEffect(() => {
    setElapsed(0);
    setDuration(parseDurationToSeconds(currentSong?.duration) || 228);
  }, [currentSong?.id]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsed((e) => Math.min(duration, e + 1)), 1000);
    return () => clearInterval(id);
  }, [playing, duration]);

  const togglePlay = () => setPlaying((p) => !p);

  const [spotifyStatus, setSpotifyStatus] = useState("idle");
  const playOnSpotify = async (song) => {
    setSpotifyStatus("loading");
    try {
      const res = await fetch(`/api/spotify-play?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`);
      setSpotifyStatus(res.ok ? "playing" : "error");
    } catch {
      setSpotifyStatus("error");
    }
    setTimeout(() => setSpotifyStatus("idle"), 6000);
  };

  const selectSong = (id) => {
    if (props.onSelectSong) props.onSelectSong(id);
    setPlaying(true);
  };

  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState(null);

  useEffect(() => {
    if (!searchOpen) return;
    if (!q.trim()) { setSearchResults([]); setSearchErr(null); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await searchYouTube(q.trim());
      setSearching(false);
      if (res.error) setSearchErr(res.error);
      else { setSearchErr(null); setSearchResults(res.items); }
    }, 450);
    return () => clearTimeout(t);
  }, [q, searchOpen]);

  const results = searchResults;
  const addSong = (song) => { setQueue((prev) => [...prev, { id: `q_${Date.now()}`, code: nextCode(), title: song.title, artist: song.artist, duration: song.duration, votes: 1, addedBy: "Tú", hue: prev.length, youtubeId: song.youtubeId }]); setSearchOpen(false); setQ(""); };

  return (
    <div className="min-h-full w-full flex flex-col relative" style={{ background: T.bg, color: T.text }}>
      {T.aurora && <Aurora a1={T.a1} a2={T.a2} />}
      <div className="relative flex-1 overflow-y-auto px-4 pt-4">
        <TopBar T={T} avatar={avatar} setAvatar={setAvatar} onOpenSettings={() => setSettingsOpen(true)} locked={locked} />
        <div className="flex items-center justify-between mb-3">
          <ConnectedUsers T={T} />
          <button onClick={() => setSearchOpen(true)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border" style={{ borderColor: T.panelBorder, color: T.muted }}><Plus size={13} /> Agregar canción</button>
        </div>
        <ModeTabs T={T} screenMode={screenMode} setScreenMode={setScreenMode} />

        {screenMode === "letras" && <LyricsView T={T} song={currentSong} />}
        {screenMode === "playlists" && <PlaylistsView T={T} playlists={playlists} setPlaylists={setPlaylists} queue={queue} />}
        {screenMode === "concurso" && (
          <ConcursoHub T={T} performance={performance} setPerformance={setPerformance} leaderboard={leaderboard} setLeaderboard={setLeaderboard}
            protagonistaState={protagonistaState} setProtagonistaState={setProtagonistaState} desordenState={desordenState} setDesordenState={setDesordenState}
            reign={reign} setReign={setReign} />
        )}
        {screenMode === "musica" && (
          currentSong ? (
            <>
              <NowPlayingCard T={T} song={currentSong} playing={playing} onPlaySpotify={playOnSpotify} spotifyStatus={spotifyStatus} audioSource={audioSource} />
              <ProgressControls T={T} playing={playing} onToggle={togglePlay} elapsed={elapsed} duration={duration} onNext={() => selectSong(nextSongId(queue, currentSong?.id, 1))} onPrev={() => selectSong(nextSongId(queue, currentSong?.id, -1))} />
              <QuickActions T={T} queueCount={queue.length} onOpenQueue={() => setQueueOpen(!queueOpen)} />
              <QueuePanel T={T} queue={queue} open={queueOpen} setOpen={setQueueOpen} onSelect={selectSong} />
            </>
          ) : (
            <GlassPanel T={T} className="p-8 text-center">
              <Music2 size={28} style={{ color: T.muted, margin: "0 auto 10px" }} />
              <div className="font-bold mb-1" style={{ color: T.text }}>Tu sala está lista, pero vacía</div>
              <div className="text-xs mb-4" style={{ color: T.muted }}>Agrega la primera canción para empezar a sonar.</div>
              <button onClick={() => setSearchOpen(true)} className="px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: T.gradient, color: "#fff" }}>+ Agregar canción</button>
            </GlassPanel>
          )
        )}
        <div className="h-4" />
      </div>
      <BottomNav T={T} onScan={() => setRoomPanelOpen(true)} />
      {roomPanelOpen && <RoomPanel T={T} room={props.room} onClose={() => setRoomPanelOpen(false)} />}

      {searchOpen && (
        <div className="absolute inset-0 z-20 flex flex-col p-4" style={{ background: `${T.bg}f2`, backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 rounded-full px-4 py-3 border flex-1" style={{ background: T.panel, borderColor: T.panelBorder }}>
              <Search size={15} style={{ color: T.muted }} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca una canción o artista..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: T.text }} />
            </div>
            <button onClick={() => setSearchOpen(false)}><X size={20} style={{ color: T.muted }} /></button>
          </div>
          <div className="space-y-2 overflow-y-auto">
            {!q.trim() && <div className="text-center text-sm py-8" style={{ color: T.muted }}>Escribe el nombre de una canción o artista</div>}
            {q.trim() && searchErr === "no-key" && (
              <div className="text-center text-sm py-8 px-4" style={{ color: T.muted }}>La búsqueda todavía no está conectada (falta la clave de YouTube en Vercel).</div>
            )}
            {q.trim() && searchErr && searchErr !== "no-key" && (
              <div className="text-center text-sm py-8 px-4" style={{ color: T.muted }}>No se pudo buscar: {searchErr}</div>
            )}
            {q.trim() && !searchErr && searching && <div className="text-center text-sm py-8" style={{ color: T.muted }}>Buscando…</div>}
            {q.trim() && !searchErr && !searching && results.length === 0 && <div className="text-center text-sm py-8" style={{ color: T.muted }}>Sin resultados para "{q}"</div>}
            {results.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 border" style={{ background: T.panel, borderColor: T.panelBorder }}>
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                ) : (
                  <AlbumArt size={44} colors={HUES[(r.hue ?? 0) % HUES.length]} />
                )}
                <div className="flex-1 min-w-0"><div className="font-bold text-sm truncate" style={{ color: T.text }}>{r.title}</div><div className="text-xs truncate" style={{ color: T.muted }}>{r.artist} · {r.duration}</div></div>
                <button onClick={() => addSong(r)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: T.gradient }}><Plus size={16} color="#fff" strokeWidth={3} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {settingsOpen && <SettingsPanel T={T} accentId={accentId} setAccentId={setAccentId} mode={mode} setMode={setMode} locked={locked} setLocked={setLocked} password={password} setPassword={setPassword} soloMode={soloMode} setSoloMode={setSoloMode} audioSource={audioSource} setAudioSource={setAudioSource} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export default function App() {
  const { room, ready } = useRoom();
  const [queue, setQueueLocal] = useState([]);
  const [playlists, setPlaylists] = useState(INITIAL_PLAYLISTS);
  const [mode, setMode] = useState("dark");
  const [accentId, setAccentId] = useState("pulse");
  const [avatar, setAvatar] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [screenMode, setScreenMode] = useState("musica");
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [soloMode, setSoloMode] = useState(false);
  const [audioSource, setAudioSource] = useState("youtube"); // "youtube" | "spotify"
  const [performance, setPerformance] = useState(null);
  const [leaderboard, setLeaderboard] = useState(INITIAL_LEADERBOARD);
  const [reign, setReign] = useState(null);

  // Trae la cola real de Supabase y se mantiene sincronizada en vivo entre todos los celulares en la misma sala
  useEffect(() => {
    if (!room) return;
    const load = async () => {
      const { data } = await supabase.from("queue").select("*").eq("room_id", room.id).order("created_at", { ascending: true });
      setQueueLocal((data || []).map(rowToSong));
    };
    load();

    const channel = supabase
      .channel(`queue-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "queue", filter: `room_id=eq.${room.id}` }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room]);

  // API con la misma forma que usaba el resto de la app (queue, setQueue) pero que ahora escribe en Supabase de verdad
  const setQueue = async (updater) => {
    if (!room) return;
    const next = typeof updater === "function" ? updater(queue) : updater;
    const added = next.find((s) => !queue.some((q) => q.id === s.id));
    if (added) {
      await supabase.from("queue").insert({
        room_id: room.id,
        title: added.title,
        artist: added.artist,
        duration: added.duration,
        youtube_id: added.youtubeId,
        added_by: added.addedBy,
        votes: added.votes || 1,
        playing: false,
        hue: added.hue || 0,
      });
    }
  };

  const selectSongInRoom = async (id) => {
    if (!room) return;
    await supabase.from("queue").update({ playing: false }).eq("room_id", room.id);
    await supabase.from("queue").update({ playing: true }).eq("id", id);
    setPlaying(true);
  };

  const [protagonistaState, setProtagonistaState] = useState(() => {
    const start = Date.now();
    return { votes: Object.fromEntries(MOCK_USERS.map((u) => [u.name, 0])), roundEndsAt: start + DEMO_MS.round, deadlineAt: start + DEMO_MS.deadline, votedThisRound: false, winner: null };
  });
  const [desordenState, setDesordenState] = useState(() => ({ nextTriggerAt: Date.now() + DEMO_MS.cycle, active: null }));

  // tick: advance rounds / crown protagonista winner
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setProtagonistaState((s) => {
        if (s.winner) return s;
        if (now >= s.deadlineAt) {
          const top = Object.entries(s.votes).sort((a, b) => b[1] - a[1])[0];
          return { ...s, winner: top && top[1] > 0 ? top[0] : "Sin votos suficientes" };
        }
        if (now >= s.roundEndsAt) return { ...s, roundEndsAt: now + DEMO_MS.round, votedThisRound: false };
        return s;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const accent = PRESETS.find((p) => p.id === accentId) || PRESETS[0];
  const base = mode === "dark" ? DARK : LIGHT;
  const T = { ...base, a1: accent.a, a2: accent.b, gradient: `linear-gradient(90deg,${accent.a},${accent.b})` };

  if (!ready) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: "#050609", color: "#F4F5FA", fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="text-2xl font-black mb-2" style={{ fontFamily: "'Metal Mania', cursive" }}>Pulse</div>
          <div className="text-sm" style={{ color: "#8B90A8" }}>Preparando tu sala…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen" style={{ background: "#050609" }}>
      <link href="https://fonts.googleapis.com/css2?family=Metal+Mania&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <GlobalStyle />
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="w-full min-h-screen flex justify-center">
        <div className="w-full max-w-md min-h-screen">
          <VistaInvitado T={T} queue={queue} setQueue={setQueue} onSelectSong={selectSongInRoom} playlists={playlists} setPlaylists={setPlaylists}
            avatar={avatar} setAvatar={setAvatar} playing={playing} setPlaying={setPlaying}
            screenMode={screenMode} setScreenMode={setScreenMode} accentId={accentId} setAccentId={setAccentId}
            mode={mode} setMode={setMode} locked={locked} setLocked={setLocked} password={password} setPassword={setPassword}
            soloMode={soloMode} setSoloMode={setSoloMode} audioSource={audioSource} setAudioSource={setAudioSource} performance={performance} setPerformance={setPerformance}
            leaderboard={leaderboard} setLeaderboard={setLeaderboard} protagonistaState={protagonistaState} setProtagonistaState={setProtagonistaState}
            desordenState={desordenState} setDesordenState={setDesordenState} reign={reign} setReign={setReign} room={room} />
        </div>
      </div>
    </div>
  );
}
