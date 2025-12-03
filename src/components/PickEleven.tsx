import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslation } from '../lib/translations';

interface Player {
  id: string;
  name: string;
  league: string;
  club: string;
  position: string;
  value: number;
  total_points?: number;
}

interface PickElevenProps {
  userId: string;
  onComplete: () => void;
  onBack?: () => void;
}

interface FieldPosition {
  x: number;
  y: number;
  label: string;
}

const POSITION_SHORT_MAP: Record<string, string> = {
  'Goalkeeper': 'GK',
  'Centre-Back': 'CB',
  'Left-Back': 'LB',
  'Right-Back': 'RB',
  'Defensive Midfield': 'DM',
  'Central Midfield': 'CM',
  'Attacking Midfield': 'AM',
  'Left Midfield': 'LM',
  'Right Midfield': 'RM',
  'Left Winger': 'LW',
  'Right Winger': 'RW',
  'Centre-Forward': 'CF',
  'Striker': 'ST',
};

const FORMATION_LAYOUTS: Record<string, FieldPosition[]> = {
  '1-4-3-3 Line': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 30, y: 43, label: 'CM' },
    { x: 50, y: 43, label: 'CM' },
    { x: 70, y: 43, label: 'CM' },
    { x: 20, y: 18, label: 'LW' },
    { x: 50, y: 13, label: 'ST' },
    { x: 80, y: 18, label: 'RW' },
  ],
  '1-4-3-3 (1-2)': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 50, y: 53, label: 'DM' },
    { x: 35, y: 38, label: 'CM' },
    { x: 65, y: 38, label: 'CM' },
    { x: 20, y: 18, label: 'LW' },
    { x: 50, y: 13, label: 'ST' },
    { x: 80, y: 18, label: 'RW' },
  ],
  '1-4-3-3 (2-1)': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 35, y: 50, label: 'CM' },
    { x: 65, y: 50, label: 'CM' },
    { x: 50, y: 35, label: 'AM' },
    { x: 20, y: 18, label: 'LW' },
    { x: 50, y: 13, label: 'ST' },
    { x: 80, y: 18, label: 'RW' },
  ],
  '1-4-4-2 Line': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 20, y: 43, label: 'LM' },
    { x: 40, y: 43, label: 'CM' },
    { x: 60, y: 43, label: 'CM' },
    { x: 80, y: 43, label: 'RM' },
    { x: 35, y: 18, label: 'ST' },
    { x: 65, y: 18, label: 'ST' },
  ],
  '1-4-4-2 Diamond': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 50, y: 53, label: 'DM' },
    { x: 30, y: 38, label: 'LM' },
    { x: 70, y: 38, label: 'RM' },
    { x: 50, y: 25, label: 'AM' },
    { x: 35, y: 13, label: 'ST' },
    { x: 65, y: 13, label: 'ST' },
  ],
  '1-4-4-2 (1-3)': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 50, y: 53, label: 'DM' },
    { x: 25, y: 38, label: 'LM' },
    { x: 50, y: 38, label: 'CM' },
    { x: 75, y: 38, label: 'RM' },
    { x: 35, y: 18, label: 'ST' },
    { x: 65, y: 18, label: 'ST' },
  ],
  '1-4-4-2 (3-1)': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 25, y: 50, label: 'LM' },
    { x: 50, y: 50, label: 'CM' },
    { x: 75, y: 50, label: 'RM' },
    { x: 50, y: 35, label: 'AM' },
    { x: 35, y: 18, label: 'ST' },
    { x: 65, y: 18, label: 'ST' },
  ],
  '1-4-4-2 Square': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 35, y: 50, label: 'CM' },
    { x: 65, y: 50, label: 'CM' },
    { x: 35, y: 35, label: 'CM' },
    { x: 65, y: 35, label: 'CM' },
    { x: 35, y: 18, label: 'ST' },
    { x: 65, y: 18, label: 'ST' },
  ],
  '1-4-2-3-1': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 40, y: 53, label: 'DM' },
    { x: 60, y: 53, label: 'DM' },
    { x: 20, y: 31, label: 'LW' },
    { x: 50, y: 35, label: 'AM' },
    { x: 80, y: 31, label: 'RW' },
    { x: 50, y: 13, label: 'ST' },
  ],
  '1-3-5-2': [
    { x: 50, y: 85, label: 'GK' },
    { x: 30, y: 68, label: 'CB' },
    { x: 50, y: 68, label: 'CB' },
    { x: 70, y: 68, label: 'CB' },
    { x: 20, y: 43, label: 'LM' },
    { x: 35, y: 43, label: 'CM' },
    { x: 50, y: 43, label: 'CM' },
    { x: 65, y: 43, label: 'CM' },
    { x: 80, y: 43, label: 'RM' },
    { x: 35, y: 18, label: 'ST' },
    { x: 65, y: 18, label: 'ST' },
  ],
  '1-4-2-4': [
    { x: 50, y: 85, label: 'GK' },
    { x: 20, y: 68, label: 'LB' },
    { x: 40, y: 68, label: 'CB' },
    { x: 60, y: 68, label: 'CB' },
    { x: 80, y: 68, label: 'RB' },
    { x: 40, y: 45, label: 'CM' },
    { x: 60, y: 45, label: 'CM' },
    { x: 18, y: 23, label: 'LW' },
    { x: 38, y: 18, label: 'CF' },
    { x: 62, y: 18, label: 'CF' },
    { x: 82, y: 23, label: 'RW' },
  ],
  '1-3-4-3 Line': [
    { x: 50, y: 85, label: 'GK' },
    { x: 30, y: 68, label: 'CB' },
    { x: 50, y: 68, label: 'CB' },
    { x: 70, y: 68, label: 'CB' },
    { x: 25, y: 43, label: 'LM' },
    { x: 42, y: 43, label: 'CM' },
    { x: 58, y: 43, label: 'CM' },
    { x: 75, y: 43, label: 'RM' },
    { x: 20, y: 18, label: 'LW' },
    { x: 50, y: 13, label: 'ST' },
    { x: 80, y: 18, label: 'RW' },
  ],
  '1-3-4-3 Diamond': [
    { x: 50, y: 85, label: 'GK' },
    { x: 30, y: 68, label: 'CB' },
    { x: 50, y: 68, label: 'CB' },
    { x: 70, y: 68, label: 'CB' },
    { x: 50, y: 50, label: 'DM' },
    { x: 30, y: 38, label: 'LM' },
    { x: 70, y: 38, label: 'RM' },
    { x: 50, y: 25, label: 'AM' },
    { x: 20, y: 13, label: 'LW' },
    { x: 50, y: 8, label: 'ST' },
    { x: 80, y: 13, label: 'RW' },
  ],
  '1-5-2-3': [
    { x: 50, y: 85, label: 'GK' },
    { x: 15, y: 68, label: 'LWB' },
    { x: 32, y: 68, label: 'CB' },
    { x: 50, y: 68, label: 'CB' },
    { x: 68, y: 68, label: 'CB' },
    { x: 85, y: 68, label: 'RWB' },
    { x: 40, y: 48, label: 'CM' },
    { x: 60, y: 48, label: 'CM' },
    { x: 25, y: 23, label: 'LW' },
    { x: 50, y: 18, label: 'ST' },
    { x: 75, y: 23, label: 'RW' },
  ],
  '1-5-3-2 (1-2)': [
    { x: 50, y: 85, label: 'GK' },
    { x: 15, y: 68, label: 'LWB' },
    { x: 32, y: 68, label: 'CB' },
    { x: 50, y: 68, label: 'CB' },
    { x: 68, y: 68, label: 'CB' },
    { x: 85, y: 68, label: 'RWB' },
    { x: 50, y: 50, label: 'DM' },
    { x: 35, y: 35, label: 'CM' },
    { x: 65, y: 35, label: 'CM' },
    { x: 35, y: 18, label: 'ST' },
    { x: 65, y: 18, label: 'ST' },
  ],
  '1-5-3-2 (2-1)': [
    { x: 50, y: 85, label: 'GK' },
    { x: 15, y: 68, label: 'LWB' },
    { x: 32, y: 68, label: 'CB' },
    { x: 50, y: 68, label: 'CB' },
    { x: 68, y: 68, label: 'CB' },
    { x: 85, y: 68, label: 'RWB' },
    { x: 35, y: 50, label: 'CM' },
    { x: 65, y: 50, label: 'CM' },
    { x: 50, y: 35, label: 'AM' },
    { x: 35, y: 18, label: 'ST' },
    { x: 65, y: 18, label: 'ST' },
  ],
  '1-5-4-1 Line': [
    { x: 50, y: 85, label: 'GK' },
    { x: 15, y: 68, label: 'LWB' },
    { x: 32, y: 68, label: 'CB' },
    { x: 50, y: 68, label: 'CB' },
    { x: 68, y: 68, label: 'CB' },
    { x: 85, y: 68, label: 'RWB' },
    { x: 25, y: 43, label: 'LM' },
    { x: 42, y: 43, label: 'CM' },
    { x: 58, y: 43, label: 'CM' },
    { x: 75, y: 43, label: 'RM' },
    { x: 50, y: 18, label: 'ST' },
  ],
  '1-5-4-1 Diamond': [
    { x: 50, y: 85, label: 'GK' },
    { x: 15, y: 68, label: 'LWB' },
    { x: 32, y: 68, label: 'CB' },
    { x: 50, y: 68, label: 'CB' },
    { x: 68, y: 68, label: 'CB' },
    { x: 85, y: 68, label: 'RWB' },
    { x: 50, y: 50, label: 'DM' },
    { x: 35, y: 38, label: 'LM' },
    { x: 65, y: 38, label: 'RM' },
    { x: 50, y: 25, label: 'AM' },
    { x: 50, y: 13, label: 'ST' },
  ],
};

