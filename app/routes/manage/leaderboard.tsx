import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { cn } from '~/util/utils';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { apiManage } from '~/util/api';

interface LeaderboardEntryRaw {
  id: string;
  userId: string;
  name: string;
  score: number;
  personaName: string;
  scenarioName?: string;
}

interface LeaderboardResponse {
  success: boolean;
  entries: LeaderboardEntryRaw[];
  metadata: {
    totalEntries: number;
    lastUpdated: string;
  };
}

interface LeaderboardEntry extends LeaderboardEntryRaw {
  rank: number;
  initials: string;
}

interface FilterOption {
  value: string;
  label: string;
  badge?: string;
}

interface RankStyle {
  gradient?: string;
  backgroundColor?: string;
}

interface ScenarioStyle {
  badgeBg: string;
  badgeText: string;
  selectedBadgeBg: string;
  selectedBadgeText: string;
  selectedItemBg: string;
  selectedItemText: string;
}

/**
 * MOCK DATA - Replace with real API integration
 */
const MOCK_POTENTIAL_ENTRIES: Omit<LeaderboardEntryRaw, 'id'>[] = [
  {
    userId: 'user-001',
    name: 'Ester Gracia',
    score: 97,
    personaName: 'Daniel',
    scenarioName: 'Client Onboarding',
  },
  {
    userId: 'user-002',
    name: 'Andre Gunawan',
    score: 90,
    personaName: 'Daniel',
    scenarioName: 'Client Upgrade',
  },
  {
    userId: 'user-003',
    name: 'Everett',
    score: 88,
    personaName: 'Daniel',
    scenarioName: 'Client Onboarding',
  },
  {
    userId: 'user-004',
    name: 'Vionica Filia Agustus Fiorentina November Desember',
    score: 86,
    personaName: 'Daniel',
    scenarioName: 'Client Upgrade',
  },
  {
    userId: 'user-005',
    name: 'Marcus Timothy',
    score: 84,
    personaName: 'Daniel',
    scenarioName: 'Client Upgrade',
  },
  {
    userId: 'user-006',
    name: 'Sarah Johnson',
    score: 92,
    personaName: 'Mellisa',
    scenarioName: 'Client Onboarding',
  },
  {
    userId: 'user-007',
    name: 'David Chen',
    score: 85,
    personaName: 'Rohan',
    scenarioName: 'Client Upgrade',
  },
  {
    userId: 'user-008',
    name: 'Emma Wilson',
    score: 89,
    personaName: 'Sophie',
    scenarioName: 'Client Onboarding',
  },
];

let mockCurrentEntries: LeaderboardEntryRaw[] = [];

/**
 * Frontend utility: Generate initials from a name
 */
const generateInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const fetchMockLeaderboard = async (): Promise<LeaderboardResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Simulate dynamic data changes
  const shouldAddNew =
    mockCurrentEntries.length === 0 ||
    (mockCurrentEntries.length < MOCK_POTENTIAL_ENTRIES.length && Math.random() > 0.4);

  if (shouldAddNew) {
    // Add a new entry
    const availableEntries = MOCK_POTENTIAL_ENTRIES.filter(
      (entry) => !mockCurrentEntries.some((existing) => existing.userId === entry.userId),
    );

    if (availableEntries.length > 0) {
      const randomEntry =
        availableEntries[Math.floor(Math.random() * availableEntries.length)];
      const newEntry: LeaderboardEntryRaw = {
        ...randomEntry,
        id: `entry-${Date.now()}-${Math.random()}`,
        score: randomEntry.score + Math.floor(Math.random() * 10) - 5,
      };
      mockCurrentEntries = [...mockCurrentEntries, newEntry];
    }
  } else if (mockCurrentEntries.length > 0) {
    // Update an existing entry's score
    const randomIndex = Math.floor(Math.random() * mockCurrentEntries.length);
    const entryToUpdate = mockCurrentEntries[randomIndex];
    const scoreChange = Math.floor(Math.random() * 6) - 2;
    const newScore = Math.max(0, entryToUpdate.score + scoreChange);

    mockCurrentEntries = mockCurrentEntries.map((entry, index) =>
      index === randomIndex ? { ...entry, score: newScore } : entry,
    );
  }

  // Sort by score (backend would do this)
  const sortedEntries = [...mockCurrentEntries].sort((a, b) => b.score - a.score);

  // Return API-like response (raw data, no computed fields)
  return {
    success: true,
    entries: sortedEntries,
    metadata: {
      totalEntries: sortedEntries.length,
      lastUpdated: new Date().toISOString(),
    },
  };
};

