"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Surah } from "@/lib/surahs";
import { translations, Language } from "@/lib/translations";

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
}

const RECITERS = [
  { id: "ar.alafasy", name: "Mishari Alafasy" },
  { id: "ar.abdurrahmaansudais", name: "Abdur-Rahman As-Sudais" },
  { id: "ar.mahermuaiqly", name: "Maher Al Muaiqly" },
  { id: "ar.minshawi", name: "Al-Minshawi" },
  { id: "ar.husary", name: "Al-Husary" },
  { id: "ar.abdulsamad", name: "Abdul Samad" },
  { id: "ar.shaatree", name: "Abu Bakr Ash-Shaatree" },
  { id: "ar.ahmedajamy", name: "Ahmed Al Ajamy" },
  { id: "ar.hudhaify", name: "Al-Hudhaify" },
  { id: "ar.saoodshuraym", name: "Saood As-Shuraym" }
];

export default function Home() {
  const [lang, setLang] = useState<Language>("ar");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reciter, setReciter] = useState("ar.alafasy");
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [ayahCache, setAyahCache] = useState<Record<number, Ayah[]>>({});
  const [loading, setLoading] = useState(false);
  const [dbSurahs, setDbSurahs] = useState<Surah[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(true);

  useEffect(() => {
    fetch('/api/surahs')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setDbSurahs(data);
        }
        setLoadingSurahs(false);
      })
      .catch(err => {
        console.error("Database fetch error:", err);
        setLoadingSurahs(false);
      });
  }, []);

  // Customization State
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("font-arabic");
  const [fontColor, setFontColor] = useState("text-zinc-900 dark:text-white");
  const [showSettings, setShowSettings] = useState(false);

  // Audio State
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedSurah) {
      if (activeAudio) {
        activeAudio.pause();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveAudio(null);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlayingAyah(null);
      }
      return;
    }

    const cachedAyahs = ayahCache[selectedSurah.number];
    if (cachedAyahs) {
      setAyahs(cachedAyahs);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`https://api.alquran.cloud/v1/surah/${selectedSurah.number}`)
      .then((res) => res.json())
      .then((data) => {
        setAyahs(data.data.ayahs);
        setAyahCache((prev) => ({
          ...prev,
          [selectedSurah.number]: data.data.ayahs,
        }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedSurah, activeAudio, ayahCache]);

  const playAyahAudio = (ayahNumberInSurah: number) => {
    if (!selectedSurah) return;

    // Stop previous audio
    if (activeAudio) {
      activeAudio.pause();
    }

    // Use reliable external CDN
    const ayah = ayahs.find(a => a.numberInSurah === ayahNumberInSurah);
    if (!ayah) return;

    const audioUrl = `https://cdn.islamic.network/quran/audio/128/${reciter}/${ayah.number}.mp3`;

    try {
      const audio = new Audio(audioUrl);
      audio.onerror = () => {
        // Silently stop if audio fails to load (e.g. network/CORS/CDN issue)
        setPlayingAyah(null);
      };

      audio.onended = () => {
        setPlayingAyah(null);
        setActiveAudio(null);
      };

      setActiveAudio(audio);
      setPlayingAyah(ayah.number);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore playback errors in production to keep console clean
          setPlayingAyah(null);
        });
      }
    } catch {
      // Swallow unexpected errors to avoid noisy console logs
      setPlayingAyah(null);
    }
  };

  const filteredSurahs = dbSurahs.filter(
    (s) =>
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.includes(searchQuery) ||
      s.number.toString() === searchQuery ||
      s.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFontClass = () => {
    if (lang === "ar") return "font-arabic";
    if (lang === "ur") return "font-urdu";
    return "font-sans";
  };

  return (
    <div className={`min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500/30 overflow-x-hidden ${getFontClass()}`} dir={t.dir}>
      <div className="noise" />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-emerald-900/10 dark:border-white/5 bg-emerald-100/50 dark:bg-emerald-950/10 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/20">
              <span className="font-arabic text-2xl font-bold text-white dark:text-black">ق</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{lang === "en" ? "Al-Mu'allim" : lang === "ar" ? "المُعلّم" : "المعلم"}</h1>
              <p className="text-[10px] font-medium tracking-[0.2em] text-emerald-700 dark:text-emerald-500 uppercase">Bloom Quran Tutor</p>
            </div>
          </div>
          <div className="hidden items-center gap-10 md:flex">
            <a href="#" className="text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">{t.nav.surahs}</a>
            <a href="#" className="text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">{t.nav.juz}</a>
            <a href="#" className="text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">{t.nav.tajweed}</a>
            <a href="#" className="text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">{t.nav.bookmarks}</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/50 dark:bg-zinc-100 dark:bg-zinc-900/50 bg-zinc-100 rounded-full p-1 border border-black/5 dark:border-emerald-900/10 dark:border-white/5">
              {(["ar", "en", "ur"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${lang === l ? "bg-emerald-500 text-white dark:text-black px-4" : "text-zinc-600 dark:text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <select 
              value={reciter} 
              onChange={(e) => setReciter(e.target.value)} 
              className="bg-transparent border border-emerald-900/10 dark:border-white/5 rounded-full px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 outline-none"
            >
              {RECITERS.map(r => (
                <option key={r.id} value={r.id} className="text-black dark:text-white bg-zinc-100 dark:bg-zinc-900">
                  {r.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full p-2 bg-emerald-50 dark:bg-zinc-100 dark:bg-zinc-900/50 text-emerald-600 dark:text-zinc-600 dark:text-zinc-400 hover:text-emerald-800 dark:hover:text-zinc-900 dark:text-white transition-colors border border-emerald-900/10 dark:border-emerald-900/10 dark:border-white/5"
            >
              {mounted ? (theme === "dark" ? <Sun size={20} /> : <Moon size={20} />) : <div className="w-5 h-5"/>}
            </button>
            <button className="rounded-full bg-zinc-900 dark:bg-white px-6 py-2 text-sm font-bold text-white dark:text-black hover:bg-zinc-200 transition-all active:scale-95">
              {t.nav.signIn}
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-24">
        {/* Hero Section */}
        <section className="relative py-24 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 blur-[120px]" />
          <h2 className="mb-8 text-6xl font-extrabold tracking-tight sm:text-8xl leading-tight">
            {t.hero.title}<span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{t.hero.titleAccent}</span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-xl text-zinc-600 dark:text-zinc-400 sm:text-2xl">
            {t.hero.subtitle}
          </p>

          <div className="mx-auto max-w-3xl">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/50 to-teal-500/50 rounded-2xl opacity-20 group-hover:opacity-40 blur-xl transition duration-1000"></div>
              <div className="relative flex items-center bg-emerald-50 dark:bg-[#081a11] rounded-2xl border border-emerald-900/15 dark:border-white/10 p-3 shadow-2xl">
                <div className={`${t.dir === "rtl" ? "mr-4" : "ml-4"}`}>
                  <svg className="h-6 w-6 text-zinc-500 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t.hero.searchPlaceholder}
                  className="w-full bg-transparent px-4 py-3 text-2xl outline-none placeholder:text-zinc-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-8 py-3 font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all text-lg">
                  {t.hero.searchButton}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Surah Grid */}
        <section>
          <div className="mb-12 flex items-center justify-between">
            <h3 className="text-3xl font-bold">{t.list.title}</h3>
            <div className="flex gap-3">
              <button className="rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-emerald-900/10 dark:border-white/5 p-3 hover:bg-zinc-200 dark:bg-zinc-800 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-700 dark:text-emerald-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {loadingSurahs ? (
            <div className="py-32 text-center">
              <div className="mx-auto h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-zinc-500 dark:text-zinc-500 mt-4">{t.modal?.loading || "Connecting to MySQL Database..."}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSurahs.map((surah) => (
                  <div
                    key={surah.number}
                    onClick={() => setSelectedSurah(surah)}
                    className="group relative overflow-hidden rounded-3xl border border-emerald-900/10 dark:border-white/5 bg-emerald-50 dark:bg-[#081a11] p-6 transition-all hover:border-emerald-500/30 hover:bg-emerald-100 dark:bg-[#0c261a] hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex h-12 w-12 rotate-45 items-center justify-center rounded-xl bg-emerald-900/5 dark:bg-white/5 group-hover:bg-emerald-500 text-zinc-900 dark:text-white transition-all duration-500">
                        <span className="-rotate-45 text-lg font-bold text-zinc-800 dark:text-white">{surah.number}</span>
                      </div>
                      <span className="font-arabic text-3xl font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors">
                        {surah.name}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{surah.englishName}</h4>
                      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-500 font-medium tracking-wide uppercase">
                        <span>{surah.englishNameTranslation}</span>
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50"></span>
                          {surah.numberOfAyahs} {t.list.verses}
                        </span>
                      </div>
                    </div>
                    {/* Large Background Calligraphy Decor */}
                    <div className={`absolute bottom-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none ${t.dir === "rtl" ? "left-[-20px]" : "right-[-20px]"}`}>
                      <span className="font-arabic text-[140px] leading-none select-none">{surah.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSurahs.length === 0 && (
                <div className="py-32 text-center">
                  <span className="block text-5xl mb-6">🔍</span>
                  <p className="text-zinc-500 dark:text-zinc-500 text-xl">{t.list.noResults}</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Reading Modal */}
      {selectedSurah && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-900 dark:bg-white dark:bg-[#020805]/95 backdrop-blur-sm"
            onClick={() => setSelectedSurah(null)}
          ></div>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-emerald-900/15 dark:border-white/10 bg-emerald-50 dark:bg-[#06140e] shadow-2xl flex flex-col" dir={t.dir}>
            <div className="flex items-center justify-between border-b border-emerald-900/10 dark:border-white/5 p-6 bg-emerald-100/80 dark:bg-emerald-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-900/5 dark:bg-white/5 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                  {selectedSurah.number}
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-arabic">{selectedSurah.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 font-medium uppercase tracking-widest">{selectedSurah.englishName} • {selectedSurah.englishNameTranslation}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`rounded-full p-2 transition-colors ${showSettings ? "bg-emerald-500 text-white dark:text-black" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white"}`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedSurah(null)}
                  className="rounded-full bg-zinc-100 dark:bg-zinc-900 p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Customization Panel */}
            {showSettings && (
              <div className="bg-zinc-900 dark:bg-white dark:bg-[#050505] border-b border-emerald-900/10 dark:border-white/5 p-6 animate-in slide-in-from-top duration-300">
                <div className="mx-auto max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Font Size */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest block">{t.modal.fontSize}</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setFontSize(Math.max(24, fontSize - 4))} className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-emerald-900/10 dark:border-white/5 hover:bg-zinc-200 dark:bg-zinc-800 transition-colors">-</button>
                      <span className="text-xl font-bold min-w-[3rem] text-center">{fontSize}px</span>
                      <button onClick={() => setFontSize(Math.min(96, fontSize + 4))} className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-emerald-900/10 dark:border-white/5 hover:bg-zinc-200 dark:bg-zinc-800 transition-colors">+</button>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest block">{t.modal.fontStyle}</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border border-emerald-900/10 dark:border-white/5 rounded-xl px-4 py-2 outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      <option value="font-arabic">{t.modal.fontNames.amiri}</option>
                      <option value="font-urdu">{t.modal.fontNames.urdu}</option>
                      <option value="font-sans">{t.modal.fontNames.sans}</option>
                    </select>
                  </div>

                  {/* Font Color */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest block">{t.modal.fontColor}</label>
                    <div className="flex gap-3">
                      {[
                        { val: "text-zinc-900 dark:text-white", hex: "bg-zinc-900 dark:bg-white" },
                        { val: "text-emerald-600 dark:text-emerald-400", hex: "bg-emerald-400" },
                        { val: "text-amber-200", hex: "bg-amber-200" },
                        { val: "text-zinc-600 dark:text-zinc-400", hex: "bg-zinc-400" }
                      ].map((c) => (
                        <button
                          key={c.val}
                          onClick={() => setFontColor(c.val)}
                          className={`h-8 w-8 rounded-full ${c.hex} border-2 transition-all ${fontColor === c.val ? "border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20" : "border-transparent opacity-50 hover:opacity-100"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-12 text-center space-y-12">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                  <p className="text-zinc-500 dark:text-zinc-500">{t.modal.loading}</p>
                </div>
              ) : (
                <>
                  <div className="text-4xl font-arabic text-emerald-600 dark:text-emerald-400 mb-16 select-none">
                    {t.modal.bismillah}
                  </div>
                  <div className={`space-y-16 leading-[3.5] ${t.dir === "rtl" ? "text-right" : "text-left"}`}>
                    {ayahs.map((ayah) => (
                      <div
                        key={ayah.number}
                        className={`inline-block group tracking-wide transition-all duration-300 cursor-pointer rounded-2xl px-4 py-2 ${fontFamily} ${fontColor} ${playingAyah === ayah.number ? "animate-ayah-active border shadow-[0_0_30px_rgba(16,185,129,0.2)]" : "opacity-90 hover:opacity-100 hover:bg-emerald-900/5 dark:bg-white/5"}`}
                        style={{ fontSize: `${fontSize}px` }}
                        onMouseEnter={() => playAyahAudio(ayah.numberInSurah)}
                      >
                        <span className="hover:opacity-80 transition-opacity">
                          {ayah.text}
                        </span>
                        <span className={`mx-4 inline-flex items-center justify-center rounded-full border transition-colors ${playingAyah === ayah.number ? "border-emerald-500 text-emerald-700 dark:text-emerald-500 bg-emerald-500/10" : "border-current opacity-30"} text-xs font-bold align-middle`} style={{ width: `${fontSize / 1.5}px`, height: `${fontSize / 1.5}px` }}>
                          {ayah.numberInSurah}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-emerald-900/10 dark:border-white/5 p-6 bg-emerald-100/80 dark:bg-emerald-950/20 text-center">
              <button
                className="mx-auto rounded-full bg-emerald-500 px-12 py-4 text-lg font-bold text-white dark:text-black hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
              >
                {t.modal.play}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-emerald-900/10 dark:border-white/5 py-16 bg-zinc-900 dark:bg-white dark:bg-[#020805]">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mb-6 flex justify-center gap-6">
            <a href="#" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-emerald-200/50 dark:bg-emerald-950/40 border border-emerald-900/10 dark:border-white/5 flex items-center justify-center cursor-pointer hover:bg-emerald-900/60 transition-colors">𝕏</a>
            <a href="https://www.linkedin.com/feed/?trk=guest_homepage-basic_google-one-tap-submit" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-emerald-200/50 dark:bg-emerald-950/40 border border-emerald-900/10 dark:border-white/5 flex items-center justify-center cursor-pointer hover:bg-emerald-900/60 transition-colors">In</a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-emerald-200/50 dark:bg-emerald-950/40 border border-emerald-900/10 dark:border-white/5 flex items-center justify-center cursor-pointer hover:bg-emerald-900/60 transition-colors">📸</a>
          </div>
          <p className="text-zinc-600">
            {t.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