export default function PickEleven({ userId, onComplete, onBack }: PickElevenProps) {
  const { language } = useLanguage();
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [tacticName, setTacticName] = useState<string>('1-4-3-3');
  const [availableTactics, setAvailableTactics] = useState<string[]>([]);
  const [fieldPositions, setFieldPositions] = useState<FieldPosition[]>([]);
  const [startingEleven, setStartingEleven] = useState<(Player | null)[]>([]);
  const [substitutes, setSubstitutes] = useState<(Player | null)[]>([null, null, null, null, null]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<'available' | 'field' | 'subs' | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedFieldPosition, setSelectedFieldPosition] = useState<number | null>(null);
  const [selectedSubPosition, setSelectedSubPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validated, setValidated] = useState(false);
  const [weekDates, setWeekDates] = useState({ start: '', end: '' });
  const [isSelectionOpen, setIsSelectionOpen] = useState(true);
  const [closingMessage, setClosingMessage] = useState('');

  useEffect(() => {
    loadData();
    calculateWeekDates();
    checkSelectionPeriod();

    const interval = setInterval(() => {
      checkSelectionPeriod();
    }, 60000);

    return () => clearInterval(interval);
  }, [userId]);

  const checkSelectionPeriod = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hours = now.getHours();

    const isTuesday = dayOfWeek === 2;
    const isTuesdayOpen = isTuesday && hours < 17;

    if (isTuesdayOpen) {
      setIsSelectionOpen(true);
      const closeTime = new Date(now);
      closeTime.setHours(17, 0, 0, 0);
      const msUntilClose = closeTime.getTime() - now.getTime();
      const hoursUntilClose = Math.floor(msUntilClose / (1000 * 60 * 60));
      const minutesUntilClose = Math.floor((msUntilClose % (1000 * 60 * 60)) / (1000 * 60));
      setClosingMessage(`Selection closes in ${hoursUntilClose}h ${minutesUntilClose}m`);
    } else {
      setIsSelectionOpen(false);

      const nextTuesday = new Date(now);
      let daysUntilTuesday;

      if (dayOfWeek === 2 && hours >= 17) {
        daysUntilTuesday = 7;
      } else if (dayOfWeek < 2) {
        daysUntilTuesday = 2 - dayOfWeek;
      } else {
        daysUntilTuesday = 9 - dayOfWeek;
      }

      nextTuesday.setDate(now.getDate() + daysUntilTuesday);
      nextTuesday.setHours(0, 0, 0, 0);

      const msUntilOpen = nextTuesday.getTime() - now.getTime();
      const daysUntil = Math.floor(msUntilOpen / (1000 * 60 * 60 * 24));
      const hoursUntil = Math.floor((msUntilOpen % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutesUntil = Math.floor((msUntilOpen % (1000 * 60 * 60)) / (1000 * 60));

      setClosingMessage(`Opens in ${daysUntil}d ${hoursUntil}h ${minutesUntil}m`);
    }
  };

  const calculateWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    let daysToTuesday = dayOfWeek === 0 ? -5 : dayOfWeek === 1 ? -6 : 2 - dayOfWeek;

    const tuesday = new Date(today);
    tuesday.setDate(today.getDate() + daysToTuesday);

    const monday = new Date(tuesday);
    monday.setDate(tuesday.getDate() + 6);

    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    setWeekDates({
      start: formatDate(tuesday),
      end: formatDate(monday)
    });
  };

  const loadData = async () => {
    try {
      const { data: allTactics } = await supabase
        .from('tactics')
        .select('name')
        .order('name');

      if (allTactics) {
        setAvailableTactics(allTactics.map(t => t.name));
      }

      const { data: tacticSelection } = await supabase
        .from('user_tactic_selection')
        .select('tactic_id')
        .eq('user_id', userId)
        .maybeSingle();

      let tacticToUse = '1-4-3-3';

      if (tacticSelection?.tactic_id) {
        const { data: tactic } = await supabase
          .from('tactics')
          .select('name')
          .eq('id', tacticSelection.tactic_id)
          .maybeSingle();

        if (tactic?.name) {
          tacticToUse = tactic.name;
        }
      }

      setTacticName(tacticToUse);
      const positions = FORMATION_LAYOUTS[tacticToUse] || FORMATION_LAYOUTS['1-4-3-3 Line'];
      setFieldPositions(positions);
      setStartingEleven(new Array(positions.length).fill(null));

      const { data: selections } = await supabase
        .from('user_player_selections')
        .select(`
          player_id,
          player_pool (
            id,
            name,
            league,
            club,
            position,
            value
          )
        `)
        .eq('user_id', userId);

      if (selections) {
        const players = selections
          .map(s => s.player_pool)
          .filter((p): p is Player => p !== null);

        const { data: pointsData, error: pointsError } = await supabase
          .from('player_weekly_points')
          .select('player_id, points');

        if (!pointsError && pointsData) {
          const playerTotalPoints = pointsData.reduce((acc, record) => {
            if (!acc[record.player_id]) {
              acc[record.player_id] = 0;
            }
            acc[record.player_id] += record.points;
            return acc;
          }, {} as Record<string, number>);

          const playersWithPoints = players.map(player => ({
            ...player,
            total_points: playerTotalPoints[player.id] || 0
          }));

          setSelectedPlayers(playersWithPoints);
          setAvailablePlayers(playersWithPoints);
        } else {
          setSelectedPlayers(players);
          setAvailablePlayers(players);
        }
      }

      const today = new Date();
      const dayOfWeek = today.getDay();
      let daysToTuesday = dayOfWeek === 0 ? -5 : dayOfWeek === 1 ? -6 : 2 - dayOfWeek;

      const tuesday = new Date(today);
      tuesday.setDate(today.getDate() + daysToTuesday);
      tuesday.setHours(0, 0, 0, 0);

      const weekStartDate = tuesday.toISOString().split('T')[0];

      const { data: existingSelection } = await supabase
        .from('weekly_eleven_selections')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();

      if (existingSelection) {
        const startingElevenData = existingSelection.starting_eleven as Player[];
        const substitutesData = existingSelection.substitutes as Player[];
        const savedTactic = existingSelection.tactic_name || tacticToUse;

        if (savedTactic !== tacticToUse) {
          setTacticName(savedTactic);
          const savedPositions = FORMATION_LAYOUTS[savedTactic] || FORMATION_LAYOUTS['1-4-3-3 Line'];
          setFieldPositions(savedPositions);
        }

        setStartingEleven(startingElevenData);
        setSubstitutes(substitutesData);
        setValidated(true);

        const usedPlayerIds = [
          ...startingElevenData.map((p: Player) => p.id),
          ...substitutesData.map((p: Player) => p.id)
        ];
        const available = selections
          ?.map(s => s.player_pool)
          .filter((p): p is Player => p !== null && !usedPlayerIds.includes(p.id)) || [];
        setAvailablePlayers(available);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPlayerCompatibleWithPosition = (playerPosition: string, fieldPosition: string): boolean => {
    const playerShort = POSITION_SHORT_MAP[playerPosition];

    if (playerShort === fieldPosition) return true;

    if ((playerShort === 'CF' && fieldPosition === 'ST') ||
        (playerShort === 'ST' && fieldPosition === 'CF')) {
      return true;
    }

    if ((playerShort === 'CF' && (fieldPosition === 'LW' || fieldPosition === 'RW')) ||
        ((playerShort === 'LW' || playerShort === 'RW') && fieldPosition === 'CF')) {
      return true;
    }

    if ((playerShort === 'CM' && (fieldPosition === 'LM' || fieldPosition === 'RM')) ||
        ((playerShort === 'LM' || playerShort === 'RM') && fieldPosition === 'CM')) {
      return true;
    }

    return false;
  };

  const handleTacticChange = (newTactic: string) => {
    if (validated || !isSelectionOpen) return;

    setTacticName(newTactic);
    const positions = FORMATION_LAYOUTS[newTactic] || FORMATION_LAYOUTS['1-4-3-3 Line'];
    setFieldPositions(positions);

    const newStartingEleven = new Array(positions.length).fill(null);
    const playersToReturn: Player[] = [];

    startingEleven.forEach((player) => {
      if (player) {
        const compatibleIndex = positions.findIndex((pos, idx) =>
          newStartingEleven[idx] === null && isPlayerCompatibleWithPosition(player.position, pos.label)
        );

        if (compatibleIndex !== -1) {
          newStartingEleven[compatibleIndex] = player;
        } else {
          playersToReturn.push(player);
        }
      }
    });

    setStartingEleven(newStartingEleven);
    setAvailablePlayers([...availablePlayers, ...playersToReturn]);
  };

  const handleDragStart = (player: Player, from: 'available' | 'field' | 'subs', index?: number) => {
    if (validated || !isSelectionOpen) return;
    setDraggedPlayer(player);
    setDraggedFrom(from);
    setDraggedIndex(index ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnField = (index: number) => {
    if (!draggedPlayer || !draggedFrom || validated || !isSelectionOpen) return;

    const newStartingEleven = [...startingEleven];
    const newAvailable = [...availablePlayers];
    const newSubs = [...substitutes];

    if (draggedFrom === 'available') {
      newStartingEleven[index] = draggedPlayer;
      const playerIdx = newAvailable.findIndex(p => p.id === draggedPlayer.id);
      if (playerIdx !== -1) newAvailable.splice(playerIdx, 1);
    } else if (draggedFrom === 'field' && draggedIndex !== null) {
      const swapPlayer = newStartingEleven[index];
      newStartingEleven[index] = draggedPlayer;
      newStartingEleven[draggedIndex] = swapPlayer;
    } else if (draggedFrom === 'subs' && draggedIndex !== null) {
      const swapPlayer = newStartingEleven[index];
      newStartingEleven[index] = draggedPlayer;
      newSubs[draggedIndex] = swapPlayer;
    }

    setStartingEleven(newStartingEleven);
    setAvailablePlayers(newAvailable);
    setSubstitutes(newSubs);
    setDraggedPlayer(null);
    setDraggedFrom(null);
    setDraggedIndex(null);
  };

  const handleDropOnSubs = (index: number) => {
    if (!draggedPlayer || !draggedFrom || validated || !isSelectionOpen) return;

    const newSubs = [...substitutes];
    const newAvailable = [...availablePlayers];
    const newStartingEleven = [...startingEleven];

    if (draggedFrom === 'available') {
      newSubs[index] = draggedPlayer;
      const playerIdx = newAvailable.findIndex(p => p.id === draggedPlayer.id);
      if (playerIdx !== -1) newAvailable.splice(playerIdx, 1);
    } else if (draggedFrom === 'field' && draggedIndex !== null) {
      const swapPlayer = newSubs[index];
      newSubs[index] = draggedPlayer;
      newStartingEleven[draggedIndex] = swapPlayer;
    } else if (draggedFrom === 'subs' && draggedIndex !== null) {
      const swapPlayer = newSubs[index];
      newSubs[index] = draggedPlayer;
      newSubs[draggedIndex] = swapPlayer;
    }

    setSubstitutes(newSubs);
    setAvailablePlayers(newAvailable);
    setStartingEleven(newStartingEleven);
    setDraggedPlayer(null);
    setDraggedFrom(null);
    setDraggedIndex(null);
  };

  const handleDropOnAvailable = () => {
    if (!draggedPlayer || !draggedFrom || validated || !isSelectionOpen) return;

    const newAvailable = [...availablePlayers, draggedPlayer];
    const newStartingEleven = [...startingEleven];
    const newSubs = [...substitutes];

    if (draggedFrom === 'field' && draggedIndex !== null) {
      newStartingEleven[draggedIndex] = null;
    } else if (draggedFrom === 'subs' && draggedIndex !== null) {
      newSubs[draggedIndex] = null;
    }

    setAvailablePlayers(newAvailable);
    setStartingEleven(newStartingEleven);
    setSubstitutes(newSubs);
    setDraggedPlayer(null);
    setDraggedFrom(null);
    setDraggedIndex(null);
  };

  const handleFieldPositionClick = (index: number) => {
    if (startingEleven[index] || validated || !isSelectionOpen) return;

    setSelectedFieldPosition(index);
    setSelectedSubPosition(null);
  };

  const handleSubPositionClick = (index: number) => {
    if (substitutes[index] || validated || !isSelectionOpen) return;

    setSelectedSubPosition(index);
    setSelectedFieldPosition(null);
  };

  const handleAvailablePlayerClick = (player: Player) => {
    if (validated || !isSelectionOpen) return;

    if (selectedFieldPosition !== null) {
      const newStartingEleven = [...startingEleven];
      const newAvailable = availablePlayers.filter(p => p.id !== player.id);
      newStartingEleven[selectedFieldPosition] = player;

      setStartingEleven(newStartingEleven);
      setAvailablePlayers(newAvailable);
      setSelectedFieldPosition(null);
    } else if (selectedSubPosition !== null) {
      const newSubs = [...substitutes];
      const newAvailable = availablePlayers.filter(p => p.id !== player.id);
      newSubs[selectedSubPosition] = player;

      setSubstitutes(newSubs);
      setAvailablePlayers(newAvailable);
      setSelectedSubPosition(null);
    }
  };

  const handleAvailablePlayerDoubleClick = (player: Player) => {
    if (validated || !isSelectionOpen) return;

    const playerShortPosition = POSITION_SHORT_MAP[player.position];

    const emptyPositionIndex = fieldPositions.findIndex((pos, index) => {
      if (startingEleven[index] !== null) return false;

      if (pos.label === playerShortPosition) return true;

      if ((playerShortPosition === 'CF' && pos.label === 'ST') ||
          (playerShortPosition === 'ST' && pos.label === 'CF')) {
        return true;
      }

      if ((playerShortPosition === 'CF' && (pos.label === 'LW' || pos.label === 'RW')) ||
          ((playerShortPosition === 'LW' || playerShortPosition === 'RW') && pos.label === 'CF')) {
        return true;
      }

      if ((playerShortPosition === 'CM' && (pos.label === 'LM' || pos.label === 'RM')) ||
          ((playerShortPosition === 'LM' || playerShortPosition === 'RM') && pos.label === 'CM')) {
        return true;
      }

      return false;
    });

    if (emptyPositionIndex !== -1) {
      const newStartingEleven = [...startingEleven];
      const newAvailable = availablePlayers.filter(p => p.id !== player.id);
      newStartingEleven[emptyPositionIndex] = player;

      setStartingEleven(newStartingEleven);
      setAvailablePlayers(newAvailable);
    }
  };

  const handleFieldPlayerDoubleClick = (index: number) => {
    if (validated || !isSelectionOpen) return;
    const player = startingEleven[index];
    if (!player) return;

    const newStartingEleven = [...startingEleven];
    const newAvailable = [...availablePlayers, player];
    newStartingEleven[index] = null;

    setStartingEleven(newStartingEleven);
    setAvailablePlayers(newAvailable);
  };

  const handleSubPlayerDoubleClick = (index: number) => {
    if (validated || !isSelectionOpen) return;
    const player = substitutes[index];
    if (!player) return;

    const newSubs = [...substitutes];
    const newAvailable = [...availablePlayers, player];
    newSubs[index] = null;

    setSubstitutes(newSubs);
    setAvailablePlayers(newAvailable);
  };

  const isElevenComplete = startingEleven.every(p => p !== null) && substitutes.every(p => p !== null);

  const handleSaveWeeklyEleven = async () => {
    if (!isElevenComplete) {
      alert('Please complete your starting eleven and all substitute positions before saving.');
      return;
    }

    if (!isSelectionOpen) {
      alert(closingMessage);
      return;
    }

    setSaving(true);

    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      let daysToTuesday = dayOfWeek === 0 ? -5 : dayOfWeek === 1 ? -6 : 2 - dayOfWeek;

      const tuesday = new Date(today);
      tuesday.setDate(today.getDate() + daysToTuesday);
      tuesday.setHours(0, 0, 0, 0);

      const monday = new Date(tuesday);
      monday.setDate(tuesday.getDate() + 6);
      monday.setHours(23, 59, 59, 999);

      const weekStartDate = tuesday.toISOString().split('T')[0];
      const weekEndDate = monday.toISOString().split('T')[0];

      const { data: existing } = await supabase
        .from('weekly_eleven_selections')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();

      const weeklyData = {
        user_id: userId,
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        starting_eleven: startingEleven,
        substitutes: substitutes,
        tactic_name: tacticName,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await supabase
          .from('weekly_eleven_selections')
          .update(weeklyData)
          .eq('id', existing.id);

        if (error) throw error;
        alert('Your Eleven of the Week has been updated successfully!');
      } else {
        const { error } = await supabase
          .from('weekly_eleven_selections')
          .insert(weeklyData);

        if (error) throw error;
        alert('Your Eleven of the Week has been saved successfully!');
      }

      setValidated(true);
    } catch (error) {
      console.error('Error saving weekly eleven:', error);
      alert('Failed to save your Eleven of the Week. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!validated && isElevenComplete) {
      alert('Please validate and save your Eleven of the Week before continuing.');
      return;
    }
    onComplete();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none" style={{ zIndex: 10 }}>
        <img
          src="/Eleven of the Week.png"
          alt="Background"
          className="max-w-3xl w-full h-auto object-contain"
        />
      </div>
      <div className="bg-gradient-to-b from-black via-black/80 to-transparent py-8 px-6 relative z-10 pb-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <img
              src="/Eleven of the Week.png"
              alt="Eleven of the Week"
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
          </div>

          <button
            onClick={handleComplete}
            disabled={!validated}
            className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">{getTranslation('screens.elevenOfWeek', language)}</h1>
          <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-400/50 rounded-lg py-2 px-4 inline-block mb-3">
            <p className="text-cyan-100 font-semibold">Week: {weekDates.start} - {weekDates.end}</p>
          </div>


          {isSelectionOpen && !validated && (
            <div className="bg-yellow-500/20 backdrop-blur-md border-2 border-yellow-400/50 rounded-lg py-3 px-6 inline-block mb-3">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-300 animate-pulse" />
                <div>
                  <p className="text-yellow-200 font-bold text-sm">Selection Open</p>
                  <p className="text-yellow-300 text-lg font-bold">{closingMessage}</p>
                </div>
              </div>
            </div>
          )}

          {validated && (
            <div className="bg-green-500/20 backdrop-blur-md border border-green-400/50 rounded-lg py-2 px-4 inline-block mb-3">
              <p className="text-green-200 font-semibold">✓ Your eleven is locked for this week</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mb-4">
            <label className="text-cyan-300 font-semibold">Tactic:</label>
            <select
              value={tacticName}
              onChange={(e) => handleTacticChange(e.target.value)}
              disabled={validated || !isSelectionOpen}
              className="bg-cyan-900/80 border border-cyan-400/50 text-white rounded-lg px-4 py-2 font-semibold focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availableTactics.map(tactic => (
                <option key={tactic} value={tactic}>{tactic}</option>
              ))}
            </select>
          </div>

          <p className="text-cyan-200">{validated ? 'Your locked eleven' : 'Drag and drop players onto the field'}</p>

          {isElevenComplete && !validated && isSelectionOpen && (
            <div className="mt-4">
              <button
                onClick={handleSaveWeeklyEleven}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {saving ? 'Saving...' : 'Validate & Lock Eleven of the Week'}
              </button>
            </div>
          )}

          {validated && (
            <div className="mt-4">
              <p className="text-green-300 text-sm">Your eleven has been saved! You can now proceed to the next step.</p>
            </div>
          )}
        </div>

        {/* Field - Vertical */}
        <div className="mb-8">
          <div className="relative w-full max-w-3xl mx-auto" style={{ height: '900px' }}>
            <img
              src="/campo de futebol 1.webp"
              alt="Football Field"
              className="absolute w-full h-full"
              style={{ objectFit: 'fill', objectPosition: 'center', zIndex: 0 }}
            />

            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                zIndex: 1,
                opacity: 0.1,
                maskImage: 'radial-gradient(ellipse, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.3) 90%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.3) 90%, rgba(0,0,0,0) 100%)'
              }}
            >
              <img
                src="/Eleven of the Week.png"
                alt="Dragon Watermark"
                className="object-contain"
                style={{ width: '120%', height: '120%', maxWidth: 'none', maxHeight: 'none' }}
              />
            </div>


            {fieldPositions.map((pos, index) => (
              <div
                key={index}
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnField(index)}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20
                }}
                className="w-[110px]"
              >
                {startingEleven[index] ? (
                  <div
                    draggable={!validated && isSelectionOpen}
                    onDragStart={() => handleDragStart(startingEleven[index]!, 'field', index)}
                    onDoubleClick={() => handleFieldPlayerDoubleClick(index)}
                    className={`bg-gradient-to-b from-cyan-500 to-cyan-600 border-2 border-cyan-300 rounded-lg p-2 text-center shadow-lg transition-all h-14 flex flex-col justify-center w-full ${
                      validated || !isSelectionOpen ? 'cursor-not-allowed opacity-90' : 'cursor-move hover:shadow-cyan-500/50'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-white truncate">{startingEleven[index]!.name.split(' ').pop()}</div>
                    <div className="text-[8px] text-cyan-100">{POSITION_SHORT_MAP[startingEleven[index]!.position]}</div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleFieldPositionClick(index)}
                    className={`h-14 w-full border-2 border-dashed rounded-lg flex items-center justify-center text-[10px] font-bold shadow-lg cursor-pointer transition-all ${
                      selectedFieldPosition === index
                        ? 'bg-cyan-400/50 border-cyan-300 text-white scale-110'
                        : 'bg-white/80 border-cyan-400 text-gray-900 hover:bg-cyan-200/50'
                    }`}
                  >
                    {pos.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Substitutes */}
        <div className="mb-8">
          <div className="bg-black/60 backdrop-blur-md border-2 border-cyan-400 rounded-xl p-4 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-white mb-3 text-center">Substitutes</h3>
              <div className="flex gap-3 justify-center">
                {substitutes.map((sub, index) => (
                  <div
                    key={index}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnSubs(index)}
                    className="flex-1 min-w-[90px] max-w-[110px]"
                  >
                    {sub ? (
                      <div
                        draggable={!validated && isSelectionOpen}
                        onDragStart={() => handleDragStart(sub, 'subs', index)}
                        onDoubleClick={() => handleSubPlayerDoubleClick(index)}
                        className={`bg-gradient-to-b from-yellow-400 to-yellow-500 border-2 border-yellow-300 rounded-lg p-2 text-center shadow-lg transition-all h-14 flex flex-col justify-center ${
                          validated || !isSelectionOpen ? 'cursor-not-allowed opacity-90' : 'cursor-move hover:shadow-yellow-500/50'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-gray-900 truncate">{sub.name.split(' ').pop()}</div>
                        <div className="text-[8px] text-gray-700">{POSITION_SHORT_MAP[sub.position]}</div>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleSubPositionClick(index)}
                        className={`h-14 border-2 border-dashed rounded-lg flex items-center justify-center text-[10px] font-semibold cursor-pointer transition-all ${
                          selectedSubPosition === index
                            ? 'bg-yellow-400/50 border-yellow-300 text-white scale-110'
                            : 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/30'
                        }`}
                      >
                        Sub {index + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Available Players */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropOnAvailable}
          className="bg-black/60 backdrop-blur-md border-2 border-cyan-400 rounded-xl p-6 max-w-2xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Available Players</h3>

          <div className="grid grid-cols-4 gap-2">
            {/* Goalkeepers */}
            <div>
              <h4 className="text-sm font-bold text-cyan-300 mb-3 text-center">Goalkeepers</h4>
              <div className="space-y-2">
                {availablePlayers.filter(p => p.position === 'Goalkeeper').map((player) => (
                  <div
                    key={player.id}
                    draggable={!validated && isSelectionOpen}
                    onDragStart={() => handleDragStart(player, 'available')}
                    onClick={() => handleAvailablePlayerClick(player)}
                    onDoubleClick={() => handleAvailablePlayerDoubleClick(player)}
                    className={`bg-gradient-to-b from-blue-500 to-blue-600 border-2 border-blue-400 rounded-lg p-1.5 transition-all shadow-md ${
                      validated || !isSelectionOpen ? 'cursor-not-allowed opacity-70' : 'cursor-move hover:shadow-blue-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="text-[9px] font-bold text-white truncate flex-1">{player.name}</div>
                      {player.total_points !== undefined && (
                        <div className="text-[8px] text-yellow-300 font-bold ml-1 flex-shrink-0">{player.total_points} pts</div>
                      )}
                    </div>
                    <div className="text-[8px] text-blue-100 truncate">{player.club}</div>
                    <div className="text-[8px] text-blue-200 font-semibold">{POSITION_SHORT_MAP[player.position]} • €{(player.value / 1000000).toFixed(1)}M</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defenders */}
            <div>
              <h4 className="text-sm font-bold text-cyan-300 mb-3 text-center">Defenders</h4>
              <div className="space-y-2">
                {availablePlayers.filter(p => ['Centre-Back', 'Left-Back', 'Right-Back'].includes(p.position)).map((player) => (
                  <div
                    key={player.id}
                    draggable={!validated && isSelectionOpen}
                    onDragStart={() => handleDragStart(player, 'available')}
                    onClick={() => handleAvailablePlayerClick(player)}
                    onDoubleClick={() => handleAvailablePlayerDoubleClick(player)}
                    className={`bg-gradient-to-b from-blue-500 to-blue-600 border-2 border-blue-400 rounded-lg p-1.5 transition-all shadow-md ${
                      validated || !isSelectionOpen ? 'cursor-not-allowed opacity-70' : 'cursor-move hover:shadow-blue-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="text-[9px] font-bold text-white truncate flex-1">{player.name}</div>
                      {player.total_points !== undefined && (
                        <div className="text-[8px] text-yellow-300 font-bold ml-1 flex-shrink-0">{player.total_points} pts</div>
                      )}
                    </div>
                    <div className="text-[8px] text-blue-100 truncate">{player.club}</div>
                    <div className="text-[8px] text-blue-200 font-semibold">{POSITION_SHORT_MAP[player.position]} • €{(player.value / 1000000).toFixed(1)}M</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Midfielders */}
            <div>
              <h4 className="text-sm font-bold text-cyan-300 mb-3 text-center">Midfielders</h4>
              <div className="space-y-2">
                {availablePlayers.filter(p => ['Defensive Midfield', 'Central Midfield', 'Attacking Midfield', 'Left Midfield', 'Right Midfield'].includes(p.position)).map((player) => (
                  <div
                    key={player.id}
                    draggable={!validated && isSelectionOpen}
                    onDragStart={() => handleDragStart(player, 'available')}
                    onDoubleClick={() => handleAvailablePlayerDoubleClick(player)}
                    onClick={() => handleAvailablePlayerClick(player)}
                    className={`bg-gradient-to-b from-blue-500 to-blue-600 border-2 border-blue-400 rounded-lg p-1.5 transition-all shadow-md ${
                      validated || !isSelectionOpen ? 'cursor-not-allowed opacity-70' : 'cursor-move hover:shadow-blue-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="text-[9px] font-bold text-white truncate flex-1">{player.name}</div>
                      {player.total_points !== undefined && (
                        <div className="text-[8px] text-yellow-300 font-bold ml-1 flex-shrink-0">{player.total_points} pts</div>
                      )}
                    </div>
                    <div className="text-[8px] text-blue-100 truncate">{player.club}</div>
                    <div className="text-[8px] text-blue-200 font-semibold">{POSITION_SHORT_MAP[player.position]} • €{(player.value / 1000000).toFixed(1)}M</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attackers */}
            <div>
              <h4 className="text-sm font-bold text-cyan-300 mb-3 text-center">Attackers</h4>
              <div className="space-y-2">
                {availablePlayers.filter(p => ['Left Winger', 'Right Winger', 'Centre-Forward', 'Striker'].includes(p.position)).map((player) => (
                  <div
                    key={player.id}
                    draggable={!validated && isSelectionOpen}
                    onDragStart={() => handleDragStart(player, 'available')}
                    onClick={() => handleAvailablePlayerClick(player)}
                    onDoubleClick={() => handleAvailablePlayerDoubleClick(player)}
                    className={`bg-gradient-to-b from-blue-500 to-blue-600 border-2 border-blue-400 rounded-lg p-1.5 transition-all shadow-md ${
                      validated || !isSelectionOpen ? 'cursor-not-allowed opacity-70' : 'cursor-move hover:shadow-blue-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="text-[9px] font-bold text-white truncate flex-1">{player.name}</div>
                      {player.total_points !== undefined && (
                        <div className="text-[8px] text-yellow-300 font-bold ml-1 flex-shrink-0">{player.total_points} pts</div>
                      )}
                    </div>
                    <div className="text-[8px] text-blue-100 truncate">{player.club}</div>
                    <div className="text-[8px] text-blue-200 font-semibold">{POSITION_SHORT_MAP[player.position]} • €{(player.value / 1000000).toFixed(1)}M</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {availablePlayers.length === 0 && (
            <div className="text-center text-cyan-300 py-8">
              All players assigned
            </div>
          )}
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(30, 58, 138, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(34, 211, 238, 0.5);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 211, 238, 0.7);
          }
        `}</style>
      </div>
    </div>
  );
}
