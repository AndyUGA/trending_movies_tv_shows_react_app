import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './App.css';
import { Loader2, Tv, Clapperboard, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const apiKey = import.meta.env.VITE_MOVIE_DB_API_KEY;

function App() {
  const [movieData, setMovieData] = useState([]);
  const [providerLogos, setProviderLogos] = useState({});
  const [trailerKeys, setTrailerKeys] = useState({});
  const [activeTab, setActiveTab] = useState('movie');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const fetchTrending = useCallback(async (type, pageNum, append) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setActiveTab(type);
      setProviderLogos({});
      setTrailerKeys({});
    }
    try {
      const resp = await axios.get(
        `https://api.themoviedb.org/3/trending/${type}/day?api_key=${apiKey}&page=${pageNum}`
      );
      const results = resp.data.results;
      setMovieData((prev) => {
        if (!append) return results;
        const existingIds = new Set(prev.map((item) => item.id));
        return [...prev, ...results.filter((item) => !existingIds.has(item.id))];
      });
      setPage(pageNum);
      setHasMore(pageNum < resp.data.total_pages);
      results.forEach((item) => {
        getProvider(item.id, type);
        if (type === 'movie') getTrailer(item.id);
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const getTrendingMovieData = useCallback(
    (type) => fetchTrending(type, 1, false),
    [fetchTrending]
  );

  useEffect(() => {
    getTrendingMovieData('movie');
  }, [getTrendingMovieData]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchTrending(activeTab, page + 1, true);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, page, hasMore, loading, loadingMore, fetchTrending]);

  async function getTrailer(id) {
    try {
      const resp = await axios.get(
        `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}`
      );
      const trailer = resp.data.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      );
      if (trailer) {
        setTrailerKeys((prev) => ({ ...prev, [id]: trailer.key }));
      }
    } catch (e) {
      console.error(`Failed to fetch trailer for ID ${id}`, e);
    }
  }

  async function getProvider(id, type) {
    try {
      const resp = await axios.get(
        `https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${apiKey}`
      );
      if (resp.data.results['US']?.flatrate) {
        const logoPath = resp.data.results['US'].flatrate[0].logo_path;
        setProviderLogos((prev) => ({
          ...prev,
          [id]: `https://image.tmdb.org/t/p/w500${logoPath}`,
        }));
      }
    } catch (e) {
      console.error(`Failed to fetch provider for ID ${id}`, e);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <header className="sticky top-0 z-50 bg-[#032541]/95 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center gap-3">
          <h1 className="text-white font-bold text-xl tracking-tight shrink-0">
            <span className="text-[#01b4e4]">Trending</span> Now
          </h1>

          <div className="flex bg-white/10 rounded-full p-1 gap-1">
            <button
              onClick={() => getTrendingMovieData('movie')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'movie'
                  ? 'bg-[#01b4e4] text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Clapperboard size={15} />
              Movies
            </button>
            <button
              onClick={() => getTrendingMovieData('tv')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'tv'
                  ? 'bg-[#01b4e4] text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Tv size={15} />
              TV Shows
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-14 w-14 animate-spin text-[#01b4e4]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {movieData.map((item) => (
              <Dialog key={item.id}>
                <DialogTrigger asChild>
                  <div className="movie-card group cursor-pointer">
                    <div className="relative overflow-hidden rounded-xl shadow-md">
                      <img
                        className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                        alt={item.original_title || item.original_name}
                        src={`https://image.tmdb.org/t/p/w500/${item.poster_path}`}
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-xs font-bold">
                          {item.vote_average?.toFixed(1)}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <span className="text-white text-xs leading-relaxed line-clamp-3">
                          {item.overview}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 px-0.5">
                      <p className="text-white text-sm font-semibold line-clamp-2 leading-snug">
                        {item.original_title || item.original_name}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {(item.release_date || item.first_air_date || '').slice(0, 4)}
                      </p>
                    </div>
                  </div>
                </DialogTrigger>

                <DialogContent className={`bg-[#0d1f35] border border-white/10 text-white p-0 overflow-hidden overflow-y-auto max-h-[90dvh] rounded-2xl ${trailerKeys[item.id] ? 'max-w-2xl' : 'max-w-lg'}`}>
                  {trailerKeys[item.id] && (
                    <div className="relative w-full aspect-video">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${trailerKeys[item.id]}`}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title={`${item.original_title} trailer`}
                      />
                    </div>
                  )}
                  <div className="flex flex-row">
                    {!trailerKeys[item.id] && (
                      <img
                        src={`https://image.tmdb.org/t/p/w500/${item.poster_path}`}
                        alt={item.original_title || item.original_name}
                        className="w-28 sm:w-36 object-cover shrink-0"
                      />
                    )}
                    <div className="p-5 flex flex-col gap-3 min-w-0">
                      <DialogHeader>
                        <DialogTitle className="text-white text-lg font-bold leading-tight">
                          {item.original_title || item.original_name}
                        </DialogTitle>
                        <div className="flex items-center gap-3 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                            {item.vote_average?.toFixed(1)}
                          </span>
                          <span>
                            {(item.release_date || item.first_air_date || '').slice(0, 4)}
                          </span>
                        </div>
                      </DialogHeader>
                      <DialogDescription className="text-white/75 text-sm leading-relaxed">
                        {item.overview}
                      </DialogDescription>
                      {providerLogos[item.id] && (
                        <div className="mt-auto pt-3 border-t border-white/10">
                          <p className="text-white/40 text-xs mb-2">Available on</p>
                          <img
                            src={providerLogos[item.id]}
                            alt="Streaming provider"
                            className="h-8 w-8 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />

        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#01b4e4]" />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
