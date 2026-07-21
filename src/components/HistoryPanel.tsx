import { Sheet, Typography, Button, Stack, Divider, List, ListItem, Chip } from '@mui/joy';
import { History, Trash2, Calendar } from 'lucide-react';
import { SpinHistoryItem } from '../types';

interface HistoryPanelProps {
  history: SpinHistoryItem[];
  onClearHistory: () => void;
  themeMode: 'light' | 'dark';
}

export default function HistoryPanel({ history, onClearHistory, themeMode }: HistoryPanelProps) {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <Sheet
      variant="plain"
      sx={{
        p: 3,
        borderRadius: '24px',
        bgcolor: 'background.surface',
        boxShadow: 'sm',
        border: '1px solid',
        borderColor: themeMode === 'light' ? '#E3E8DD' : '#243126',
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        height: '100%',
        maxHeight: '450px',
      }}
    >
      <div className="flex justify-between items-center">
        <div>
          <Stack direction="row" spacing={1} alignItems="center">
            <History size={18} className="text-neutral-500" />
            <Typography level="h4" fontFamily="Space Grotesk" fontWeight="bold">
              Spin History
            </Typography>
          </Stack>
          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
            A log of past landed participants
          </Typography>
        </div>

        {history.length > 0 && (
          <Button
            size="sm"
            variant="soft"
            color="danger"
            startDecorator={<Trash2 size={14} />}
            onClick={onClearHistory}
          >
            Clear
          </Button>
        )}
      </div>

      <Divider />

      <div className="flex-grow overflow-y-auto pr-1">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <History className="mx-auto text-neutral-300 mb-3" size={32} />
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              No past spins recorded yet. Spin the wheel to begin logging history!
            </Typography>
          </div>
        ) : (
          <List sx={{ gap: 1 }}>
            {history.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: themeMode === 'light' ? '#F7F8F3' : '#1C291F',
                  border: '1px solid',
                  borderColor: themeMode === 'light' ? '#EBECE6' : '#243126',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 1,
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <Typography level="title-sm" fontWeight="bold" sx={{ color: themeMode === 'light' ? '#3E5F44' : '#EBF2EA' }}>
                    {item.winnerName}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" className="shrink-0 text-neutral-400">
                    <Calendar size={11} />
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      {formatTime(item.timestamp)}
                    </Typography>
                  </Stack>
                </div>
                <div className="flex justify-between items-center">
                  <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '10px' }}>
                    {item.categoryName}
                  </Chip>
                </div>
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </Sheet>
  );
}