const fetchRealLeaderboard = async (): Promise<LeaderboardResponse> => {
  return apiManage().url('/manage/leaderboard').get().json<LeaderboardResponse>();
};

/**
 * Configuration for rank-based styling
 */
const RANK_STYLES: Record<number, RankStyle> = {
  1: {
    gradient: 'linear-gradient(226deg, #FF4B0A 15.46%, #EBFF29 117.77%)',
  },
  2: {
    gradient: 'linear-gradient(237deg, #919191 36.34%, #DBDBDB 85.4%)',
  },
  3: {
    gradient: 'linear-gradient(237deg, #B83D00 18.7%, #7B0000 85.4%)',
  },
};

const DEFAULT_RANK_STYLE: RankStyle = {
  backgroundColor: '#58595A',
};

/**
 * Preset color configurations for scenarios
 * 
 * As new scenarios appear in the data, they automatically get assigned
 * the next available preset. No hardcoding of scenario names needed!
 */
const SCENARIO_COLOR_PRESETS: ScenarioStyle[] = [
  {
    badgeBg: '#FFF0EB',
    badgeText: '#FF4B0A',
    selectedBadgeBg: '#FF4B0A',
    selectedBadgeText: '#FFFFFF',
    selectedItemBg: '#FFF0EB',
    selectedItemText: '#FF4B0A',
  },
  {
    badgeBg: '#E8F1FD',
    badgeText: '#1C7AEB',
    selectedBadgeBg: '#1C7AEB',
    selectedBadgeText: '#FFFFFF',
    selectedItemBg: '#E8F1FD',
    selectedItemText: '#1C7AEB',
  },
  {
    badgeBg: '#ECFDF5',
    badgeText: '#10B981',
    selectedBadgeBg: '#10B981',
    selectedBadgeText: '#FFFFFF',
    selectedItemBg: '#ECFDF5',
    selectedItemText: '#10B981',
  },
  {
    badgeBg: '#FEF3C7',
    badgeText: '#D97706',
    selectedBadgeBg: '#D97706',
    selectedBadgeText: '#FFFFFF',
    selectedItemBg: '#FEF3C7',
    selectedItemText: '#D97706',
  },
  {
    badgeBg: '#F3E8FF',
    badgeText: '#8B5CF6',
    selectedBadgeBg: '#8B5CF6',
    selectedBadgeText: '#FFFFFF',
    selectedItemBg: '#F3E8FF',
    selectedItemText: '#8B5CF6',
  },
  {
    badgeBg: '#FCE7F3',
    badgeText: '#EC4899',
    selectedBadgeBg: '#EC4899',
    selectedBadgeText: '#FFFFFF',
    selectedItemBg: '#FCE7F3',
    selectedItemText: '#EC4899',
  },
];

/**
 * Dynamic scenario color assignment
 * 
 * This Map keeps track of which preset is assigned to which scenario.
 * New scenarios automatically get the next available preset.
 */
const scenarioColorMap = new Map<string, ScenarioStyle>();

/**
 * Get or assign a color preset for a scenario
 */
const getScenarioStyle = (scenarioName?: string): ScenarioStyle => {
  if (!scenarioName) {
    return SCENARIO_COLOR_PRESETS[0]; // Default to first preset
  }
  
  // Check if this scenario already has a color assigned
  if (scenarioColorMap.has(scenarioName)) {
    return scenarioColorMap.get(scenarioName)!;
  }
  
  // Assign next available preset
  const presetIndex = scenarioColorMap.size % SCENARIO_COLOR_PRESETS.length;
  const preset = SCENARIO_COLOR_PRESETS[presetIndex];
  scenarioColorMap.set(scenarioName, preset);
  
  return preset;
};

// Utility function for style retrieval
const getRankStyle = (rank: number): RankStyle => {
  return RANK_STYLES[rank] || DEFAULT_RANK_STYLE;
};

export function meta() {
  return [{ title: 'Hupo Sales AI | Leaderboard' }];
}

