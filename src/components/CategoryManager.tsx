import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sheet,
  Typography,
  Button,
  IconButton,
  Card,
  Chip,
  Stack,
  Divider,
  Tooltip,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Grid,
} from '@mui/joy';
import {
  Plus,
  Trash2,
  Copy,
  Edit2,
  Star,
  Shuffle,
  Search,
  ArrowUp,
  ArrowDown,
  Upload,
  Download,
  AlertTriangle,
  Check,
  X,
  FileText,
  Trash,
  SortAsc,
} from 'lucide-react';
import { Category, Participant } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onCreateCategory: (name: string, colorTag: string) => void;
  onRenameCategory: (id: string, newName: string) => void;
  onDeleteCategory: (id: string) => void;
  onDuplicateCategory: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddParticipant: (categoryId: string, name: string) => void;
  onBulkAddParticipants: (categoryId: string, names: string[]) => void;
  onDeleteParticipant: (categoryId: string, participantId: string) => void;
  onEditParticipant: (categoryId: string, participantId: string, newName: string) => void;
  onShuffleParticipants: (categoryId: string) => void;
  onSortParticipants: (categoryId: string) => void;
  onReorderCategory: (id: string, direction: 'up' | 'down') => void;
  onReorderParticipant: (categoryId: string, participantId: string, direction: 'up' | 'down') => void;
  onImportCategories: (imported: Category[]) => void;
  onResetAll: () => void;
  themeMode: 'light' | 'dark';
}

const PALETTE_TAGS = [
  '#3E5F44', // Forest Green
  '#5E7B5A', // Sage
  '#7FA36B', // Grass
  '#C68B59', // Earth Clay
  '#A35D6A', // Dusty Rose
  '#4E6C84', // Slate Blue
];

