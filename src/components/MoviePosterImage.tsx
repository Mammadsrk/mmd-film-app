import React, { useState, useEffect } from 'react';
import { Film } from 'lucide-react';

interface MoviePosterImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export const MoviePosterImage: React.FC<MoviePosterImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src || '');
  const [hasTriedProxy, setHasTriedProxy] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(!src);

  useEffect(() => {
    setCurrentSrc(src || '');
    setHasTriedProxy(false);
    setIsError(!src);
  }, [src]);

  const handleError = () => {
    if (!hasTriedProxy && currentSrc && !currentSrc.startsWith('/api/image-proxy')) {
      setHasTriedProxy(true);
      setCurrentSrc(`/api/image-proxy?url=${encodeURIComponent(currentSrc)}`);
    } else {
      setIsError(true);
    }
  };

  if (isError || !currentSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 p-2 text-center select-none">
        <Film className="w-8 h-8 mb-1.5 opacity-40 text-amber-500" />
        <span className="text-[10px] font-persian line-clamp-2 px-1 text-zinc-400">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  );
};
