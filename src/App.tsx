/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Phone, MessageCircle, Search, Users, MapPin, Loader2, ExternalLink, Star, BookOpen } from 'lucide-react';
import Papa from 'papaparse';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ConstitutionBook from './components/ConstitutionBook';
import { centralAmelaData, AmelaMember } from './data/centralAmela';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Contact {
  sl: string;
  majlis: string;
  name: string;
  mobile: string;
  district: string;
  districtNazem: string;
  districtNazemMobile: string;
  region: string;
  regionNazem: string;
  regionNazemMobile: string;
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1n3Xh_NQA8hqLtAocIFc2BmYeq4CDCCgmmdKfDPkdUto/export?format=csv';

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [amelaContacts, setAmelaContacts] = useState<AmelaMember[]>(centralAmelaData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'directory' | 'constitution'>('directory');
  const [currentView, setCurrentView] = useState<'directory' | 'amela' | 'district-nazem' | 'region-nazem'>('directory');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zaeem_directory_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchAmelaContacts();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    });
  }, []);

  // Clear search query when any filter is selected or changed to see all filtered data
  useEffect(() => {
    setSearchQuery('');
  }, [selectedRegion, selectedDistrict, showFavoritesOnly]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(SHEET_URL);
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        complete: (results) => {
          if (results.data && results.data.length > 4) {
            const dataRows = results.data.slice(4) as string[][];
            const parsedContacts: Contact[] = dataRows
              .filter(row => row && row[1] && row[2]) // Filter out empty rows
              .map(row => ({
                sl: row[0] || '',
                majlis: row[1] || '',
                name: row[2] || '',
                mobile: row[3] || '',
                district: row[4] || '',
                districtNazem: row[5] || '',
                districtNazemMobile: row[6] || '',
                region: row[7] || '',
                regionNazem: row[8] || '',
                regionNazemMobile: row[9] || '',
              }));
            
            setContacts(parsedContacts);
          } else {
            setError('শিটে কোনো তথ্য পাওয়া যায়নি');
          }
          setLoading(false);
        },
        error: (err: any) => {
          setError('Failed to parse contact data');
          setLoading(false);
        }
      });
    } catch (err) {
      setError('Failed to fetch contacts');
      setLoading(false);
    }
  };

  const fetchAmelaContacts = async () => {
    try {
      const amelaUrl = 'https://docs.google.com/spreadsheets/d/1n3Xh_NQA8hqLtAocIFc2BmYeq4CDCCgmmdKfDPkdUto/export?format=csv&gid=1476923702';
      const response = await fetch(amelaUrl);
      if (!response.ok) {
        console.warn('Could not fetch online Amela directory, using built-in data.');
        return;
      }
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const rows = results.data as string[][];
            const parsed: AmelaMember[] = [];
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length < 3) continue;
              
              const sl = (row[0] || '').replace(/^["']|["']$/g, '').trim();
              const name = (row[1] || '').replace(/^["']|["']$/g, '').trim();
              const designation = (row[2] || '').replace(/^["']|["']$/g, '').trim();
              const rawMobile = (row[3] || '').replace(/^["']|["']$/g, '').trim();
              
              // Skip title/header/empty rows
              if (!name || name === 'নাম' || name.includes('তালিকা') || name.includes('সদস্যদের') || name === 'Name') continue;
              if (!designation || designation === 'পদবী' || designation === 'Designation') continue;
              
              // Clean mobile number
              let mobile = rawMobile.replace(/\s+/g, '').replace(/-/g, '');
              if (mobile.startsWith('880')) {
                mobile = '0' + mobile.slice(3);
              }
              
              parsed.push({
                sl,
                name,
                designation,
                mobile
              });
            }
            
            if (parsed.length > 0) {
              setAmelaContacts(parsed);
              console.log('Successfully fetched and parsed Amela contacts:', parsed.length);
            }
          }
        },
        error: (err: any) => {
          console.error('Papa parse error for Amela', err);
        }
      });
    } catch (err) {
      console.error('Fetch error for Amela', err);
    }
  };

  const isFavorite = (name: string, mobile: string, type: string) => {
    const key = `${type}_${name || ''}_${mobile || ''}`;
    return favorites.includes(key);
  };

  const toggleFavorite = (name: string, mobile: string, type: string) => {
    const key = `${type}_${name || ''}_${mobile || ''}`;
    setFavorites(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      try {
        localStorage.setItem('zaeem_directory_favorites', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save favorites to localStorage', e);
      }
      return next;
    });
  };

  const districtNazems = useMemo(() => {
    const map = new Map();
    contacts.forEach(c => {
      if (c.district && c.districtNazem && !map.has(c.district)) {
        map.set(c.district, {
          district: c.district,
          name: c.districtNazem,
          mobile: c.districtNazemMobile,
          region: c.region
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.district.localeCompare(b.district, 'bn'));
  }, [contacts]);

  const regionsList = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach(c => {
      if (c.region) {
        set.add(c.region.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [contacts]);

  const districtsList = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach(c => {
      if (c.district) {
        if (!selectedRegion || c.region === selectedRegion) {
          set.add(c.district.trim());
        }
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [contacts, selectedRegion]);

  const regionNazems = useMemo(() => {
    const map = new Map();
    contacts.forEach(c => {
      if (c.region && c.regionNazem && !map.has(c.region)) {
        map.set(c.region, {
          region: c.region,
          name: c.regionNazem,
          mobile: c.regionNazemMobile
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.region.localeCompare(b.region, 'bn'));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    if (selectedDistrict) {
      filtered = filtered.filter(contact => contact.district === selectedDistrict);
    } else if (selectedRegion) {
      filtered = filtered.filter(contact => contact.region === selectedRegion);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(contact => isFavorite(contact.name, contact.mobile, 'zaeem'));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact => 
        (contact.name || '').toLowerCase().includes(query) ||
        (contact.majlis || '').toLowerCase().includes(query) ||
        (contact.district || '').toLowerCase().includes(query) ||
        (contact.region || '').toLowerCase().includes(query) ||
        (contact.mobile || '').includes(query)
      );
    }

    return filtered;
  }, [contacts, searchQuery, showFavoritesOnly, favorites, selectedDistrict, selectedRegion]);

  const filteredDistrictNazems = useMemo(() => {
    let filtered = districtNazems;

    if (selectedRegion) {
      filtered = filtered.filter(n => n.region === selectedRegion);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(n => isFavorite(n.name, n.mobile, 'district'));
    }

    if (!searchQuery) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(n => 
      n.name.toLowerCase().includes(query) || 
      n.district.toLowerCase().includes(query) ||
      n.mobile.includes(query)
    );
  }, [districtNazems, searchQuery, showFavoritesOnly, favorites, selectedRegion]);

  const filteredRegionNazems = useMemo(() => {
    let filtered = regionNazems;

    if (showFavoritesOnly) {
      filtered = filtered.filter(n => isFavorite(n.name, n.mobile, 'region'));
    }

    if (!searchQuery) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(n => 
      n.name.toLowerCase().includes(query) || 
      n.region.toLowerCase().includes(query) ||
      n.mobile.includes(query)
    );
  }, [regionNazems, searchQuery, showFavoritesOnly, favorites]);

  const filteredAmelaContacts = useMemo(() => {
    let filtered = amelaContacts;

    if (showFavoritesOnly) {
      filtered = filtered.filter(contact => isFavorite(contact.name, contact.mobile, 'amela'));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact => 
        (contact.name || '').toLowerCase().includes(query) ||
        (contact.designation || '').toLowerCase().includes(query) ||
        (contact.mobile || '').includes(query)
      );
    }

    return filtered;
  }, [amelaContacts, searchQuery, showFavoritesOnly, favorites]);

  const handleWhatsApp = (contact: any, type: 'zaeem' | 'amela' | 'district' | 'region' = 'zaeem') => {
    let message = '';
    if (type === 'zaeem') {
      message = `আসসালামু আলাইকুম\n জনাব ${contact.name}\n যয়িম(আলা) ${contact.majlis} মজলিস।`;
    } else if (type === 'amela') {
      message = `আসসালামু আলাইকুম\n জনাব ${contact.name}\n ${contact.designation}।`;
    } else if (type === 'district') {
      message = `আসসালামু আলাইকুম\n জনাব ${contact.name}\n জেলা নাযেম-আলা, ${contact.district} জেলা।`;
    } else if (type === 'region') {
      message = `আসসালামু আলাইকুম\n জনাব ${contact.name}\n রিজিওন নাযেম-আলা, ${contact.region} রিজিওন।`;
    }
    const encodedMessage = encodeURIComponent(message);
    const phone = (contact.mobile || '').replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const changeView = (view: 'directory' | 'amela' | 'district-nazem' | 'region-nazem') => {
    setCurrentView(view);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10 shadow-sm">
        <div className={cn("mx-auto px-4 pt-6 pb-4 transition-all duration-350", activeTab === 'directory' ? "max-w-2xl" : "max-w-4xl")}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">যয়ীম ডিরেক্টরি</h1>
              <p className="text-sm text-muted mt-1">মজলিস আনসারুল্লাহ্, বাংলাদেশ</p>
            </div>
            <div className="flex items-center gap-3">
              {showInstallBtn && (
                <button
                  onClick={handleInstallClick}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  ইন্সটল করুন
                </button>
              )}
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Primary View Toggles */}
          <div className="grid grid-cols-2 gap-1 grid-flow-row mb-4 bg-gray-50 p-1.5 rounded-2xl border border-black/5">
            <button
              onClick={() => setActiveTab('directory')}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === 'directory' 
                  ? "bg-white text-emerald-900 shadow-sm border border-black/5" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>ডিরেক্টরি (List)</span>
            </button>
            <button
              onClick={() => setActiveTab('constitution')}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === 'constitution' 
                  ? "bg-white text-emerald-900 shadow-sm border border-black/5" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>গঠনতন্ত্র (Book)</span>
            </button>
          </div>

          {activeTab === 'directory' && (
            <>
              {/* Navigation Tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                <button 
                  onClick={() => {
                    setSelectedDistrict(null);
                    setSelectedRegion(null);
                    changeView('directory');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    currentView === 'directory' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  যয়ীম ডিরেক্টরি
                </button>
                <button 
                  onClick={() => {
                    setSelectedDistrict(null);
                    setSelectedRegion(null);
                    changeView('amela');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    currentView === 'amela' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  কেন্দ্রীয় আমেলা
                </button>
                <button 
                  onClick={() => {
                    setSelectedDistrict(null);
                    setSelectedRegion(null);
                    changeView('district-nazem');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    currentView === 'district-nazem' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  জেলা নাযেম-আলা ডিরেক্টরি
                </button>
                <button 
                  onClick={() => {
                    setSelectedDistrict(null);
                    setSelectedRegion(null);
                    changeView('region-nazem');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    currentView === 'region-nazem' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  রিজিওন নাযেম-আলা ডিরেক্টরি
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder={
                    currentView === 'directory' ? "নাম, মজলিস বা জেলা দিয়ে খুঁজুন..." :
                    currentView === 'amela' ? "নাম বা পদবী দিয়ে খুঁজুন..." :
                    currentView === 'district-nazem' ? "নাম বা জেলা দিয়ে খুঁজুন..." :
                    "নাম বা রিজিওন দিয়ে খুঁজুন..."
                  }
                  className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Region and Zilla Filter Dropdowns */}
              {!loading && !error && currentView !== 'amela' && (
                <div className="grid grid-cols-2 gap-2 mt-3 animate-fade-in">
                  <div className="relative">
                    <select
                      id="region-filter-select"
                      value={selectedRegion || ''}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setSelectedRegion(val);
                        setSelectedDistrict(null); // Reset district when region changes
                        setSearchQuery('');
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200/70 border-0 rounded-xl py-2.5 pl-3 pr-8 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-semibold text-gray-700 cursor-pointer appearance-none transition-all"
                    >
                      <option value="">সব রিজিওন (All Regions)</option>
                      {regionsList.map(r => (
                        <option key={r} value={r}>{r} রিজিওন</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      id="district-filter-select"
                      value={selectedDistrict || ''}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setSelectedDistrict(val);
                        setSearchQuery('');
                        if (val) {
                          const match = contacts.find(c => c.district === val);
                          if (match && match.region) {
                            setSelectedRegion(match.region);
                          }
                        }
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200/70 border-0 rounded-xl py-2.5 pl-3 pr-8 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-semibold text-gray-700 cursor-pointer appearance-none transition-all"
                    >
                      <option value="">সব জেলা (All Districts)</option>
                      {districtsList.map(d => (
                        <option key={d} value={d}>{d} জেলা</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Favorites filter option */}
              <div className="flex items-center justify-between mt-3 px-1">
                <button
                  onClick={() => setShowFavoritesOnly(prev => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                    showFavoritesOnly 
                      ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-100" 
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <Star className={cn("w-3.5 h-3.5", showFavoritesOnly ? "text-white fill-white shadow-sm" : "text-amber-500")} />
                  <span>{showFavoritesOnly ? 'শুধু প্রিয় (চালু)' : 'শুধু প্রিয় তালিকা'}</span>
                </button>
                {showFavoritesOnly && (
                  <span className="text-xs text-amber-600 bg-amber-50/70 border border-amber-100 px-2 py-1 rounded-lg font-medium animate-fade-in">
                    প্রিয় তালিকা ফিল্টার করা রয়েছে
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={cn("mx-auto px-4 py-6 transition-all duration-350", activeTab === 'directory' ? "max-w-2xl" : "max-w-4xl")}>
        {/* Active Filter Breadcrumbs */}
        {!loading && !error && activeTab === 'directory' && (selectedRegion || selectedDistrict) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm bg-emerald-50 border border-emerald-100 px-4 py-3.5 rounded-2xl animate-fade-in text-gray-700">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">ফিল্টার:</span>
            
            <button
              onClick={() => {
                setSelectedRegion(null);
                setSelectedDistrict(null);
                changeView('region-nazem');
              }}
              className="hover:text-emerald-750 transition-colors font-semibold text-emerald-600 flex items-center gap-1 hover:underline"
            >
              সব রিজিওন
            </button>
            
            {selectedRegion && (
              <>
                <span className="text-gray-400 font-medium">/</span>
                <button
                  onClick={() => {
                    setSelectedDistrict(null);
                    changeView('district-nazem');
                  }}
                  className={cn(
                    "hover:text-emerald-750 transition-colors font-semibold text-emerald-600 hover:underline",
                    !selectedDistrict ? "text-emerald-800 font-bold" : ""
                  )}
                >
                  {selectedRegion} রিজিওন
                </button>
              </>
            )}

            {selectedDistrict && (
              <>
                <span className="text-gray-400 font-medium">/</span>
                <span className="text-emerald-850 font-bold">
                  {selectedDistrict} জেলা
                </span>
              </>
            )}

            <button
              onClick={() => {
                setSelectedRegion(null);
                setSelectedDistrict(null);
              }}
              className="ml-auto text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2.5 py-1.5 rounded-xl font-semibold transition-colors"
            >
              ফিল্টার মুছুন
            </button>
          </div>
        )}

        {activeTab === 'constitution' ? (
          <ConstitutionBook />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-muted font-medium">তথ্য লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={fetchContacts}
              className="mt-4 text-sm font-semibold text-red-700 underline underline-offset-4"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'directory' && (
              <>
                {currentView === 'directory' && (
                  <>
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    মোট {filteredContacts.length} জন পাওয়া গেছে
                  </span>
                </div>

                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact, index) => (
                    <div 
                      key={`${contact.mobile}-${index}`}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {contact.name}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(contact.name, contact.mobile, 'zaeem');
                              }}
                              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                              title={isFavorite(contact.name, contact.mobile, 'zaeem') ? "প্রিয় তালিকা থেকে বাদ দিন" : "প্রিয় তালিকায় যোগ করুন"}
                            >
                              <Star 
                                className={cn(
                                  "w-4 h-4 transition-all",
                                  isFavorite(contact.name, contact.mobile, 'zaeem') ? "text-amber-500 fill-amber-500" : "text-gray-300 hover:text-amber-400"
                                )} 
                              />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-y-2 gap-x-4">
                            <div className="flex items-center text-sm text-muted">
                              <Users className="w-4 h-4 mr-1.5 opacity-70" />
                              <span>{contact.majlis} মজলিস</span>
                            </div>
                            <div className="flex items-center text-sm text-muted">
                              <MapPin className="w-4 h-4 mr-1.5 opacity-70" />
                              <span>{contact.district} {contact.region ? `(${contact.region})` : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                          onClick={() => handleCall(contact.mobile)}
                          className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          <span>কল করুন</span>
                        </button>
                        <button
                          onClick={() => handleWhatsApp(contact, 'zaeem')}
                          className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>হোয়াটসঅ্যাপ</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    {showFavoritesOnly ? (
                      <div className="max-w-md mx-auto px-4">
                        <Star className="text-amber-400 mx-auto mb-4 w-12 h-12" />
                        <p className="text-gray-600 font-semibold text-lg">প্রিয় তালিকায় কেউ নেই</p>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                          যয়ীম সদস্যদের নামের পাশে থাকা তারকা (★) চিহ্নে ক্লিক করে সহজেই তাদেরকে প্রিয় তালিকায় যোগ করতে পারেন।
                        </p>
                      </div>
                    ) : (
                      <>
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">কোনো তথ্য পাওয়া যায়নি</p>
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-sm text-emerald-600 font-semibold"
                        >
                          সার্চ ক্লিয়ার করুন
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {currentView === 'amela' && (
              <>
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    মোট {filteredAmelaContacts.length} জন পাওয়া গেছে
                  </span>
                </div>

                {filteredAmelaContacts.length > 0 ? (
                  filteredAmelaContacts.map((contact, index) => (
                    <div 
                      key={`${contact.mobile}-${contact.sl}-${index}`}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 hover:shadow-md transition-shadow group animate-fade-in"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-150 shrink-0">
                              #{contact.sl}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {contact.name}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(contact.name, contact.mobile, 'amela');
                              }}
                              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                              title={isFavorite(contact.name, contact.mobile, 'amela') ? "প্রিয় তালিকা থেকে বাদ দিন" : "প্রিয় তালিকায় যোগ করুন"}
                            >
                              <Star 
                                className={cn(
                                  "w-4 h-4 transition-all",
                                  isFavorite(contact.name, contact.mobile, 'amela') ? "text-amber-500 fill-amber-500" : "text-gray-300 hover:text-amber-400"
                                )} 
                              />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-y-2 gap-x-4">
                            <div className="flex items-center text-sm text-gray-550">
                              <Users className="w-4 h-4 mr-1.5 text-emerald-650 opacity-70" />
                              <span className="font-semibold">{contact.designation}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                          onClick={() => handleCall(contact.mobile)}
                          className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          <span>কল করুন</span>
                        </button>
                        <button
                          onClick={() => handleWhatsApp(contact, 'amela')}
                          className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>হোয়াটসঅ্যাপ</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    {showFavoritesOnly ? (
                      <div className="max-w-md mx-auto px-4">
                        <Star className="text-amber-400 mx-auto mb-4 w-12 h-12" />
                        <p className="text-gray-600 font-semibold text-lg">প্রিয় তালিকায় কেউ নেই</p>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                          কেন্দ্রীয় আমেলা সদস্যদের নামের পাশে থাকা তারকা (★) চিহ্নে ক্লিক করে প্রিয় তালিকায় যোগ করতে পারেন।
                        </p>
                      </div>
                    ) : (
                      <>
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">কোনো তথ্য পাওয়া যায়নি</p>
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-sm text-emerald-600 font-semibold"
                        >
                          সার্চ ক্লিয়ার করুন
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {currentView === 'district-nazem' && (
              <>
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    মোট {filteredDistrictNazems.length} জন জেলা নাযেম-আলা ডিরেক্টরি পাওয়া গেছে
                  </span>
                </div>

                {filteredDistrictNazems.length > 0 ? (
                  filteredDistrictNazems.map((nazem, index) => (
                    <div 
                      key={`${nazem.mobile}-${index}`}
                      onClick={() => {
                        setSelectedDistrict(nazem.district);
                        if (nazem.region) {
                          setSelectedRegion(nazem.region);
                        }
                        setCurrentView('directory');
                        setSearchQuery('');
                      }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 hover:shadow-md transition-all group cursor-pointer hover:border-emerald-500/20 active:scale-[0.99]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                {nazem.name}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(nazem.name, nazem.mobile, 'district');
                                }}
                                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                title={isFavorite(nazem.name, nazem.mobile, 'district') ? "প্রিয় তালিকা থেকে বাদ দিন" : "প্রিয় তালিকায় যোগ করুন"}
                              >
                                <Star 
                                  className={cn(
                                    "w-4 h-4 transition-all",
                                    isFavorite(nazem.name, nazem.mobile, 'district') ? "text-amber-500 fill-amber-500" : "text-gray-300 hover:text-amber-400"
                                  )} 
                                />
                              </button>
                            </div>
                            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg group-hover:bg-emerald-100 transition-colors flex items-center gap-0.5">
                              যয়ীম তালিকা ➔
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1.5 opacity-70" />
                            <span>{nazem.district} জেলা</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(nazem.mobile);
                          }}
                          className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          <span>কল করুন</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(nazem, 'district');
                          }}
                          className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>হোয়াটসঅ্যাপ</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    {showFavoritesOnly ? (
                      <div className="max-w-md mx-auto px-4">
                        <Star className="text-amber-400 mx-auto mb-4 w-12 h-12" />
                        <p className="text-gray-600 font-semibold text-lg">প্রিয় তালিকায় কেউ নেই</p>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                          জেলা নাযেম-আলা সদস্যদের নামের পাশে থাকা তারকা (★) চিহ্নে ক্লিক করে প্রিয় তালিকায় যোগ করতে পারেন।
                        </p>
                      </div>
                    ) : (
                      <>
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">কোনো তথ্য পাওয়া যায়নি</p>
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-sm text-emerald-600 font-semibold"
                        >
                          সার্চ ক্লিয়ার করুন
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {currentView === 'region-nazem' && (
              <>
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    মোট {filteredRegionNazems.length} জন রিজিওন নাযেম-আলা ডিরেক্টরি পাওয়া গেছে
                  </span>
                </div>

                {filteredRegionNazems.length > 0 ? (
                  filteredRegionNazems.map((nazem, index) => (
                    <div 
                      key={`${nazem.mobile}-${index}`}
                      onClick={() => {
                        setSelectedRegion(nazem.region);
                        setCurrentView('district-nazem');
                        setSearchQuery('');
                      }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 hover:shadow-md transition-all group cursor-pointer hover:border-emerald-500/20 active:scale-[0.99]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                {nazem.name}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(nazem.name, nazem.mobile, 'region');
                                }}
                                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                title={isFavorite(nazem.name, nazem.mobile, 'region') ? "প্রিয় তালিকা থেকে বাদ দিন" : "প্রিয় তালিকায় যোগ করুন"}
                              >
                                <Star 
                                  className={cn(
                                    "w-4 h-4 transition-all",
                                    isFavorite(nazem.name, nazem.mobile, 'region') ? "text-amber-500 fill-amber-500" : "text-gray-300 hover:text-amber-400"
                                  )} 
                                />
                              </button>
                            </div>
                            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg group-hover:bg-emerald-100 transition-colors flex items-center gap-0.5">
                              জেলাসমূহ ➔
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1.5 opacity-70" />
                            <span>{nazem.region} রিজিওন</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(nazem.mobile);
                          }}
                          className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          <span>কল করুন</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(nazem, 'region');
                          }}
                          className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>হোয়াটসঅ্যাপ</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    {showFavoritesOnly ? (
                      <div className="max-w-md mx-auto px-4">
                        <Star className="text-amber-400 mx-auto mb-4 w-12 h-12" />
                        <p className="text-gray-600 font-semibold text-lg">প্রিয় তালিকায় কেউ নেই</p>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                          রিজিওন নাযেম-আলা সদস্যদের নামের পাশে থাকা তারকা (★) চিহ্নে ক্লিক করে প্রিয় তালিকায় যোগ করতে পারেন।
                        </p>
                      </div>
                    ) : (
                      <>
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">কোনো তথ্য পাওয়া যায়নি</p>
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-sm text-emerald-600 font-semibold"
                        >
                          সার্চ ক্লিয়ার করুন
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="h-px bg-gray-200 w-full mb-8" />
        <p className="text-xs text-muted leading-relaxed">
          মজলিস আনসারুল্লাহ্, বাংলাদেশ ডিরেক্টরি অ্যাপ<br />
          &copy; ২০২৬ সর্বস্বত্ব সংরক্ষিত
        </p>
        <a 
          href={SHEET_URL.replace('/export?format=csv', '/edit')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center mt-4 text-xs font-medium text-emerald-600 hover:underline"
        >
          গুগল শিট দেখুন <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </footer>
    </div>
  );
}
