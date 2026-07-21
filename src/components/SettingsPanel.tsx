import { Sheet, Typography, Switch, Stack, Divider, Slider, Tooltip } from '@mui/joy';
import { Volume2, VolumeX, Sparkles, UserMinus, Clock } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  themeMode: 'light' | 'dark';
}

export default function SettingsPanel({ settings, onUpdateSettings, themeMode }: SettingsPanelProps) {
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
      }}
    >
      <div>
        <Typography level="h4" fontFamily="Space Grotesk" fontWeight="bold">
          Preferences & Settings
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
          Personalize the picker's physical mechanics
        </Typography>
      </div>

      <Divider />

      <Stack spacing={2.5}>
        {/* Spin Duration */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} className="text-neutral-500" />
              <Typography level="title-sm">Spin Duration</Typography>
            </Stack>
            <Typography level="body-xs" fontWeight="bold" color="primary">
              {settings.spinDuration} seconds
            </Typography>
          </div>
          <Slider
            min={6}
            max={9}
            step={0.5}
            value={settings.spinDuration}
            onChange={(_, val) => onUpdateSettings({ spinDuration: val as number })}
            valueLabelDisplay="auto"
            color="primary"
            sx={{ mx: 0.5 }}
          />
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: -0.5 }}>
            Longer duration creates extra tension and suspense.
          </Typography>
        </div>

        <Divider />

        {/* Enable Sound */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col gap-0.5">
            <Stack direction="row" spacing={1} alignItems="center">
              {settings.soundEnabled ? (
                <Volume2 size={16} className="text-neutral-500" />
              ) : (
                <VolumeX size={16} className="text-neutral-400" />
              )}
              <Typography level="title-sm">Tick Sound Effects</Typography>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              Synthesize auditory tick marks as partitions pass.
            </Typography>
          </div>
          <Switch
            checked={settings.soundEnabled}
            onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
            color="primary"
            variant="solid"
          />
        </div>

        {/* Enable Confetti */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col gap-0.5">
            <Stack direction="row" spacing={1} alignItems="center">
              <Sparkles size={16} className="text-neutral-500" />
              <Typography level="title-sm">Confetti Burst</Typography>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              Launch floating particle animation upon completion.
            </Typography>
          </div>
          <Switch
            checked={settings.confettiEnabled}
            onChange={(e) => onUpdateSettings({ confettiEnabled: e.target.checked })}
            color="primary"
            variant="solid"
          />
        </div>

        {/* Auto Remove Winner */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col gap-0.5">
            <Stack direction="row" spacing={1} alignItems="center">
              <UserMinus size={16} className="text-neutral-500" />
              <Typography level="title-sm">Auto-Remove Winner</Typography>
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              Instantly omit winner from active list upon landing.
            </Typography>
          </div>
          <Switch
            checked={settings.autoRemoveWinner}
            onChange={(e) => onUpdateSettings({ autoRemoveWinner: e.target.checked })}
            color="primary"
            variant="solid"
          />
        </div>
      </Stack>
    </Sheet>
  );
}
