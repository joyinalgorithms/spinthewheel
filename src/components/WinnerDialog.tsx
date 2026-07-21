import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal, ModalDialog, Typography, Button, Stack, Sheet } from '@mui/joy';
import { Award, RefreshCw, Trash2, Check } from 'lucide-react';
import { Participant } from '../types';

interface WinnerDialogProps {
  open: boolean;
  winner: Participant | null;
  onClose: () => void;
  onSpinAgain: () => void;
  onRemoveWinner: (winner: Participant) => void;
  categoryName: string;
  themeMode: 'light' | 'dark';
}

export default function WinnerDialog({
  open,
  winner,
  onClose,
  onSpinAgain,
  onRemoveWinner,
  categoryName,
  themeMode,
}: WinnerDialogProps) {
  // Support keyboard hotkey 'Enter' to quickly spin again when the winner card is active
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSpinAgain();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onSpinAgain]);

  if (!winner) return null;

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 1000 }}>
      <AnimatePresence>
        {open && (
          <ModalDialog
            aria-labelledby="winner-dialog-title"
            sx={{
              p: 0,
              maxWidth: 480,
              width: '90%',
              borderRadius: '24px',
              border: 'none',
              overflow: 'hidden',
              background: 'transparent',
              boxShadow: 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            >
              <Sheet
                variant="solid"
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: '24px',
                  bgcolor: themeMode === 'light' ? '#FFFFFF' : '#243126',
                  color: themeMode === 'light' ? '#1F2A20' : '#EBF2EA',
                  border: '2px solid',
                  borderColor: themeMode === 'light' ? '#3E5F44' : '#7FA36B',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px -4px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                }}
              >
                {/* Visual sparkles overlay */}
                <div className="absolute top-4 left-6 text-2xl animate-bounce select-none">🎉</div>
                <div className="absolute top-6 right-8 text-2xl animate-bounce delay-100 select-none">✨</div>
                <div className="absolute bottom-16 left-8 text-2xl animate-pulse select-none">🌟</div>
                <div className="absolute bottom-12 right-10 text-2xl animate-pulse delay-200 select-none">💫</div>

                {/* Animated Golden Trophy/Award */}
                <motion.div
                  initial={{ rotate: -15, scale: 0.6 }}
                  animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                  className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 mb-4 shadow-sm"
                >
                  <Award size={36} className="stroke-[2.5]" />
                </motion.div>

                {/* Header Labels */}
                <Typography
                  level="body-xs"
                  sx={{
                    color: themeMode === 'light' ? '#5E7B5A' : '#A3B4A5',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    mb: 1,
                  }}
                >
                  We have a winner!
                </Typography>

                <Typography
                  id="winner-dialog-title"
                  level="body-xs"
                  sx={{
                    color: themeMode === 'light' ? 'text.secondary' : 'text.secondary',
                    mb: 2.5,
                  }}
                >
                  Category: <span className="font-semibold">{categoryName}</span>
                </Typography>

                {/* Winner Display Panel */}
                <motion.div
                  initial={{ letterSpacing: '0px' }}
                  animate={{ letterSpacing: '0.5px' }}
                  transition={{ delay: 0.2 }}
                  className="py-5 px-4 mb-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800 shadow-inner flex flex-col justify-center items-center"
                >
                  <Typography
                    level="h1"
                    fontFamily="Space Grotesk"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.8rem', sm: '2.4rem' },
                      color: themeMode === 'light' ? '#3E5F44' : '#7FA36B',
                      lineHeight: 1.2,
                      wordBreak: 'break-word',
                    }}
                  >
                    {winner.name}
                  </Typography>
                </motion.div>

                {/* Action Controls Stack */}
                <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    variant="solid"
                    color="primary"
                    size="lg"
                    onClick={onSpinAgain}
                    startDecorator={<RefreshCw size={18} />}
                    sx={{
                      flexGrow: 1,
                      minW: 140,
                      boxShadow: 'md',
                      '&:hover': { transform: 'translateY(-1px)' },
                      transition: 'transform 0.2s',
                    }}
                  >
                    Spin Again
                  </Button>

                  <Button
                    variant="outlined"
                    color="danger"
                    size="lg"
                    onClick={() => onRemoveWinner(winner)}
                    startDecorator={<Trash2 size={18} />}
                    sx={{
                      flexGrow: 1,
                      minW: 140,
                      '&:hover': { transform: 'translateY(-1px)' },
                      transition: 'transform 0.2s',
                    }}
                  >
                    Remove Name
                  </Button>

                  <Button
                    variant="outlined"
                    color="neutral"
                    size="lg"
                    onClick={onClose}
                    startDecorator={<Check size={18} />}
                    sx={{
                      flexGrow: 1,
                      minW: 120,
                      '&:hover': { transform: 'translateY(-1px)' },
                      transition: 'transform 0.2s',
                    }}
                  >
                    Keep Name
                  </Button>
                </Stack>

                {/* Small Hint */}
                <Typography level="body-xs" sx={{ mt: 2.5, color: 'text.tertiary', opacity: 0.8 }}>
                  Press <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono">Enter</kbd> to spin again instantly
                </Typography>
              </Sheet>
            </motion.div>
          </ModalDialog>
        )}
      </AnimatePresence>
    </Modal>
  );
}