function RankBadge({ rank }: { rank: number }) {
  const rankStyle = getRankStyle(rank);
  const style = rankStyle.gradient
    ? { background: rankStyle.gradient }
    : { backgroundColor: rankStyle.backgroundColor };

  return (
    <div
      className="flex h-5 w-12 items-center justify-center rounded-full"
      style={style}
    >
      <span className="text-sm font-bold leading-5 tracking-[-0.084px] text-white">
        #{rank}
      </span>
    </div>
  );
}

function Avatar({
  initials,
  hasCrown,
  rank,
}: {
  initials: string;
  hasCrown?: boolean;
  rank?: number;
}) {
  const getAvatarStyle = () => {
    if (rank) {
      const rankStyle = getRankStyle(rank);
      if (rankStyle.gradient) {
        return { background: rankStyle.gradient };
      }
      if (rankStyle.backgroundColor) {
        return { backgroundColor: rankStyle.backgroundColor };
      }
    }
    return { backgroundColor: '#58595A' };
  };

  return (
    <div className="relative">
      {hasCrown && (
        <motion.div
          initial={{ y: -10, opacity: 0, rotate: -20 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{
            delay: 0.5,
            type: 'spring',
            stiffness: 200,
            damping: 10,
          }}
          className="absolute -top-6"
        >
          <motion.img
            src="/icons/leaderboard-crown.png"
            alt="Crown"
            className="size-10"
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        </motion.div>
      )}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full text-center text-white"
        style={getAvatarStyle()}
      >
        <span className="text-[32px] font-book leading-10 tracking-[-0.48px]">
          {initials}
        </span>
      </div>
    </div>
  );
}

function AnimatedScore({ score }: { score: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  });
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    motionValue.set(score);
  }, [score, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayScore(Math.round(latest));
    });
    return unsubscribe;
  }, [springValue]);

  return <span>{displayScore}</span>;
}

