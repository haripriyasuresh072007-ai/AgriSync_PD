import React from 'react';
import { Sprout, LayoutDashboard, Ticket, MessageSquare, ShieldCheck, Languages, Mic } from 'lucide-react';

interface NavbarProps {
  currentTab: 'farmer' | 'pass' | 'admin' | 'sms';
  setCurrentTab: (tab: 'farmer' | 'pass' | 'admin' | 'sms') => void;
  hasActivePass: boolean;
  language: 'en' | 'hi' | 'pa' | 'ta';
  setLanguage: (lang: 'en' | 'hi' | 'pa' | 'ta') => void;
  onOpenReport?: () => void;
  onOpenTranscriber?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  hasActivePass,
  language,
  setLanguage,
  onOpenReport,
  onOpenTranscriber,
}) => {
  const translations = {
    en: {
      tagline: "Valuing the farmer's time, protecting the farmer's yield.",
      farmerTab: "Farmer Portal",
      passTab: "Gate Entry Pass",
      adminTab: "Admin Dashboard",
      smsTab: "SMS Simulator",
      badge: "SIH 2026 | Smart Agriculture",
    },
    hi: {
      tagline: "किसान का समय बचाएं, उपज की सुरक्षा करें।",
      farmerTab: "किसान पोर्टल",
      passTab: "गेट प्रवेश पास",
      adminTab: "मंडी एडमिन डैशबोर्ड",
      smsTab: "एसएमएस सिम्युलेटर",
      badge: "एसआईएच 2026 | स्मार्ट कृषि",
    },
    pa: {
      tagline: "ਕਿਸਾਨ ਦੇ ਸਮੇਂ ਦੀ ਕਦਰ, ਉਪਜ ਦੀ ਰੱਖਿਆ।",
      farmerTab: "ਕਿਸਾਨ ਪੋਰਟਲ",
      passTab: "ਗੇਟ ਐਂਟਰੀ ਪਾਸ",
      adminTab: "ਮੰਡੀ ਐਡਮਿਨ ਡੈਸ਼ਬੋਰਡ",
      smsTab: "ਐਸਐਮਐਸ ਸਿਮੂਲੇਟਰ",
      badge: "ਐਸਆਈਐਚ 2026 | ਸਮਾਰਟ ਖੇਤੀ",
    },
    ta: {
      tagline: "விவசாயியின் நேரத்தை மதித்து, விளைச்சலைப் பாதுகாப்போம்.",
      farmerTab: "விவசாயி போர்டல்",
      passTab: "நுழைவு அனுமதி அட்டை",
      adminTab: "நிர்வாக டாஷ்போர்டு",
      smsTab: "எஸ்.எம்.எஸ் சிமுலேட்டர்",
      badge: "எஸ்.ஐ.எச் 2026 | ஸ்மார்ட் விவசாயம்",
    },
  }[language];

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs">
      {/* Top micro banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-900 text-white text-xs px-4 py-1.5 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-400 text-stone-900">
            {translations.badge}
          </span>
          <span className="hidden sm:inline text-emerald-100 italic">
            "{translations.tagline}"
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloud Queue: Live Sync (Firebase)
          </span>
          {/* Language selector */}
          <div className="flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
            <Languages className="w-3.5 h-3.5 text-amber-300" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-1 rounded text-[11px] transition-colors ${language === 'en' ? 'bg-amber-400 text-stone-900 font-bold' : 'text-emerald-200 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1 rounded text-[11px] transition-colors ${language === 'hi' ? 'bg-amber-400 text-stone-900 font-bold' : 'text-emerald-200 hover:text-white'}`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('pa')}
              className={`px-1 rounded text-[11px] transition-colors ${language === 'pa' ? 'bg-amber-400 text-stone-900 font-bold' : 'text-emerald-200 hover:text-white'}`}
            >
              ਪੰਜਾਬੀ
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-1 rounded text-[11px] transition-colors ${language === 'ta' ? 'bg-amber-400 text-stone-900 font-bold' : 'text-emerald-200 hover:text-white'}`}
            >
              தமிழ்
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('farmer')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 border border-emerald-500/30">
              <Sprout className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-emerald-950 font-serif">
                  Agri<span className="text-emerald-600">Sync</span>
                </span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-300">
                  APMC Cloud
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
                Predictive Farmer Procurement & Queue Platform
              </p>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentTab('farmer')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'farmer'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-stone-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>{translations.farmerTab}</span>
            </button>

            <button
              onClick={() => setCurrentTab('pass')}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'pass'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-stone-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>{translations.passTab}</span>
              {hasActivePass && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white ring-1 ring-amber-400"></span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'admin'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-stone-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{translations.adminTab}</span>
              <span className="hidden md:inline text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-semibold ml-1">
                Mandi Live
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('sms')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all border border-amber-300/80 bg-amber-50/70 text-amber-900 hover:bg-amber-100 ${
                currentTab === 'sms' ? 'ring-2 ring-amber-500 font-semibold' : ''
              }`}
              title="Slide 7 Demo: SMS Offline-First Simulation"
            >
              <MessageSquare className="w-4 h-4 text-amber-700" />
              <span className="hidden sm:inline">{translations.smsTab}</span>
              <span className="sm:hidden">SMS</span>
            </button>

            {onOpenTranscriber && (
              <button
                onClick={onOpenTranscriber}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-semibold transition-all bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-xs hover:from-emerald-700 hover:to-emerald-800 cursor-pointer"
                title="Transcribe audio with gemini-3.5-transcribe"
              >
                <Mic className="w-4 h-4 text-amber-300 animate-pulse" />
                <span className="hidden md:inline">Transcribe Voice</span>
                <span className="md:hidden">Voice</span>
              </button>
            )}

            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-semibold transition-all bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                title="View Official Project Report"
              >
                <span className="hidden md:inline">Project Report</span>
                <span className="md:hidden">Report</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
