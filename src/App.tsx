import { useState, useEffect, useRef } from 'react';
import { CssVarsProvider, useColorScheme } from '@mui/joy/styles';
import {
  Sheet,
  Typography,
  IconButton,
  Grid,
  Stack,
  Tooltip,
  Box,
  Divider,
} from '@mui/joy';
import { Moon, Sun, Github, Disc } from 'lucide-react';
import { theme } from './theme';
import { Category, AppSettings, SpinHistoryItem, Participant } from './types';
import CategoryManager from './components/CategoryManager';
import WheelCanvas from './components/WheelCanvas';
import WinnerDialog from './components/WinnerDialog';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';
import ConfettiCanvas from './components/ConfettiCanvas';
import { playSuccessSound } from './utils/audio';

// Initial hydrated default categories for instant applet playability
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'dinner-cat',
    name: '🍔 Dinner Options',
    colorTag: '#3E5F44',
    isFavorite: true,
    createdAt: new Date().toISOString(),
    names: [
      { id: '1', name: 'Pizza' },
      { id: '2', name: 'Crispy Tacos' },
      { id: '3', name: 'Fresh Sushi' },
      { id: '4', name: 'Gourmet Burgers' },
      { id: '5', name: 'Truffle Pasta' },
      { id: '6', name: 'Greek Salad' },
      { id: '7', name: 'Green Curry' },
      { id: '8', name: 'Spicy Ramen' },
    ],
  },
  {
    id: 'team-cat',
    name: '👥 Team Duties',
    colorTag: '#5E7B5A',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    names: [
      { id: '10', name: 'John Smith' },
      { id: '11', name: 'Mary Jane' },
      { id: '12', name: 'James Watson' },
      { id: '13', name: 'Sarah Connor' },
      { id: '14', name: 'Alex Mercer' },
      { id: '15', name: 'Emily Davis' },
    ],
  },
  {
    id: 'activity-cat',
    name: '🎯 Daily Routine',
    colorTag: '#7FA36B',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    names: [
      { id: '20', name: 'Read a novel' },
      { id: '21', name: 'Go for a jog' },
      { id: '22', name: 'Play chess' },
      { id: '23', name: 'Watch a thriller' },
      { id: '24', name: 'Practice algorithms' },
      { id: '25', name: 'Mindfulness meditation' },
    ],
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  spinDuration: 7.5,
  soundEnabled: true,
  confettiEnabled: true,
  autoRemoveWinner: false,
};

