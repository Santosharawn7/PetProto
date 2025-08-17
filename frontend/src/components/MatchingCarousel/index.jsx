// Matching carousel
import React, { useRef, useEffect, useState } from "react";

const MatchingCarousel = ({ matches, onMatchClick }) => {
  const sliderRef = useRef(null);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const scrollToIndex = (index) => {
    const el = sliderRef.current;
    if (el && el.children[index]) {
      el.children[index].scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }
  };

  const scrollPrev = () => {
    if (visibleIndex > 0) {
      setVisibleIndex((prev) => prev - 1);
    }
  };

  const scrollNext = () => {
    if (visibleIndex < matches.length - 1) {
      setVisibleIndex((prev) => prev + 1);
    }
  };

  useEffect(() => {
    scrollToIndex(visibleIndex);
  }, [visibleIndex]);

  return (
    <div className="relative -mt-16 md:mt-4">
      {/* Left Button - Hidden on mobile */}
      <button
        onClick={scrollPrev}
        className="absolute z-10 -left-13 sm:left-2 top-1/2 -translate-y-1/2 bg-white text-gray-700 w-15 h-15 items-center justify-center rounded-full shadow-lg hover:bg-blue-800 hover:text-white transition text-3xl hidden md:flex"
        disabled={visibleIndex === 0}
      >
        ‹
      </button>

      {/* Carousel */}
      <div
        ref={sliderRef}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full touch-pan-x scrollbar-hide"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {matches.map((u, i) => (
          <div
            key={i}
            className="snap-center flex-shrink-0 w-full flex justify-center px-4"
            style={{ scrollSnapAlign: "center" }}
          >
            <div
              className="relative w-[28rem] h-[36rem] bg-black hover:scale-90 transition-transform cursor-pointer rounded-2xl overflow-hidden shadow-xl"
              onClick={() => onMatchClick(u)}
            >
              <img
                src={u.petProfile.image}
                alt={u.petProfile.name}
                className="w-full h-full rounded-3xl  border-10"
              />
              <h3 className="absolute bottom-4 left-4 text-5xl font-bold text-white border-5 drop-shadow-xl">
                {u.petProfile.name}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Right Button - Hidden on mobile */}
      <button
        onClick={scrollNext}
        className="absolute z-10 -right-13 sm:right-2 top-1/2 -translate-y-1/2 bg-white text-gray-700 w-15 h-15 items-center justify-center rounded-full shadow-lg hover:bg-blue-800 hover:text-white transition text-3xl hidden md:flex"
        disabled={visibleIndex === matches.length - 1}
      >
        ›
      </button>
    </div>
  );
};

export default MatchingCarousel;