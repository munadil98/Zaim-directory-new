import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { constitutionData, ConstitutionPage } from '../data/constitution';
import { BookOpen, ChevronLeft, ChevronRight, CornerDownLeft, List, Star } from 'lucide-react';

export default function ConstitutionBook() {
  const [currentPageIdx, setCurrentPageIdx] = useState(0); // Index of active left page (or single page on mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDualPage, setIsDualPage] = useState(false);

  const totalPages = constitutionData.length;

  useEffect(() => {
    const handleResize = () => {
      setIsDualPage(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNext = () => {
    const step = isDualPage ? 2 : 1;
    if (currentPageIdx + step < totalPages) {
      setCurrentPageIdx(prev => prev + step);
    } else if (currentPageIdx < totalPages - 1) {
      setCurrentPageIdx(totalPages - 1);
    }
  };

  const handlePrev = () => {
    const step = isDualPage ? 2 : 1;
    if (currentPageIdx - step >= 0) {
      setCurrentPageIdx(prev => prev - step);
    } else {
      setCurrentPageIdx(0);
    }
  };

  const jumpToPage = (idx: number) => {
    if (isDualPage) {
      // Align left index to even page index so the spread turns nicely
      const leftIdx = idx % 2 === 0 ? idx : idx - 1;
      setCurrentPageIdx(leftIdx);
    } else {
      setCurrentPageIdx(idx);
    }
    setIsSidebarOpen(false);
  };

  const isNextDisabled = isDualPage
    ? currentPageIdx + 2 >= totalPages
    : currentPageIdx === totalPages - 1;

  const isPrevDisabled = currentPageIdx === 0;

  const activePage = constitutionData[currentPageIdx];
  const isPageActive = (idx: number) => idx === currentPageIdx || (isDualPage && idx === currentPageIdx + 1);

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto px-1 select-none animate-fade-in mb-10 text-gray-850">
      
      {/* Visual Book Info Banner */}
      <div className="bg-white rounded-2xl p-3 sm:p-5 border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-emerald-600 shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">দস্তুরে আসাসী (Interactive Flip Book)</h2>
            <p className="text-[10px] sm:text-xs text-muted mt-0.5">সংবিধান, গঠনতন্ত্র ও শপথনামা - ডিজিটাল সংস্করণ</p>
          </div>
        </div>
        
        <div className="flex shrink-0">
          {/* Main Table of Contents Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-emerald-100 transition-colors cursor-pointer"
          >
            <List className="w-4 h-4" />
            <span>সূচীপত্র এবং পরিচ্ছেদ</span>
          </button>
        </div>
      </div>

      <div className="relative flex gap-4">
        {/* Table of Contents Drawer/Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Overlay backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
              />
              {/* Sidebar drawer */}
              <motion.div
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white h-full shadow-2xl p-5 flex flex-col border-r border-amber-900/10"
              >
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4 shrink-0">
                  <span className="font-bold text-gray-900 text-sm">অধ্যায় এবং সূচীপত্রসমূহ</span>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 px-2.5 py-1 rounded-lg hover:bg-gray-50 shrink-0 cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-900/10">
                  {constitutionData.map((page, idx) => (
                    <button
                      key={page.num}
                      onClick={() => jumpToPage(idx)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isPageActive(idx) 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="space-y-0.5 max-w-[85%]">
                        <p className="opacity-70 text-[10px] uppercase font-bold tracking-wide">{page.chapter}</p>
                        <p className="truncate font-sans">{page.title.split('\n')[0]}</p>
                      </div>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/10 text-right">Pg {page.num}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Skeuomorphic 3D book canvas */}
        <div className="w-full relative bg-gradient-to-b from-[#251a05] to-[#402e0c] p-2 sm:p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-2xl border-3 md:border-4 border-amber-950 flex flex-col items-center justify-center min-h-[450px] md:h-auto md:min-h-[500px] overflow-hidden">
          
          {/* Custom leather book binding visual effects */}
          {/* Inner page spread canvas */}
          <div className="relative w-full h-auto min-h-[420px] md:h-auto md:aspect-[16/10] bg-[#FAF6EE] rounded-2xl shadow-inner border border-amber-900/15 overflow-hidden flex flex-col md:flex-row shadow-2xl p-1.5 md:p-1.5">
            
            {/* Page Rendering inside animators */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPageIdx}
                initial={{ rotateY: 25, opacity: 0.8, scale: 0.98 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: -25, opacity: 0.8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="w-full h-auto md:h-full flex flex-col md:flex-row bg-[#FAF6EE] overflow-hidden"
              >
                {/* Active Page View (Left or Single Page) */}
                <div className="flex-1 h-auto min-h-[380px] md:h-full p-3 sm:p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-amber-900/10 relative overflow-hidden">
                  
                  {/* Subtle paper paper margin line */}
                  <div className="absolute top-2 bottom-2 left-3 w-px bg-red-500/15 pointer-events-none" />

                  {/* Pin Header */}
                  <div className="flex items-center justify-between border-b border-amber-900/5 pb-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-amber-900/40 tracking-wider">
                      {activePage.chapter}
                    </span>
                    <span className="font-mono text-xs text-amber-900/40 font-bold">PGS {activePage.num} / {totalPages}</span>
                  </div>

                  {/* Scrollable Main Content Section */}
                  <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-4 scrollbar-thin scrollbar-thumb-amber-900/20 scrollbar-track-transparent">
                    {/* Stylized Cover or oath vs standard page title */}
                    {activePage.type === 'cover' ? (
                      <div className="text-center py-4 space-y-4">
                        <BookOpen className="w-12 h-12 text-emerald-700 mx-auto animate-pulse" />
                        <h1 className="text-xl md:text-2xl font-black text-amber-950 font-sans tracking-tight leading-snug whitespace-pre-line">
                          {activePage.title}
                        </h1>
                      </div>
                    ) : activePage.type === 'oath' ? (
                      <div className="space-y-3">
                        <h2 className="text-sm md:text-base font-extrabold text-emerald-800 border-l-3 border-emerald-600 pl-2 font-sans">
                          {activePage.title}
                        </h2>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-950 text-xs font-serif leading-relaxed text-center font-bold tracking-wide">
                          {activePage.content.split('\n')[0]}
                        </div>
                      </div>
                    ) : (
                      <h2 className="text-sm md:text-base font-extrabold text-amber-950 border-l-3 border-emerald-600 pl-2 font-sans whitespace-pre-line">
                        {activePage.title}
                      </h2>
                    )}

                    {/* Content block content */}
                    <p className="text-xs md:text-sm text-gray-800 font-medium leading-relaxed font-sans whitespace-pre-line select-text">
                      {activePage.type === 'oath' 
                        ? activePage.content.split('\n').slice(1).join('\n')
                        : activePage.content}
                    </p>
                  </div>

                  {/* Pin Footer footnotes / Extra details */}
                  {activePage.subContent ? (
                    <div className="border-t border-amber-900/10 pt-2 shrink-0">
                      <p className="text-[10px] md:text-xs text-amber-900/60 font-sans italic whitespace-pre-line leading-relaxed">
                        {activePage.subContent}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Right page spread display (simulating desktop flow if next page is available) */}
                <div className="flex-1 h-full p-3 sm:p-6 md:p-8 flex flex-col justify-between relative bg-gradient-to-r from-[#FAF6EE] to-[#f2ece0] hidden md:flex overflow-hidden">
                  {/* Subtle margin line */}
                  <div className="absolute top-2 bottom-2 right-3 w-px bg-red-500/15 pointer-events-none" />

                  {currentPageIdx + 1 < totalPages ? (() => {
                    const nextPage = constitutionData[currentPageIdx + 1];
                    return (
                      <div className="flex flex-col h-full justify-between overflow-hidden">
                        {/* Header Pin */}
                        <div className="flex items-center justify-between border-b border-amber-900/5 pb-2 shrink-0">
                          <span className="text-[10px] uppercase font-bold text-amber-900/40 tracking-wider">
                            {nextPage.chapter}
                          </span>
                          <span className="font-mono text-xs text-amber-900/40 font-bold">PGS {nextPage.num} / {totalPages}</span>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-4 scrollbar-thin scrollbar-thumb-amber-900/20 scrollbar-track-transparent">
                          <h2 className="text-sm md:text-base font-extrabold text-amber-950 border-l-3 border-emerald-600 pl-2 font-sans whitespace-pre-line">
                            {nextPage.title}
                          </h2>
                          <p className="text-xs md:text-sm text-gray-800 font-medium leading-relaxed font-sans whitespace-pre-line select-text">
                            {nextPage.content}
                          </p>
                        </div>

                        {/* Footer Pin */}
                        {nextPage.subContent ? (
                          <div className="border-t border-amber-900/10 pt-2 shrink-0">
                            <p className="text-[10px] md:text-xs text-amber-900/60 font-sans italic whitespace-pre-line leading-relaxed">
                              {nextPage.subContent}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })() : (
                    /* Blank end sheet page style */
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="border border-dashed border-amber-900/20 rounded-2xl p-6 opacity-40">
                        <BookOpen className="w-8 h-8 mx-auto text-amber-950 mb-2" />
                        <p className="text-xs font-sans font-bold text-amber-950">মজলিস আনসারুল্লাহ্, বাংলাদেশ ডিরেক্টরি</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Skewomorphic Navigation controllers */}
      <div className="flex justify-between items-center gap-2 bg-white p-2.5 sm:p-4 rounded-2xl border border-black/5 shadow-sm">
        <button
          onClick={handlePrev}
          disabled={isPrevDisabled}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">পূর্ববর্তী পৃষ্ঠা</span>
          <span className="inline sm:hidden">পেছনে</span>
        </button>

        <span className="text-[11px] sm:text-xs font-bold text-gray-500 font-sans text-center truncate px-1 max-w-[40%] sm:max-w-none">
          <span className="hidden sm:inline">অধ্যায়: </span>
          <strong className="text-emerald-700 font-extrabold">{activePage.chapter}</strong>
          <span className="text-gray-400 font-normal"> (পৃষ্ঠা {activePage.num}{isDualPage && currentPageIdx + 1 < totalPages ? `-${constitutionData[currentPageIdx + 1].num}` : ''})</span>
        </span>

        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-emerald-200 shrink-0"
        >
          <span className="hidden sm:inline">পরবর্তী পৃষ্ঠা</span>
          <span className="inline sm:hidden">সামনে</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
