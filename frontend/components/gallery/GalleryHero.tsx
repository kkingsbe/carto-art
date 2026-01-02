export default function GalleryHero() {
  return (
    <div className="relative min-h-[40vh] md:min-h-[50vh] bg-gradient-to-br from-[#0a0f1a] via-[#141d2e] to-[#0a0f1a] overflow-hidden">
      {/* Topographic pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245, 240, 232, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 240, 232, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[40vh] md:min-h-[50vh] px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-4 md:mb-6 bg-gradient-to-r from-[#c9a962] to-[#b87333] bg-clip-text text-transparent">
          Community Gallery
        </h1>

        <p className="text-lg md:text-xl lg:text-2xl text-[#f5f0e8] text-center max-w-3xl mb-8 md:mb-12">
          Discover stunning map posters created by the community
        </p>

        {/* Optional stats badges */}
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl md:text-3xl font-bold text-[#c9a962]">500+</div>
            <div className="text-sm text-[#d4cfc4]">Maps</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl md:text-3xl font-bold text-[#c9a962]">100+</div>
            <div className="text-sm text-[#d4cfc4]">Creators</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl md:text-3xl font-bold text-[#c9a962]">50+</div>
            <div className="text-sm text-[#d4cfc4]">This Week</div>
          </div>
        </div>
      </div>
    </div>
  );
}