function MainAppContent() {
  const { mode, setMode } = useColorScheme();
  const themeMode = mode === 'dark' ? 'dark' : 'light';

  // State initialization with LocalStorage fallbacks
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('won_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    const saved = localStorage.getItem('won_selected_cat');
    return saved || 'dinner-cat';
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('won_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [history, setHistory] = useState<SpinHistoryItem[]>(() => {
    const saved = localStorage.getItem('won_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [isWinnerOpen, setIsWinnerOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Sync LocalStorage
  useEffect(() => {
    localStorage.setItem('won_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (selectedCategoryId) {
      localStorage.setItem('won_selected_cat', selectedCategoryId);
    } else {
      localStorage.removeItem('won_selected_cat');
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    localStorage.setItem('won_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('won_history', JSON.stringify(history));
  }, [history]);

  // Derive current category details
  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || null;

  // Category Actions
  const handleSelectCategory = (id: string) => {
    if (!isSpinning) {
      setSelectedCategoryId(id);
    }
  };

  const handleCreateCategory = (name: string, colorTag: string) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      names: [],
      colorTag,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [newCat, ...prev]);
    setSelectedCategoryId(newCat.id);
  };

  const handleRenameCategory = (id: string, newName: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
    );
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (selectedCategoryId === id) {
      const remaining = categories.filter((c) => c.id !== id);
      setSelectedCategoryId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleDuplicateCategory = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    const dupCat: Category = {
      ...target,
      id: `cat-dup-${Date.now()}`,
      name: `${target.name} (Copy)`,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      // Deep copy participants
      names: target.names.map((n) => ({ ...n, id: `n-dup-${Math.random()}` })),
    };

    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const updated = [...prev];
      updated.splice(idx + 1, 0, dupCat);
      return updated;
    });
    setSelectedCategoryId(dupCat.id);
  };

  const handleToggleFavorite = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  // Participant Actions
  const handleAddParticipant = (catId: string, name: string) => {
    const newParticipant: Participant = {
      id: `n-${Date.now()}-${Math.random()}`,
      name,
    };
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, names: [...c.names, newParticipant] } : c))
    );
  };

  const handleBulkAddParticipants = (catId: string, names: string[]) => {
    const participants: Participant[] = names.map((name) => ({
      id: `n-${Date.now()}-${Math.random()}`,
      name,
    }));
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, names: [...c.names, ...participants] } : c))
    );
  };

  const handleDeleteParticipant = (catId: string, participantId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, names: c.names.filter((n) => n.id !== participantId) } : c
      )
    );
  };

  const handleEditParticipant = (catId: string, participantId: string, newName: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              names: c.names.map((n) => (n.id === participantId ? { ...n, name: newName } : n)),
            }
          : c
      )
    );
  };

  const handleShuffleParticipants = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        const shuffled = [...c.names].sort(() => Math.random() - 0.5);
        return { ...c, names: shuffled };
      })
    );
  };

  const handleSortParticipants = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        const sorted = [...c.names].sort((a, b) => a.name.localeCompare(b.name));
        return { ...c, names: sorted };
      })
    );
  };

  const handleReorderCategory = (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setCategories(updated);
  };

  const handleReorderParticipant = (catId: string, participantId: string, direction: 'up' | 'down') => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        const index = c.names.findIndex((n) => n.id === participantId);
        if (index === -1) return c;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= c.names.length) return c;

        const updatedNames = [...c.names];
        const [moved] = updatedNames.splice(index, 1);
        updatedNames.splice(newIndex, 0, moved);
        return { ...c, names: updatedNames };
      })
    );
  };

  // Import / Reset
  const handleImportCategories = (imported: Category[]) => {
    setCategories(imported);
    if (imported.length > 0) {
      setSelectedCategoryId(imported[0].id);
    } else {
      setSelectedCategoryId(null);
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset all data back to defaults?')) {
      setCategories(DEFAULT_CATEGORIES);
      setSelectedCategoryId('dinner-cat');
      setSettings(DEFAULT_SETTINGS);
      setHistory([]);
      setWinner(null);
      setIsWinnerOpen(false);
      setIsCelebrating(false);
    }
  };

  // Preference Settings Actions
  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // History Actions
  const handleClearHistory = () => {
    setHistory([]);
  };

  // Wheel Spin Lifecycle
  const handleSpinStart = () => {
    setIsSpinning(true);
    setWinner(null);
    setIsWinnerOpen(false);
    setIsCelebrating(false);
  };

  const handleSpinComplete = (landedWinner: Participant) => {
    setWinner(landedWinner);
    setIsSpinning(false);
    setIsWinnerOpen(true);

    if (settings.confettiEnabled) {
      setIsCelebrating(true);
    }

    if (settings.soundEnabled) {
      playSuccessSound();
    }

    // Log to history
    if (activeCategory) {
      const historyItem: SpinHistoryItem = {
        id: `h-${Date.now()}`,
        timestamp: new Date().toISOString(),
        winnerName: landedWinner.name,
        categoryName: activeCategory.name,
        categoryId: activeCategory.id,
      };
      setHistory((prev) => [historyItem, ...prev]);

      // Handle automatic winner removal
      if (settings.autoRemoveWinner) {
        setTimeout(() => {
          handleRemoveWinner(landedWinner);
        }, 1200);
      }
    }
  };

  const handleRemoveWinner = (targetWinner: Participant) => {
    if (selectedCategoryId) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === selectedCategoryId
            ? { ...c, names: c.names.filter((n) => n.id !== targetWinner.id) }
            : c
        )
      );
    }
    setIsWinnerOpen(false);
    setIsCelebrating(false);
  };

  const handleKeepWinner = () => {
    setIsWinnerOpen(false);
    setIsCelebrating(false);
  };

  const handleSpinAgainFromWinner = () => {
    setIsWinnerOpen(false);
    setIsCelebrating(false);
    // Find canvas SPIN action button overlay or trigger a click on it
    setTimeout(() => {
      const canvasEl = document.querySelector('canvas');
      if (canvasEl) {
        canvasEl.click();
      }
    }, 150);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.body',
        color: 'text.primary',
        transition: 'background-color 0.3s, color 0.3s',
        pb: 6,
      }}
    >
      {/* Confetti Overlay */}
      <ConfettiCanvas active={isCelebrating} />

      {/* Top Header App Bar */}
      <Sheet
        variant="plain"
        sx={{
          py: 1.5,
          px: { xs: 2, md: 4 },
          bgcolor: mode === 'light' ? '#FFFFFF' : '#1C291F',
          borderBottom: '1px solid',
          borderColor: mode === 'light' ? '#E3E8DD' : '#243126',
          boxShadow: 'sm',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Animated app logo */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#3E5F44]/10 dark:bg-[#7FA36B]/15 text-[#3E5F44] dark:text-[#7FA36B]">
            <Disc size={22} className={`stroke-[2.5] ${isSpinning ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <Typography
              level="h3"
              fontFamily="Space Grotesk"
              fontWeight="bold"
              sx={{
                color: mode === 'light' ? '#3E5F44' : '#7FA36B',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Wheel of Names
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              Elegant Random Picker
            </Typography>
          </div>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Theme Toggler */}
          <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} variant="outlined">
            <IconButton
              size="sm"
              variant="outlined"
              color="neutral"
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              sx={{ borderRadius: '10px' }}
            >
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
          </Tooltip>

          {/* GitHub Link Icon Placeholder */}
          <Tooltip title="GitHub Repository" variant="outlined">
            <IconButton
              component="a"
              href="https://github.com"
              target="_blank"
              size="sm"
              variant="outlined"
              color="neutral"
              sx={{ borderRadius: '10px' }}
            >
              <Github size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Sheet>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
        <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
          {/* Left Column: Category and Names list */}
          <Grid xs={12} md={5} lg={4}>
            <CategoryManager
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              onCreateCategory={handleCreateCategory}
              onRenameCategory={handleRenameCategory}
              onDeleteCategory={handleDeleteCategory}
              onDuplicateCategory={handleDuplicateCategory}
              onToggleFavorite={handleToggleFavorite}
              onAddParticipant={handleAddParticipant}
              onBulkAddParticipants={handleBulkAddParticipants}
              onDeleteParticipant={handleDeleteParticipant}
              onEditParticipant={handleEditParticipant}
              onShuffleParticipants={handleShuffleParticipants}
              onSortParticipants={handleSortParticipants}
              onReorderCategory={handleReorderCategory}
              onReorderParticipant={handleReorderParticipant}
              onImportCategories={handleImportCategories}
              onResetAll={handleResetAll}
              themeMode={themeMode}
            />
          </Grid>

          {/* Middle Column: The interactive Wheel centerpiece */}
          <Grid xs={12} md={7} lg={5} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Sheet
              variant="plain"
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: '24px',
                bgcolor: 'background.surface',
                boxShadow: 'sm',
                border: '1px solid',
                borderColor: mode === 'light' ? '#E3E8DD' : '#243126',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {activeCategory ? (
                <>
                  <div className="text-center">
                    <Typography level="body-xs" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.tertiary' }}>
                      Active Selection Wheel
                    </Typography>
                    <Typography level="h4" fontFamily="Space Grotesk" fontWeight="bold">
                      {activeCategory.name}
                    </Typography>
                  </div>

                  <WheelCanvas
                    names={activeCategory.names}
                    spinDuration={settings.spinDuration}
                    soundEnabled={settings.soundEnabled}
                    onSpinStart={handleSpinStart}
                    onSpinComplete={handleSpinComplete}
                    isSpinning={isSpinning}
                    setIsSpinning={setIsSpinning}
                    themeMode={themeMode}
                  />

                  {activeCategory.names.length === 0 && (
                    <Typography level="body-xs" color="danger" sx={{ fontWeight: 600 }}>
                      ⚠️ Category is empty. Please add names to spin!
                    </Typography>
                  )}
                </>
              ) : (
                <div className="py-20 text-center flex flex-col items-center gap-2">
                  <Disc size={44} className="text-neutral-300 dark:text-neutral-700 animate-pulse" />
                  <Typography level="title-md" sx={{ color: 'text.secondary' }}>
                    No names configured
                  </Typography>
                  <Typography level="body-sm" sx={{ color: 'text.tertiary', maxW: 240 }}>
                    Please select or create a category in the panel to begin.
                  </Typography>
                </div>
              )}
            </Sheet>
          </Grid>

          {/* Right Column: Collapsible settings & history boards */}
          <Grid xs={12} lg={3} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Preferences / settings */}
            <SettingsPanel
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              themeMode={themeMode}
            />

            {/* Past History panel */}
            <HistoryPanel
              history={history}
              onClearHistory={handleClearHistory}
              themeMode={themeMode}
            />
          </Grid>
        </Grid>
      </div>

      {/* Landing Winner celebration popup */}
      {winner && activeCategory && (
        <WinnerDialog
          open={isWinnerOpen}
          winner={winner}
          onClose={handleKeepWinner}
          onSpinAgain={handleSpinAgainFromWinner}
          onRemoveWinner={handleRemoveWinner}
          categoryName={activeCategory.name}
          themeMode={themeMode}
        />
      )}
    </Box>
  );
}

export default function App() {
  return (
    <CssVarsProvider theme={theme} defaultMode="light">
      <MainAppContent />
    </CssVarsProvider>
  );
}
