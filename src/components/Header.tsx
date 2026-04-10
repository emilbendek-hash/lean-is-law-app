import { Bolt, Music, Volume2, Pause } from 'lucide-react';
import { UserProfile } from '../types';
import { useState, useEffect, useRef } from 'react';

interface HeaderProps {
  profile: UserProfile;
}

export default function Header({ profile }: HeaderProps) {
  const [greeting, setGreeting] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting('Good morning,');
      else if (hour >= 12 && hour < 18) setGreeting('Good afternoon,');
      else if (hour >= 18 && hour < 22) setGreeting('Good evening,');
      else setGreeting('Good night,');
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const openSpotify = () => {
    window.open('https://open.spotify.com/playlist/37i9dQZF1E8JYqk5ZFLh4K?si=ce4b06c0e84048c0', '_blank');
  };

  const toggleMotivation = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border-clinical/10 px-6 py-4">
      <audio 
        id="motivation-audio"
        ref={audioRef} 
        src="https://fluffy-marshmallow-e324d2.netlify.app/" 
        onEnded={() => setIsPlaying(false)}
        className="hidden"
        preload="auto"
      />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bolt className="w-5 h-5 text-accent-primary fill-accent-primary" />
          <span className="text-xl font-black tracking-[-0.08em] text-text-primary font-headline uppercase">
            LEAN<span className="text-text-muted/40">IS</span>LAW
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={openSpotify}
            className="w-8 h-8 rounded-full bg-card border border-border-clinical/10 flex items-center justify-center text-text-muted hover:text-accent-primary transition-colors"
            title="Spotify Playlist"
          >
            <Music className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleMotivation}
            className="w-8 h-8 rounded-full bg-card border border-border-clinical/10 flex items-center justify-center text-text-muted hover:text-accent-primary transition-colors"
            title="Motivational Voice Note"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-card border border-border-clinical/20 flex items-center justify-center overflow-hidden ml-1">
            {profile.pic ? (
              <img
                alt="User"
                src={profile.pic}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-accent-primary/10 flex items-center justify-center text-[10px] font-black text-accent-primary uppercase">
                {profile.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