function LeaderboardCard({
  entry,
  rank,
  height,
}: {
  entry?: LeaderboardEntry;
  rank: number;
  height: number;
}) {
  const rankStyle = getRankStyle(rank);
  const borderGradient = rankStyle.gradient || rankStyle.backgroundColor || '#58595A';
  
  const getSkeletonAvatarStyle = () => {
    if (rankStyle.gradient) {
      return { background: rankStyle.gradient };
    }
    return { backgroundColor: rankStyle.backgroundColor };
  };

  const scenarioStyle = getScenarioStyle(entry?.scenarioName);

  return (
    <motion.div
      layout
      className={cn(
        'relative flex w-full max-w-[244px] flex-col items-center justify-between overflow-hidden rounded-xl bg-white px-5 pb-4 pt-3 sm:w-[244px]',
        rank >= 4 && 'shadow-[0px_7px_15px_0px_rgba(0,0,0,0.05)]',
      )}
      style={{ height: `${height}px` }}
    >
      {/* Gradient border at bottom - only for top 3 ranks */}
      {rank <= 3 && (
        <div
          className="absolute bottom-0 left-0 h-[4px] w-full rounded-b-xl"
          style={{
            background: borderGradient,
          }}
        />
      )}

      {/* Rank Badge */}
      <RankBadge rank={rank} />

      {/* Content Area */}
      <div className="flex w-full items-center gap-3">
        <AnimatePresence mode="wait">
          {entry ? (
            // Real content
            <motion.div
              key="real-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex w-full items-center gap-3"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
              >
                <Avatar
                  initials={entry.initials}
                  hasCrown={rank === 1}
                  rank={rank}
                />
              </motion.div>
              <div className="flex flex-1 flex-col items-start">
                <div className="flex w-full flex-col items-center text-[#161618]">
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full text-left text-sm leading-5 tracking-[-0.084px] line-clamp-2 text-ellipsis overflow-hidden"
                  >
                    {entry.name}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className="w-full text-left text-5xl font-bold leading-[58px] tracking-[-0.72px]"
                  >
                    <AnimatedScore score={entry.score} />
                  </motion.p>
                </div>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full text-left text-xs leading-4 text-[#58595A]"
                >
                  Practiced with {entry.personaName}
                </motion.p>
              </div>
            </motion.div>
          ) : (
            // Skeleton content
            <motion.div
              key="skeleton-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex w-full items-center gap-3"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={getSkeletonAvatarStyle()}
              >
                <span className="text-[32px] font-book leading-10 tracking-[-0.48px] text-transparent">
                  --
                </span>
              </motion.div>
              <div className="flex flex-1 flex-col items-start justify-between gap-2">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.1,
                  }}
                  className="h-3 w-full rounded bg-[#EAEDEF]"
                />
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.2,
                  }}
                  className="h-8 w-14 rounded bg-[#EAEDEF]"
                />
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.3,
                  }}
                  className="h-3 w-full rounded bg-[#EAEDEF]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom content */}
      <AnimatePresence mode="wait">
        {entry?.scenarioName ? (
          <motion.div
            key="scenario-badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center rounded-full px-2 py-0.5 text-xs leading-4"
            style={{
              backgroundColor: scenarioStyle.badgeBg,
              color: scenarioStyle.badgeText,
            }}
          >
            {entry.scenarioName}
          </motion.div>
        ) : (
          <motion.p
            key="waiting-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full text-center text-xs leading-4 text-[#58595A]"
          >
            Waiting for participants..
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FilterDropdown({
  options,
  selectedValue,
  onSelect,
}: {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-10 items-center justify-center gap-2 rounded-full bg-white px-6 py-0 shadow-[0px_7px_15px_0px_rgba(0,0,0,0.05)]"
      >
        {selectedOption?.badge ? (
          <>
            <div
              className="flex h-5 items-center justify-center rounded-full px-2 py-0.5"
              style={{
                backgroundColor: getScenarioStyle(selectedOption.badge).badgeBg,
                color: getScenarioStyle(selectedOption.badge).badgeText,
              }}
            >
              <span className="text-xs">{selectedOption.badge}</span>
            </div>
            <span className="text-sm leading-5 tracking-[-0.084px] text-[#161618]">
              {selectedOption.label}
            </span>
          </>
        ) : (
          <span className="text-sm leading-5 tracking-[-0.084px] text-[#161618]">
            {selectedOption?.label || 'All scenario and persona'}
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 z-10 mb-2 w-[350px] -translate-x-1/2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            {options.map((option, index) => {
              const isSelected = option.value === selectedValue;
              const isAll = option.value === 'all';
              const scenarioStyle = option.badge ? getScenarioStyle(option.badge) : null;
              
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ 
                    backgroundColor: isSelected 
                      ? (isAll ? '#FFF0EB' : 'rgba(0, 0, 0, 0.02)') 
                      : 'rgba(0, 0, 0, 0.02)' 
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm',
                    index === 0 && 'pt-3',
                    index === options.length - 1 && 'pb-3',
                  )}
                  style={isSelected ? { backgroundColor: scenarioStyle?.selectedItemBg || '#FFF0EB' } : undefined}
                >
                  {option.badge && scenarioStyle ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.1 }}
                        className="flex h-5 items-center justify-center rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: isSelected 
                            ? scenarioStyle.selectedBadgeBg 
                            : scenarioStyle.badgeBg,
                          color: isSelected 
                            ? scenarioStyle.selectedBadgeText 
                            : scenarioStyle.badgeText,
                        }}
                      >
                        <span className="text-xs">{option.badge}</span>
                      </motion.div>
                      <span 
                        className="flex-1 text-right"
                        style={{ 
                          color: isSelected ? scenarioStyle.selectedItemText : '#161618' 
                        }}
                      >
                        {option.label}
                      </span>
                    </>
                  ) : (
                    <span className="flex-1 text-[#161618]">{option.label}</span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default withAuthenticationRequired(
  function Leaderboard() {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchParams] = useSearchParams();
    const isMockMode = searchParams.get('mock') === 'true';

    const { data: leaderboardResponse, isLoading } = useQuery<LeaderboardResponse>({
      queryKey: ['leaderboard', isMockMode],
      queryFn: isMockMode ? fetchMockLeaderboard : fetchRealLeaderboard,
      refetchInterval: 5000, // Poll every 5 seconds
      staleTime: 0, // Always consider data stale
    });

    const leaderboardData: LeaderboardEntry[] = (leaderboardResponse?.entries || []).map(
      (entry, index) => ({
        ...entry,
        rank: index + 1,
        initials: generateInitials(entry.name),
      })
    );

    const filterOptions: FilterOption[] = (() => {
      const uniqueCombinations = new Map<string, { scenario: string; persona: string }>();
      
      leaderboardData.forEach((entry) => {
        if (entry.scenarioName && entry.personaName) {
          const key = `${entry.scenarioName}|${entry.personaName}`;
          
          if (!uniqueCombinations.has(key)) {
            uniqueCombinations.set(key, {
              scenario: entry.scenarioName,
              persona: entry.personaName,
            });
          }
        }
      });

      const options: FilterOption[] = [
        { value: 'all', label: 'All scenario and persona' },
      ];

      // Sort by scenario first, then by persona
      const sortedCombinations = Array.from(uniqueCombinations.entries()).sort((a, b) => {
        const [, comboA] = a;
        const [, comboB] = b;
        
        if (comboA.scenario !== comboB.scenario) {
          return comboA.scenario.localeCompare(comboB.scenario);
        }
        return comboA.persona.localeCompare(comboB.persona);
      });

      sortedCombinations.forEach(([key, combo]) => {
        options.push({
          value: key,
          label: `Practiced with ${combo.persona}`,
          badge: combo.scenario,
        });
      });

      return options;
    })();

    // Apply filtering
    const filteredLeaderboardData = leaderboardData.filter((entry) => {
      if (selectedFilter === 'all') return true;
      
      // Parse the filter value (format: "scenario|persona")
      const [filterScenario, filterPersona] = selectedFilter.split('|');
      
      if (entry.scenarioName && entry.personaName) {
        return (
          entry.scenarioName === filterScenario &&
          entry.personaName.toLowerCase() === filterPersona.toLowerCase()
        );
      }
      
      return false;
    });

    const topFiveFiltered = filteredLeaderboardData.slice(0, 5).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    const getCardHeight = (rank: number): number => {
      const heights = [240, 224, 216, 200, 200];
      if (rank <= heights.length) {
        return heights[rank - 1];
      }
      return 200;
    };

    return (
      <div className="relative min-h-screen w-full bg-[#F6F8F8]">
        {/* Header with supergraphic sphere */}
        <header className="fixed top-0 left-0 right-0 w-full z-10 h-[100px] overflow-hidden">
          {/* Supergraphic sphere - only bottom portion visible */}
          <div
            className="absolute left-1/2 bottom-0 opacity-75 -translate-x-1/2"
            style={{
              width: '2992px',
              height: '3244.459px',
              borderRadius: '3244.459px',
              background: 'linear-gradient(180deg, #D9D9D9 95.18%, #FFF 96.53%)',
            }}
          />

          {/* Content on top of sphere */}
          <div className="relative z-10 flex h-[80px] items-center justify-center px-4 lg:px-6">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src="/logos/Hupo_Logotype_Orange(noR).svg"
                  alt="Hupo"
                  className="h-6 w-auto sm:h-7"
                />
                <h1 className="text-base font-bold leading-6 tracking-[-0.18px] text-[#161618] sm:text-lg">
                  HSBC Symposium Leaderboard
                </h1>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex items-center justify-center rounded-full bg-[#FFF0EB] px-2 py-0.5">
                  <span className="text-xs leading-4 text-[#FF4B0A]">
                    {dayjs().format('DD MMMM YYYY')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 py-8 pb-24 sm:px-10 sm:py-12">
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-8 text-center font-everett text-3xl font-bold leading-[56px] tracking-[-0.72px] text-[#161618] sm:mb-12 sm:text-5xl"
          >
            Our top participants
          </motion.h2>

          {/* Leaderboard cards */}
          {!isLoading && leaderboardData.length === 0 ? (
            // Empty state when no data
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center gap-4 py-12"
            >
              <div className="text-center">
                <p className="text-xl font-medium text-[#161618]">
                  Waiting for roleplays to be completed
                </p>
                <p className="mt-2 text-sm text-[#58595A]">
                  Come back when roleplay has been done today
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-wrap items-end justify-center gap-x-3.5 gap-y-4 sm:gap-y-0"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              {/* Always show 5 card slots */}
              {[1, 2, 3, 4, 5].map((rank) => {
                const entry = topFiveFiltered.find((e) => e.rank === rank);
                const height = getCardHeight(rank);

                return (
                  <LeaderboardCard
                    key={entry ? entry.id : `empty-slot-${rank}`}
                    entry={entry}
                    rank={rank}
                    height={height}
                  />
                );
              })}
            </motion.div>
          )}
        </main>

        {/* Filter dropdown - pinned to bottom */}
        <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center">
          <FilterDropdown
            options={filterOptions}
            selectedValue={selectedFilter}
            onSelect={setSelectedFilter}
          />
        </div>
      </div>
    );
  },
  withManageAuthenticationRequiredOptions,
);

