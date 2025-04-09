import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { Loader2 } from 'lucide-react';
const apiKey = import.meta.env.VITE_MOVIE_DB_API_KEY;
import { Tv, Clapperboard } from 'lucide-react';

function App() {
  const [movieData, setMovieData] = useState([]);

  useEffect(() => {
    getTrendingMovieData('movie');
  }, []);

  async function getTrendingMovieData(type) {
    try {
      let resp = await axios.get(
        `https://api.themoviedb.org/3/trending/${type}/day?api_key=${apiKey}&media_type=movie`
      );
      setMovieData(resp.data.results);
    } catch (e) {
      console.log(22, e);
    }
  }

  return (
    <>
      <div className='background_container'>
        <div className='button_container'>
          <button
            onClick={() => {
              getTrendingMovieData('movie');
            }}
          >
            <div className='flex items-center justify-evenly'>
              <div className='mx-[1rem]'>
                <Clapperboard />
              </div>
              <div>Trending Movies</div>
            </div>
          </button>
          <button
            onClick={() => {
              getTrendingMovieData('tv');
            }}
          >
            <div className='flex items-center justify-evenly'>
              <div className='mx-[1rem]'>
                <Tv />
              </div>
              <div>Trending TV</div>
            </div>
          </button>
        </div>
        <div class='flex flex-wrap bg-[#032541] justify-center'>
          {movieData.length !== 0 ? (
            <>
              {movieData.map((item) => (
                <div className='movie_item'>
                  <div className='text-center'>
                    <img
                      className='w-[300px]'
                      alt={'Movie or tv show'}
                      src={`https://image.tmdb.org/t/p/w500/${item.poster_path}`}
                    />
                    <div className='movie_name'>
                      {item.original_title
                        ? item.original_title
                        : item.original_name}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className='flex items-center justify-center h-screen w-full'>
              <Loader2 className='h-24 w-24 animate-spin text-[#084B81]' />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
