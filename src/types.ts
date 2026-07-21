export interface Participant {
  id: string;
  name: string;
  color?: string; // Optional custom color override for wheel slice
}

export interface Category {
  id: string;
  name: string;
  names: Participant[];
  colorTag: string; // Hex color for card border/accent
  isFavorite: boolean;
  createdAt: string;
}

export interface AppSettings {
  spinDuration: number; // in seconds (6 - 9)
  soundEnabled: boolean;
  confettiEnabled: boolean;
  autoRemoveWinner: boolean;
}

export interface SpinHistoryItem {
  id: string;
  timestamp: string;
  winnerName: string;
  categoryName: string;
  categoryId: string;
}
