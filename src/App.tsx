import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StudentProfile, 
  DEFAULT_STUDENT_PROFILE, 
  evaluateAllCompanies, 
  evaluateShortlist,
  PredictionResult 
} from './lib/predictor';
import { sanitizeStudentProfile } from './lib/security';
import { TIET_COMPANIES } from './data/companies';
import { StudentConfigurator } from './components/StudentConfigurator';
import { CompanyTable } from './components/CompanyTable';
import { ShapWaterfall } from './components/ShapWaterfall';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { SkillCard } from './components/SkillCard';
import { CilpInsightsModal } from './components/CilpInsightsModal';
import { CommandPalette } from './components/CommandPalette';
import { OfficialReportModal } from './components/OfficialReportModal';
import { sound } from './lib/sound';
import { 
  BarChart3, 
  SlidersHorizontal, 
  ShieldCheck, 
  Cpu, 
  BookOpen, 
  Sun, 
  Moon, 
  TrendingUp,
  Building2,
  CheckCircle2,
  Sparkles,
  Command,
  Printer,
  Search,
  Volume2,
  VolumeX
} from 'lucide-react';

export function App() {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_STUDENT_PROFILE);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('google-swe');
  const [activeTab, setActiveTab] = useState<'SCREENER' | 'WHAT_IF' | 'SKILL_BADGE'>('SCREENER');
  const [isCilpModalOpen, setIsCilpModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Theme state: default to Light Mode as mandated by ui-ux-design-pro
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tnp_theme');
      if (stored === 'dark' || stored === 'light') return stored;
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tnp_theme', theme);
  }, [theme]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    sound.toggle();
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
    if (!next) sound.click();
  };

  // Memoized company predictions for optimal re-rendering efficiency
  const allPredictions = useMemo(() => evaluateAllCompanies(profile), [profile]);

  // Current selected company prediction for SHAP attribution
  const selectedCompany = useMemo(
    () => TIET_COMPANIES.find((c) => c.id === selectedCompanyId) || TIET_COMPANIES[0],
    [selectedCompanyId]
  );

  const selectedPrediction: PredictionResult = useMemo(
    () => evaluateShortlist(profile, selectedCompany),
    [profile, selectedCompany]
  );

  // Sanitized Handlers with zero-trust validation
  const handleResetProfile = useCallback(() => {
    sound.click();
    setProfile(DEFAULT_STUDENT_PROFILE);
  }, []);

  const handleProfileChange = useCallback((updated: Partial<StudentProfile>) => {
    setProfile((prev) => sanitizeStudentProfile({ ...prev, ...updated }));
  }, []);

  const handleApplySimulated = useCallback((simulated: StudentProfile) => {
    sound.success();
    setProfile(sanitizeStudentProfile(simulated));
  }, []);

  const handleUpdateOaScore = useCallback((oaScore: number, integrity: number) => {
    sound.success();
    setProfile((prev) => sanitizeStudentProfile({
      ...prev,
      oaMockScore: oaScore,
      proctorIntegrity: integrity,
    }));
  }, []);

  // Memoized top summary KPIs
  const eligibleCount = useMemo(() => allPredictions.filter((p) => p.isEligible).length, [allPredictions]);
  const highChanceCount = useMemo(() => allPredictions.filter((p) => p.probability >= 72).length, [allPredictions]);
  const avgProbability = useMemo(
    () => Math.round(allPredictions.reduce((acc, p) => acc + p.probability, 0) / (allPredictions.length || 1)),
    [allPredictions]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans dot-grid antialiased transition-colors duration-200">
      
      {/* ================= FROSTED HEADER ================= */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#0d1322]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  TnP Shortlist AI
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-semibold tracking-wide">
                  TIET CILP Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Placement probability forecasting & real-time SHAP feature attribution
              </p>
            </div>
          </div>

          {/* Quick Actions & Spotlight */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Spotlight Search Pill */}
            <button
              onClick={() => {
                sound.click();
                setIsCommandPaletteOpen(true);
              }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search companies & archetypes</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300">
                Ctrl K
              </kbd>
            </button>

            {/* Official Report Print / Export */}
            <button
              onClick={() => {
                sound.click();
                setIsReportModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Official Dossier</span>
            </button>

            {/* Cutoffs Dossier */}
            <button
              onClick={() => {
                sound.click();
                setIsCilpModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Cutoffs Dossier</span>
              <span className="sm:hidden">Dossier</span>
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute UI Audio' : 'Mute UI Audio'}
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center shadow-sm transition-all"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center shadow-sm transition-all"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 pb-2">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => {
                sound.click();
                setActiveTab('SCREENER');
              }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'SCREENER'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Shortlist Screener & SHAP</span>
            </button>

            <button
              onClick={() => {
                sound.click();
                setActiveTab('WHAT_IF');
              }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'WHAT_IF'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>What-If Simulator Workbench</span>
            </button>

            <button
              onClick={() => {
                sound.click();
                setActiveTab('SKILL_BADGE');
              }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'SKILL_BADGE'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Mock OA & Verified Skill Badge</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Bento Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Shortlist Rate</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {avgProbability}%
              </span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Across all tiers</span>
            </div>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" 
                style={{ width: `${avgProbability}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">High Probability Calls</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {highChanceCount} Firms
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">≥72% chance</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Strong competitive advantage in OA pool
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Eligible Drives</span>
              <Building2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {eligibleCount} / {allPredictions.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Drives</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Meets branch and minimum CGPA bar
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Candidate Benchmark</span>
              <Sparkles className="w-4 h-4 text-violet-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono truncate">
                {profile.branch}
              </span>
              <span className="text-xs text-violet-600 dark:text-violet-400 font-bold font-mono">
                {profile.cgpa.toFixed(2)} CGPA
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {profile.leetcodeSolved} LC • {profile.codeforcesRating} CF
            </p>
          </div>
        </div>

        {/* Student Profile Configurator Panel */}
        <StudentConfigurator
          profile={profile}
          onChange={handleProfileChange}
          onReset={handleResetProfile}
        />

        {/* Tab 1: Screener & SHAP Waterfall */}
        {activeTab === 'SCREENER' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Company Shortlist Probability Table */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <CompanyTable
                predictions={allPredictions}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={setSelectedCompanyId}
              />
            </div>

            {/* Right 5 cols: Interactive SHAP Waterfall Explanation */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <ShapWaterfall
                prediction={selectedPrediction}
                onOpenWhatIf={() => setActiveTab('WHAT_IF')}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Interactive What-If Simulator */}
        {activeTab === 'WHAT_IF' && (
          <div className="space-y-6">
            <WhatIfSimulator
              currentProfile={profile}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={setSelectedCompanyId}
              onApplySimulatedToProfile={handleApplySimulated}
            />

            {/* Accompanying SHAP Deep-Dive for the Selected Firm */}
            <div className="mt-6">
              <ShapWaterfall prediction={selectedPrediction} />
            </div>
          </div>
        )}

        {/* Tab 3: Mock OA Proctoring & Verified Skill Badge */}
        {activeTab === 'SKILL_BADGE' && (
          <SkillCard
            profile={profile}
            onUpdateScore={handleUpdateOaScore}
          />
        )}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] py-5 text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              TnP Shortlist AI • Thapar Institute of Engineering & Technology
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>In-Browser Monte Carlo & SHAP Engine</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Zero External API Keys</span>
          </div>
        </div>
      </footer>

      {/* CILP Insights & Historical Cutoff Modal */}
      <CilpInsightsModal
        isOpen={isCilpModalOpen}
        onClose={() => setIsCilpModalOpen(false)}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectCompany={setSelectedCompanyId}
        onSelectArchetype={setProfile}
        onSwitchTab={setActiveTab}
        onOpenCutoffs={() => setIsCilpModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        onToggleTheme={toggleTheme}
        isDark={theme === 'dark'}
      />

      {/* Official Placement Report Modal */}
      <OfficialReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        profile={profile}
        predictions={allPredictions}
      />
    </div>
  );
}

export default App;