export default function CategoryManager({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onDuplicateCategory,
  onToggleFavorite,
  onAddParticipant,
  onBulkAddParticipants,
  onDeleteParticipant,
  onEditParticipant,
  onShuffleParticipants,
  onSortParticipants,
  onReorderCategory,
  onReorderParticipant,
  onImportCategories,
  onResetAll,
  themeMode,
}: CategoryManagerProps) {
  // UI states
  const [newCatName, setNewCatName] = useState('');
  const [selectedTag, setSelectedTag] = useState(PALETTE_TAGS[0]);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [newNameInput, setNewNameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingParticipantName, setEditingParticipantName] = useState('');

  // Bulk add modal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Import/Export dialog
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Undo delete snackbar state
  const [undoSnackbarOpen, setUndoSnackbarOpen] = useState(false);
  const [undoPayload, setUndoPayload] = useState<{
    type: 'category' | 'participant';
    categoryId?: string;
    data: any;
    index: number;
  } | null>(null);

  // Selected category ref
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  // Duplicate detection mapping
  const duplicatesMap = useMemo(() => {
    if (!selectedCategory) return new Set<string>();
    const seen = new Map<string, string[]>(); // name -> list of ids
    selectedCategory.names.forEach((p) => {
      const clean = p.name.trim().toLowerCase();
      if (!seen.has(clean)) {
        seen.set(clean, []);
      }
      seen.get(clean)!.push(p.id);
    });

    const duplicates = new Set<string>();
    seen.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => duplicates.add(id));
      }
    });
    return duplicates;
  }, [selectedCategory]);

  // Sort categories: Favorites first, then by actual array index
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0; // Maintain order from the parent array (allowing custom manual ordering)
    });
  }, [categories]);

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    if (!selectedCategory) return [];
    if (!searchQuery.trim()) return selectedCategory.names;
    const q = searchQuery.toLowerCase();
    return selectedCategory.names.filter((p) => p.name.toLowerCase().includes(q));
  }, [selectedCategory, searchQuery]);

  // Actions
  const handleCreateCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onCreateCategory(newCatName.trim(), selectedTag);
    setNewCatName('');
    // Cycle tag
    const nextIndex = (PALETTE_TAGS.indexOf(selectedTag) + 1) % PALETTE_TAGS.length;
    setSelectedTag(PALETTE_TAGS[nextIndex]);
  };

  const handleStartRenameCat = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveRenameCat = (id: string) => {
    if (editingCatName.trim()) {
      onRenameCategory(id, editingCatName.trim());
    }
    setEditingCatId(null);
  };

  const handleAddParticipantName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !newNameInput.trim()) return;
    onAddParticipant(selectedCategoryId, newNameInput.trim());
    setNewNameInput('');
  };

  const handleBulkAdd = () => {
    if (!selectedCategoryId || !bulkText.trim()) return;
    const namesToAdd = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    onBulkAddParticipants(selectedCategoryId, namesToAdd);
    setBulkText('');
    setIsBulkOpen(false);
  };

  const handleStartEditParticipant = (p: Participant) => {
    setEditingParticipantId(p.id);
    setEditingParticipantName(p.name);
  };

  const handleSaveEditParticipant = (pId: string) => {
    if (selectedCategoryId && editingParticipantName.trim()) {
      onEditParticipant(selectedCategoryId, pId, editingParticipantName.trim());
    }
    setEditingParticipantId(null);
  };

  // Undo triggers
  const triggerDeleteCategory = (cat: Category, index: number) => {
    setUndoPayload({
      type: 'category',
      data: cat,
      index,
    });
    onDeleteCategory(cat.id);
    setUndoSnackbarOpen(true);
  };

  const triggerDeleteParticipant = (p: Participant, index: number) => {
    if (!selectedCategoryId) return;
    setUndoPayload({
      type: 'participant',
      categoryId: selectedCategoryId,
      data: p,
      index,
    });
    onDeleteParticipant(selectedCategoryId, p.id);
    setUndoSnackbarOpen(true);
  };

  const handleUndo = () => {
    if (!undoPayload) return;

    if (undoPayload.type === 'category') {
      const cat = undoPayload.data as Category;
      onCreateCategory(cat.name, cat.colorTag);
      // Wait, let's restore names as well!
      // To simplify, we can recreate the category and inject back names
      // In the App.tsx we have a state setter. We can invoke restore custom:
      const importedList = [...categories];
      importedList.splice(undoPayload.index, 0, cat);
      onImportCategories(importedList);
    } else if (undoPayload.type === 'participant' && undoPayload.categoryId) {
      const p = undoPayload.data as Participant;
      const cat = categories.find((c) => c.id === undoPayload.categoryId);
      if (cat) {
        const restoredNames = [...cat.names];
        restoredNames.splice(undoPayload.index, 0, p);
        const updated = categories.map((c) =>
          c.id === undoPayload.categoryId ? { ...c, names: restoredNames } : c
        );
        onImportCategories(updated);
      }
    }
    setUndoSnackbarOpen(false);
    setUndoPayload(null);
  };

  // Import Export handlers
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(categories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'wheel_of_names_categories.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Basic schema verification
          const valid = parsed.every(
            (cat) =>
              typeof cat.id === 'string' &&
              typeof cat.name === 'string' &&
              Array.isArray(cat.names)
          );
          if (valid) {
            onImportCategories(parsed);
            setIsImportExportOpen(false);
            setImportError(null);
          } else {
            setImportError('Invalid JSON format. Make sure it contains an array of categories.');
          }
        } else {
          setImportError('JSON must be an array of categories.');
        }
      } catch (err) {
        setImportError('Failed to parse file. Please verify it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Sheet
      variant="plain"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: '24px',
        bgcolor: 'background.surface',
        boxShadow: 'sm',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        border: '1px solid',
        borderColor: themeMode === 'light' ? '#E3E8DD' : '#243126',
      }}
    >
      {/* Category Manager Title Row */}
      <div className="flex justify-between items-center">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography level="h3" fontFamily="Space Grotesk" fontWeight="bold">
            Categories
          </Typography>
          <Chip size="sm" variant="soft" color="primary">
            {categories.length}
          </Chip>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Backup & Restore Categories" variant="outlined">
            <IconButton
              size="sm"
              variant="outlined"
              color="neutral"
              onClick={() => setIsImportExportOpen(true)}
            >
              <Upload size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Dashboard Data" variant="outlined">
            <IconButton size="sm" variant="outlined" color="danger" onClick={onResetAll}>
              <Trash size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </div>

      {/* Category Create Input */}
      <form onSubmit={handleCreateCat} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-grow relative flex items-center">
          <input
            type="text"
            placeholder="New categor..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full pl-3.5 pr-28 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5F44] dark:focus:ring-[#7FA36B] text-sm font-medium transition-all"
          />
          <div className="absolute right-3 flex gap-1 bg-transparent">
            {PALETTE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`w-4 h-4 rounded-full transition-transform ${
                  selectedTag === tag ? 'scale-125 ring-2 ring-neutral-400' : 'opacity-65 hover:opacity-100'
                }`}
                style={{ backgroundColor: tag }}
              />
            ))}
          </div>
        </div>
        <Button type="submit" variant="solid" color="primary" sx={{ px: 2.5 }}>
          <Plus size={18} className="mr-1" /> Add
        </Button>
      </form>

      {/* Category Selection Carousel/List */}
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
        {categories.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <FileText className="mx-auto text-neutral-400 mb-2" size={28} />
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              No categories created yet. Add one above!
            </Typography>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {sortedCategories.map((cat, index) => {
              const isSelected = cat.id === selectedCategoryId;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <Card
                    onClick={() => onSelectCategory(cat.id)}
                    sx={{
                      cursor: 'pointer',
                      p: 1.5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 2,
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.solidBg' : 'divider',
                      boxShadow: isSelected ? 'md' : 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: isSelected ? 'primary.solidBg' : 'neutral.outlinedBorder',
                        bgcolor: themeMode === 'light' ? '#FBFDFA' : '#1D2A20',
                      },
                    }}
                  >
                    {/* Selected Animated Border/Glow */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeBorder"
                        className="absolute inset-0 border-2 border-green-700 pointer-events-none rounded-[16px]"
                        style={{ borderColor: cat.colorTag }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Color bar tag */}
                    <div
                      className="w-1.5 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: cat.colorTag }}
                    />

                    {/* Left details */}
                    <div className="flex-grow min-w-0">
                      {editingCatId === cat.id ? (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            autoFocus
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onBlur={() => handleSaveRenameCat(cat.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRenameCat(cat.id)}
                            className="flex-grow px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3E5F44] text-sm"
                          />
                          <IconButton size="sm" onClick={() => handleSaveRenameCat(cat.id)}>
                            <Check size={14} />
                          </IconButton>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Typography level="title-md" noWrap sx={{ fontWeight: 600 }}>
                            {cat.name}
                          </Typography>
                          {cat.isFavorite && (
                            <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" />
                          )}
                        </div>
                      )}
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        {cat.names.length} names
                      </Typography>
                    </div>

                    {/* Action buttons (only show if not editing name) */}
                    {editingCatId !== cat.id && (
                      <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Favorite Category" variant="outlined">
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => onToggleFavorite(cat.id)}
                          >
                            <Star size={15} className={cat.isFavorite ? 'fill-amber-400 text-amber-400' : ''} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Name" variant="outlined">
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => handleStartRenameCat(cat)}
                          >
                            <Edit2 size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate" variant="outlined">
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => onDuplicateCategory(cat.id)}
                          >
                            <Copy size={14} />
                          </IconButton>
                        </Tooltip>
                        <Stack spacing={0.2} className="justify-center mx-1">
                          <IconButton
                            size="sm"
                            variant="plain"
                            sx={{ p: 0, minWidth: 20, minHeight: 18 }}
                            onClick={() => onReorderCategory(cat.id, 'up')}
                          >
                            <ArrowUp size={12} />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="plain"
                            sx={{ p: 0, minWidth: 20, minHeight: 18 }}
                            onClick={() => onReorderCategory(cat.id, 'down')}
                          >
                            <ArrowDown size={12} />
                          </IconButton>
                        </Stack>
                        <Tooltip title="Delete Category" variant="outlined">
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="danger"
                            onClick={() => triggerDeleteCategory(cat, index)}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <Divider />

      {/* Selected Category Names Section */}
      <div className="flex-grow flex flex-col gap-3 min-h-[300px]">
        {selectedCategory ? (
          <>
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <Typography level="title-lg" fontFamily="Space Grotesk" fontWeight="bold">
                  Names in "{selectedCategory.name}"
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Manage and shuffle participants for this wheel
                </Typography>
              </div>

              <div className="flex gap-1.5 self-stretch sm:self-auto">
                <Button
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  onClick={() => onShuffleParticipants(selectedCategory.id)}
                  startDecorator={<Shuffle size={14} />}
                >
                  Shuffle
                </Button>
                <Button
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  onClick={() => onSortParticipants(selectedCategory.id)}
                  startDecorator={<SortAsc size={14} />}
                >
                  A-Z
                </Button>
                <Button
                  size="sm"
                  variant="solid"
                  color="primary"
                  onClick={() => setIsBulkOpen(true)}
                  startDecorator={<FileText size={14} />}
                >
                  Bulk Paste
                </Button>
              </div>
            </div>

            {/* Quick entry form */}
            <form onSubmit={handleAddParticipantName} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter name to add..."
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                className="flex-grow px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5F44] dark:focus:ring-[#7FA36B] text-sm font-medium transition-all"
              />
              <Button type="submit" variant="soft" color="primary">
                Add Name
              </Button>
            </form>

            {/* Names Filter & Search */}
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search names in this category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5F44] dark:focus:ring-[#7FA36B] text-sm transition-all"
              />
            </div>

            {/* Names list */}
            <div className="flex-grow overflow-y-auto max-h-[320px] border border-neutral-100 dark:border-neutral-800 rounded-xl p-2 bg-neutral-50/50 dark:bg-neutral-900/50">
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-10">
                  <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                    {selectedCategory.names.length === 0
                      ? 'No names in this category. Add some individually or bulk paste!'
                      : 'No names match your search query.'}
                  </Typography>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredParticipants.map((p, pIndex) => {
                    const isDuplicate = duplicatesMap.has(p.id);
                    const isEditing = editingParticipantId === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                          isDuplicate
                            ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800/40'
                            : 'bg-background.surface border-neutral-100 dark:border-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex-grow flex gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              autoFocus
                              value={editingParticipantName}
                              onChange={(e) => setEditingParticipantName(e.target.value)}
                              onBlur={() => handleSaveEditParticipant(p.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEditParticipant(p.id)}
                              className="flex-grow px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3E5F44] text-sm"
                            />
                            <IconButton size="sm" color="success" onClick={() => handleSaveEditParticipant(p.id)}>
                              <Check size={14} />
                            </IconButton>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0 flex-grow pr-2">
                            <Typography level="body-sm" fontWeight={500} noWrap>
                              {p.name}
                            </Typography>
                            {isDuplicate && (
                              <Tooltip title="Duplicate Name warning" variant="outlined" color="warning">
                                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                              </Tooltip>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => handleStartEditParticipant(p)}
                          >
                            <Edit2 size={13} />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => onReorderParticipant(selectedCategory.id, p.id, 'up')}
                          >
                            <ArrowUp size={13} />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => onReorderParticipant(selectedCategory.id, p.id, 'down')}
                          >
                            <ArrowDown size={13} />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="danger"
                            onClick={() => triggerDeleteParticipant(p, pIndex)}
                          >
                            <Trash2 size={13} />
                          </IconButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
            <Typography level="title-lg" fontFamily="Space Grotesk" sx={{ mb: 1, color: 'text.secondary' }}>
              No Category Selected
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', maxW: '280px' }}>
              Select a category from the list above or create a new one to start configuring your wheel.
            </Typography>
          </div>
        )}
      </div>

      {/* Bulk Add dialog */}
      <Modal open={isBulkOpen} onClose={() => setIsBulkOpen(false)}>
        <ModalDialog sx={{ maxWidth: 500, width: '100%', borderRadius: '20px' }}>
          <DialogTitle sx={{ fontFamily: 'Space Grotesk', fontWeight: 'bold' }}>
            Paste Multiple Names
          </DialogTitle>
          <DialogContent>
            <Typography level="body-sm" sx={{ mb: 2, color: 'text.secondary' }}>
              Paste one participant name per line. Empty lines will be automatically omitted and spaces trimmed.
            </Typography>
            <textarea
              placeholder="John Smith&#10;Mary Jane&#10;David Copperfield"
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5F44] dark:focus:ring-[#7FA36B] text-sm font-mono mb-2.5"
            />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button variant="plain" color="neutral" onClick={() => setIsBulkOpen(false)}>
                Cancel
              </Button>
              <Button variant="solid" color="primary" onClick={handleBulkAdd}>
                Add Names
              </Button>
            </Stack>
          </DialogContent>
        </ModalDialog>
      </Modal>

      {/* Backup and restore modal */}
      <Modal open={isImportExportOpen} onClose={() => setIsImportExportOpen(false)}>
        <ModalDialog sx={{ maxWidth: 440, width: '100%', borderRadius: '20px' }}>
          <DialogTitle sx={{ fontFamily: 'Space Grotesk', fontWeight: 'bold' }}>
            Backup & Restore Data
          </DialogTitle>
          <DialogContent>
            <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
              Export your categories and names to a portable JSON backup file, or restore a previous save file.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="neutral"
                  onClick={handleExportJSON}
                  startDecorator={<Download size={16} />}
                  sx={{ py: 1.5 }}
                >
                  Export JSON
                </Button>
              </Grid>
              <Grid xs={6}>
                <Button
                  fullWidth
                  variant="solid"
                  color="primary"
                  onClick={() => fileInputRef.current?.click()}
                  startDecorator={<Upload size={16} />}
                  sx={{ py: 1.5 }}
                >
                  Import JSON
                </Button>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImportFileChange}
                />
              </Grid>
            </Grid>

            {importError && (
              <Sheet
                variant="soft"
                color="danger"
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  mt: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                <Typography level="body-xs" color="danger">
                  {importError}
                </Typography>
              </Sheet>
            )}

            <Divider sx={{ my: 2 }} />

            <div className="flex justify-end">
              <Button variant="plain" color="neutral" onClick={() => setIsImportExportOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </ModalDialog>
      </Modal>

      {/* Undo Delete Snackbar */}
      <Snackbar
        autoHideDuration={6000}
        open={undoSnackbarOpen}
        onClose={() => setUndoSnackbarOpen(false)}
        color="neutral"
        variant="solid"
        sx={{ borderRadius: '12px' }}
        endDecorator={
          <Button size="sm" variant="soft" color="success" onClick={handleUndo}>
            UNDO
          </Button>
        }
      >
        Deleted {undoPayload?.type === 'category' ? 'category' : 'name'} "{undoPayload?.data.name}"
      </Snackbar>
    </Sheet>
  );
}
