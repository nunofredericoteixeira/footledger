import { useState, useEffect } from 'react';
import { Trophy, Gavel, Clock, Users, TrendingUp, ArrowLeft, Wallet, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { connectWallet, type WalletConnection } from '../lib/web3';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslation } from '../lib/translations';

interface AuctionPlayer {
  id: string;
  name: string;
  position: string;
  club: string;
  league: string;
  value: number;
  image_url: string | null;
  description: string;
}

interface Auction {
  id: string;
  auction_player_id: string;
  start_date: string;
  end_date: string;
  starting_bid: number;
  current_bid: number;
  winner_user_id: string | null;
  status: string;
  auction_players: AuctionPlayer;
  // Optional preview stats
  total_points?: number;
  games_played?: number;
  week_label?: string;
  week_start?: string;
}

interface Bid {
  id: string;
  user_id: string;
  bid_amount: number;
  created_at: string;
}

interface AuctionPlayerProps {
  userId: string;
  onBack: () => void;
}

const normalizeName = (name: string) =>
  (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const getWeekInfo = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return {
      label: 'Data indefinida',
      start: dateString,
    };
  }
  const start = new Date(date);
  const day = start.getDay(); // 0 (Sun) - 6 (Sat)
  const distanceToMonday = (day + 6) % 7; // Monday as 0
  start.setDate(start.getDate() - distanceToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const format = (d: Date) =>
    d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
    });

  const label = `${format(start)} - ${format(end)}`;

  return {
    label,
    start: start.toISOString(),
  };
};

export default function AuctionPlayer({ userId, onBack }: AuctionPlayerProps) {
  const { language } = useLanguage();
  const [auctions, setAuctions] = useState<Auction[]>([]);
   const [fallbackAuction, setFallbackAuction] = useState<Auction | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nftName, setNftName] = useState('');
  const [nftAddress, setNftAddress] = useState('');
  const [nftNumber, setNftNumber] = useState('');
  const [nftOwnerAddress, setNftOwnerAddress] = useState('');
  const [hasFootLegers, setHasFootLegers] = useState(false);
  const [nftVerified, setNftVerified] = useState(false);
  const [showNftModal, setShowNftModal] = useState(false);
  const [footledgers, setFootledgers] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [winnerNames, setWinnerNames] = useState<Record<string, string>>({});
  const [auctionWinners, setAuctionWinners] = useState<Record<string, string>>({});
  const [availableWeeks, setAvailableWeeks] = useState<{ label: string; start: string }[]>([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>('');
  const [playerTotals, setPlayerTotals] = useState<Record<string, number>>({});

  const isAuctionEnded = (auction: Auction | null) => {
    if (!auction) return false;
    if (auction.status && auction.status !== 'active' && auction.status !== 'preview') return true;
    return new Date(auction.end_date).getTime() <= Date.now();
  };

  useEffect(() => {
    loadAuctions();
    loadUserBudget();

    const channel = supabase
      .channel('auction-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, () => {
        loadAuctions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_bids' }, () => {
        if (selectedAuction) {
          loadBids(selectedAuction.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedAuction && selectedAuction.status !== 'preview') {
      loadBids(selectedAuction.id);
      const interval = setInterval(() => {
        loadBids(selectedAuction.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedAuction]);

  const loadUserBudget = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('remaining_budget, dragon_nft_name, dragon_nft_address, dragon_nft_number, dragon_nft_owner_address, footlegers_token_verified, footledgers')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setFootledgers(Number(data.footledgers ?? 250) || 250);
      setNftName(data.dragon_nft_name || '');
      setNftAddress('');
      setNftNumber('');
      setNftOwnerAddress(data.dragon_nft_owner_address || '');
      setHasFootLegers(data.footlegers_token_verified || false);
      setNftVerified(!!(data.dragon_nft_name && data.dragon_nft_address && data.dragon_nft_number && data.dragon_nft_owner_address && data.footlegers_token_verified));
    }
  };

  const getPlayerTotalPoints = (auction?: Auction | null) => {
    if (!auction) return null;
    const mapped = playerTotals[auction.auction_player_id];
    if (typeof mapped === 'number' && !Number.isNaN(mapped)) {
      return mapped;
    }
    if (typeof auction.total_points === 'number' && !Number.isNaN(auction.total_points)) {
      return auction.total_points;
    }
    return null;
  };

  const formatPoints = (value: number | null) => {
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString();
  };

  const fetchAll = async <T,>(table: string, columns: string): Promise<T[]> => {
    const pageSize = 1000;
    let from = 0;
    let all: T[] = [];
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const chunk = data || [];
      all = all.concat(chunk);
      if (chunk.length < pageSize) break;
      from += pageSize;
    }
    return all;
  };

  const buildFallbackLeftBack = async () => {
    try {
      const pool = await fetchAll<{ id: string; name: string; position: string; club: string; league: string; value: number }>(
        'player_pool',
        'id, name, position, club, league, value'
      );
      const perf = await fetchAll<{ player_name: string; performance_score: number }>(
        'player_performance_data',
        'player_name, performance_score'
      );
      const perfMap = (perf || []).reduce((acc, row) => {
        if (!row.player_name) return acc;
        const key = normalizeName(row.player_name);
        acc[key] = (acc[key] || 0) + (row.performance_score || 0);
        return acc;
      }, {} as Record<string, number>);
      const gamesMap = (perf || []).reduce((acc, row) => {
        if (!row.player_name) return acc;
        const key = normalizeName(row.player_name);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const leftBacks = pool.filter(p => (p.position || '').toLowerCase() === 'left-back');
      if (leftBacks.length === 0) return;

      leftBacks.sort((a, b) => {
        const ta = perfMap[normalizeName(a.name)] || 0;
        const tb = perfMap[normalizeName(b.name)] || 0;
        if (tb !== ta) return tb - ta;
        return a.name.localeCompare(b.name);
      });
      const best = leftBacks[0];
      const totalPoints = perfMap[normalizeName(best.name)] || 0;
      const gamesPlayed = gamesMap[normalizeName(best.name)] || 0;
      const avg = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;

      // próximo lunes às 12:00
      const now = new Date();
      const day = now.getDay(); // 0 domingo
      const daysToMonday = day === 0 ? 1 : 8 - day;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysToMonday);
      nextMonday.setHours(12, 0, 0, 0);

      const fallback: Auction = {
        id: 'preview-left-back',
        auction_player_id: 'preview-left-back',
        start_date: now.toISOString(),
        end_date: nextMonday.toISOString(),
        starting_bid: 7,
        current_bid: 7,
        winner_user_id: null,
        status: 'preview',
        total_points: totalPoints,
        games_played: gamesPlayed,
        week_label: getWeekInfo(now.toISOString()).label,
        week_start: getWeekInfo(now.toISOString()).start,
        auction_players: {
          id: best.id,
          name: best.name,
          position: best.position,
          club: best.club,
          league: best.league,
          value: best.value,
          image_url: null,
          description: `Total Points: ${totalPoints.toFixed(2)}`
        }
      };
      setFallbackAuction(fallback);
    } catch (err) {
      console.error('Error building fallback auction', err);
    }
  };

  const loadAuctions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('auctions')
      .select('*, auction_players(*)')
      .in('status', ['active', 'completed'])
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Error loading auctions:', error);
      setAuctions([]);
      setFallbackAuction(null);
    } else if (data && data.length > 0) {
      const sorted = [...data].sort((a, b) => {
        const endedA = isAuctionEnded(a);
        const endedB = isAuctionEnded(b);
        if (endedA !== endedB) return endedA ? 1 : -1;
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      });
      const auctionsWithWeek = sorted.map((auction) => {
        const info = getWeekInfo(auction.start_date || auction.end_date);
        return {
          ...auction,
          week_label: info.label,
          week_start: info.start,
        };
      });

      setAuctions(auctionsWithWeek);
      const weeksMap = new Map<string, { label: string; start: string }>();
      auctionsWithWeek.forEach((auction) => {
        if (auction.week_start && auction.week_label && !weeksMap.has(auction.week_start)) {
          weeksMap.set(auction.week_start, {
            label: auction.week_label,
            start: auction.week_start,
          });
        }
      });
      const weekList = Array.from(weeksMap.values()).sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
      setAvailableWeeks(weekList);
      if (selectedWeekStart && !weekList.find((week) => week.start === selectedWeekStart)) {
        setSelectedWeekStart('');
      }

      const auctionWinnerMap: Record<string, string> = {};
      const finishedAuctions = auctionsWithWeek.filter((auction) => isAuctionEnded(auction));

      finishedAuctions.forEach((auction) => {
        if (auction.winner_user_id) {
          auctionWinnerMap[auction.id] = auction.winner_user_id;
        }
      });

      if (finishedAuctions.length > 0) {
        const { data: bidsData, error: bidsError } = await supabase
          .from('auction_bids')
          .select('auction_id, user_id, bid_amount')
          .in(
            'auction_id',
            finishedAuctions.map((a) => a.id)
          )
          .order('bid_amount', { ascending: false });

        if (!bidsError && bidsData) {
          bidsData.forEach((bid) => {
            if (!auctionWinnerMap[bid.auction_id]) {
              auctionWinnerMap[bid.auction_id] = bid.user_id;
            }
          });
        }
      }

      const winnerIds = Array.from(new Set(Object.values(auctionWinnerMap)));

      if (winnerIds.length > 0) {
        const [profilesRes, appUsersRes] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id, username')
            .in('id', winnerIds),
          supabase
            .from('app_users')
            .select('id, name, email')
            .in('id', winnerIds)
        ]);

        const nameMap: Record<string, string> = {};
        profilesRes.data?.forEach((profile) => {
          if (profile.username) {
            nameMap[profile.id] = profile.username;
          }
        });
        appUsersRes.data?.forEach((user) => {
          if (!nameMap[user.id]) {
            nameMap[user.id] = user.name || user.email || `User ${user.id.slice(0, 6)}`;
          }
        });
        if (!nameMap['ee0ca527-b03c-459f-92fd-4d4a9d129faa']) {
          nameMap['ee0ca527-b03c-459f-92fd-4d4a9d129faa'] = 'GiniusMind';
        }

        setWinnerNames(nameMap);
        setAuctionWinners(auctionWinnerMap);
      } else {
        setWinnerNames({});
        setAuctionWinners({});
      }

      if (auctionsWithWeek.length > 0) {
        const uniquePlayerIds = Array.from(new Set(auctionsWithWeek.map((auction) => auction.auction_player_id)));
        const { data: totalsData } = await supabase
          .from('auction_player_totals')
          .select('auction_player_id, total_points')
          .in('auction_player_id', uniquePlayerIds);

        const totalsMap: Record<string, number> = {};
        totalsData?.forEach((row) => {
          totalsMap[row.auction_player_id] = Number(row.total_points) || 0;
        });
        setPlayerTotals(totalsMap);
      } else {
        setPlayerTotals({});
      }
      setFallbackAuction(null);
    } else {
      setAuctions([]);
      await buildFallbackLeftBack();
      setPlayerTotals({});
    }
    setLoading(false);
  };

  const loadBids = async (auctionId: string) => {
    // Skip DB fetch for preview auctions
    const preview = selectedAuction && selectedAuction.status === 'preview' && selectedAuction.id === auctionId;
    if (preview) return;

    const { data } = await supabase
      .from('auction_bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('bid_amount', { ascending: false })
      .limit(10);

    setBids(data || []);
  };

  const handleSaveNftInfo = async () => {
    if (!nftName || !nftAddress || !nftNumber || !nftOwnerAddress) {
      setError('Please provide all NFT information fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          dragon_nft_name: nftName,
          dragon_nft_address: nftAddress,
          dragon_nft_number: nftNumber,
          dragon_nft_owner_address: nftOwnerAddress,
          footlegers_token_verified: hasFootLegers,
          nft_verified_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setNftVerified(!!(nftName && nftAddress && nftNumber && nftOwnerAddress && hasFootLegers));
      setSuccess('NFT information saved successfully!');
      setShowNftModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save NFT information');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    setWalletError('');

    try {
      const connection: WalletConnection = await connectWallet();
      setWalletConnected(connection.connected);
      setWalletAddress(connection.address);
      setWalletBalance(parseFloat(connection.balance).toFixed(0));
    } catch (err: any) {
      setWalletError(err.message || 'Failed to connect wallet');
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletBalance('0');
    setWalletError('');
  };

  const handlePlaceBid = async () => {
    if (!selectedAuction) return;

    if (isAuctionEnded(selectedAuction)) {
      setError('This auction has already ended');
      return;
    }

    const amount = Number(bidAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    const minBid = (selectedAuction.current_bid || selectedAuction.starting_bid || 0) + 1;
    if (amount < minBid) {
      setError(`Minimum bid is ${formatValue(minBid)} FL`);
      return;
    }

    // Preview mode: simulate bid without hitting DB
    if (selectedAuction.status === 'preview') {
      const updated = { ...selectedAuction, current_bid: amount };
      setSelectedAuction(updated);
      setBids([
        {
          id: `local-${Date.now()}`,
          user_id: userId,
          bid_amount: amount,
          created_at: new Date().toISOString(),
        },
        ...bids,
      ]);
      setFootledgers((prev) => Math.max(0, prev - amount));
      setSuccess('Bid registered in preview (no blockchain/db write)');
      setBidAmount('');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }

    if (amount > footledgers) {
      setError('Insufficient budget for this bid');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error: bidError } = await supabase
        .from('auction_bids')
        .insert({
          auction_id: selectedAuction.id,
          user_id: userId,
          bid_amount: amount
        });

      if (bidError) throw bidError;

      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          current_bid: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAuction.id);

      if (updateError) throw updateError;

      // Deduct FL from user profile
      await supabase
        .from('user_profiles')
        .update({ footledgers: Math.max(0, footledgers - amount) })
        .eq('id', userId);
      setFootledgers((prev) => Math.max(0, prev - amount));

      setSuccess('Bid placed successfully!');
      setBidAmount('');
      loadAuctions();
      loadBids(selectedAuction.id);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  const formatValue = (value: number) => {
    return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const filteredAuctions = selectedWeekStart
    ? auctions.filter((auction) => auction.week_start === selectedWeekStart)
    : auctions;

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
    return `${minutes}m ${pad(seconds)}s`;
  };

  if (selectedAuction) {
    const player = selectedAuction.auction_players;
    const minBid = (selectedAuction.current_bid || selectedAuction.starting_bid || 0) + 1;
    const auctionEnded = isAuctionEnded(selectedAuction);
    const winnerId = auctionWinners[selectedAuction.id];
    const winnerLabel = winnerId
      ? winnerNames[winnerId] ||
        (winnerId === 'ee0ca527-b03c-459f-92fd-4d4a9d129faa' ? 'GiniusMind' : `User ${winnerId.slice(0, 6)}`)
      : null;

    const selectedPtsT = getPlayerTotalPoints(selectedAuction);

    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-pink-900 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <img
            src="/Player_Auction.png"
            alt="Background"
            className="max-w-3xl w-full h-auto object-contain"
          />
        </div>
        <div className="bg-gradient-to-b from-black via-black/80 to-transparent py-8 px-6 relative z-10 pb-16">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setSelectedAuction(null)}
              className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Auctions
            </button>
            <img
              src="/Player_Auction.png"
              alt="Player Auction"
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-8 border border-purple-400/30">
              {player.image_url && (
                <img
                  src={player.image_url}
                  alt={player.name}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              <h1 className="text-4xl font-bold text-white mb-2">{player.name}</h1>
              {selectedAuction.week_label && (
                <p className="text-purple-300 text-sm mb-1">Semana: {selectedAuction.week_label}</p>
              )}
              <p className="text-purple-200 text-lg mb-4">{player.position}</p>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-purple-500/20 px-4 py-2 rounded-lg">
                  <p className="text-purple-200 text-sm">Club</p>
                  <p className="text-white font-bold">{player.club}</p>
                </div>
                <div className="bg-purple-500/20 px-4 py-2 rounded-lg">
                  <p className="text-purple-200 text-sm">League</p>
                  <p className="text-white font-bold">{player.league}</p>
                </div>
                <div className="bg-purple-500/20 px-4 py-2 rounded-lg">
                  <p className="text-purple-200 text-sm">Value</p>
                  <p className="text-white font-bold">€{formatValue(player.value)}</p>
                </div>
                <div className="bg-purple-500/20 px-4 py-2 rounded-lg">
                  <p className="text-purple-200 text-sm">PtsT</p>
                  <p className="text-white font-bold">{formatPoints(selectedPtsT)}</p>
                </div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4 mb-6">
                <p className="text-purple-200">{player.description}</p>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  <Trophy className="w-4 h-4 inline mr-2" />
                  Winner can use this player once in any "Eleven of the Week" selection
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-black/60 backdrop-blur-md rounded-2xl p-8 border border-purple-400/30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Current Bid</h2>
                  <div className="flex items-center gap-2 text-purple-200">
                    <Clock className="w-5 h-5" />
                    {getTimeRemaining(selectedAuction.end_date)}
                  </div>
                </div>

                <div className="text-center mb-8">
                  <div className="text-5xl font-bold text-purple-400 mb-2">
                    {formatValue(selectedAuction.current_bid || selectedAuction.starting_bid)} FL
                  </div>
                  <p className="text-purple-200">
                    {selectedAuction.current_bid > 0 ? 'Current Highest Bid' : 'Starting Bid'}
                  </p>
                </div>

                <div className="bg-purple-500/10 rounded-lg p-4 mb-4">
                  <p className="text-purple-200 text-sm">Your Budget: {formatValue(footledgers)} FL</p>
                </div>

                <div className="mb-4">
                  <label className="block text-purple-200 text-sm mb-2">Your Bid Amount</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Min: ${formatValue(minBid)} FL`}
                    className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 text-white rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    disabled={auctionEnded}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg text-sm mb-4">
                    {success}
                  </div>
                )}

                {auctionEnded && winnerLabel && (
                  <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg text-sm mb-4">
                    Leilão Terminado • Vencedor: {winnerLabel}
                  </div>
                )}

                <button
                  onClick={handlePlaceBid}
                  disabled={submitting || auctionEnded}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Gavel className="w-5 h-5" />
                  {auctionEnded ? 'Leilão Terminado' : submitting ? 'Placing Bid...' : 'Place Bid'}
                </button>
              </div>

              <div className="bg-black/60 backdrop-blur-md rounded-2xl p-8 border border-purple-400/30">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">Recent Bids</h2>
                </div>

                {bids.length === 0 ? (
                  <p className="text-purple-200 text-center py-8">No bids yet. Be the first!</p>
                ) : (
                  <div className="space-y-2">
                    {bids.map((bid, index) => (
                      <div
                        key={bid.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          index === 0 ? 'bg-purple-500/20 border border-purple-400' : 'bg-purple-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {index === 0 && <TrendingUp className="w-5 h-5 text-purple-400" />}
                          <span className="text-white">
                            {bid.user_id === userId ? 'You' : 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-purple-200 font-bold">
                          {formatValue(bid.bid_amount)} FL
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-pink-900 relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <img
          src="/Player_Auction.png"
          alt="Background"
          className="max-w-3xl w-full h-auto object-contain"
        />
      </div>
      <div className="bg-gradient-to-b from-black via-black/80 to-transparent py-8 px-6 relative z-10 pb-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <img
            src="/Player_Auction.png"
            alt="Player Auction"
            className="w-20 h-20 object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 relative z-10">
        <h1 className="text-5xl font-bold text-white text-center mb-3">{getTranslation('screens.playerAuction', language)}</h1>
        <p className="text-purple-200 text-center mb-6 text-lg">
          Bid on special players to use in your Eleven of the Week
        </p>

        {availableWeeks.length > 0 && (
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-purple-400/30 mb-8">
            <div className="flex flex-col gap-3">
              <span className="text-purple-200 text-sm font-semibold">Filtrar por semana</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedWeekStart('')}
                  className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                    selectedWeekStart === ''
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-transparent text-purple-200 border-purple-500/40 hover:border-purple-500/80'
                  }`}
                >
                  Todas
                </button>
                {availableWeeks.map((week) => (
                  <button
                    key={week.start}
                    onClick={() => setSelectedWeekStart(week.start)}
                    className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                      selectedWeekStart === week.start
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-transparent text-purple-200 border-purple-500/40 hover:border-purple-500/80'
                    }`}
                  >
                    {week.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">NFT Verification Required</h3>
                </div>
                <p className="text-purple-200 text-sm mb-4">
                  To participate in auctions, you need to own a Dragon NFT from{' '}
                  <a
                    href="https://openplaza.io/marketplace"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    OpenPlaza Marketplace
                  </a>
                  {' '}and hold Footledgers tokens.
                </p>

                {nftVerified ? (
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-200">
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold">Verified</span>
                    </div>
                    <p className="text-green-200 text-sm mt-2">
                      {nftName} #{nftNumber}
                    </p>
                    <p className="text-green-200 text-xs mt-1">
                      Owner: {nftOwnerAddress.slice(0, 8)}...{nftOwnerAddress.slice(-6)}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-200 mb-2">
                      <Wallet className="w-5 h-5" />
                      <span className="font-semibold">Not Verified</span>
                    </div>
                    <p className="text-yellow-200 text-sm mb-3">
                      Connect your Dragon NFT to start bidding
                    </p>
                    <button
                      onClick={() => setShowNftModal(true)}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      Verify NFT
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30">
            <div className="flex items-center gap-3 mb-4">
              <img src="/Footladger Coin.png" alt="FootLedgers" className="w-8 h-8" />
              <h2 className="text-2xl font-bold text-white">Footledgers balance</h2>
            </div>
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src="/Footladger Coin.png" alt="FootLedgers Coin" className="w-16 h-16" />
                <p className="text-6xl font-bold text-yellow-400">{walletConnected ? walletBalance : footledgers}</p>
              </div>
              <p className="text-purple-200">Available footledgers</p>
              {walletConnected && walletAddress && (
                <p className="text-xs text-purple-300/60 mt-1 font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              )}
              <p className="text-sm text-purple-300/70 mt-4 mb-6">
                {walletConnected ? 'Wallet balance from MetaMask' : 'Connect wallet to see real balance'}
              </p>
              {walletError && (
                <p className="text-sm text-red-400 mb-4">{walletError}</p>
              )}
              <div className="space-y-3">
                {!walletConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    disabled={connectingWallet}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    {connectingWallet ? 'Connecting...' : 'Connect MetaMask'}
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnectWallet}
                    className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    Disconnect Wallet
                  </button>
                )}
                <button
                  onClick={() => window.open('https://dao1.info/?sponsor=24727', '_blank')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Create DAO1 Account
                </button>
                <button
                  onClick={() => window.open('https://dex.apertum.io/#/swap', '_blank')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 transition-all"
                >
                  Swap for Footledgers
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          </div>
        ) : auctions.length === 0 ? (
          fallbackAuction ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[fallbackAuction].map((auction) => {
                const player = auction.auction_players;
                const avg =
                  auction.total_points && auction.games_played
                    ? auction.games_played > 0
                      ? auction.total_points / auction.games_played
                      : 0
                    : undefined;
                return (
                  <div
                    key={auction.id}
                    onClick={() => setSelectedAuction(auction)}
                    className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400 transition-all"
                  >
                    <h3 className="text-2xl font-bold text-white mb-1">{player.name}</h3>
                    <p className="text-purple-200 mb-2">{player.position} • {player.club}</p>
                    <p className="text-purple-300 text-sm mb-4">{player.league}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-purple-300 text-sm">Best Proposal</p>
                        <p className="text-white font-bold text-xl">
                          {formatValue(auction.starting_bid)} FL
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-300 text-sm">Countdown</p>
                        <p className="text-purple-400 font-bold">{getTimeRemaining(auction.end_date)}</p>
                      </div>
                    </div>
                    <div className="text-purple-200 text-sm mb-4 space-y-1">
                      <div>{player.description}</div>
                      {avg !== undefined && (
                        <div className="text-purple-300">
                          Avg: {avg.toFixed(2)} pts/game
                        </div>
                      )}
                    </div>
                    <button
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                    >
                      Licitar
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-12 border border-purple-400/30 text-center">
              <Trophy className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Active Auctions</h2>
              <p className="text-purple-200">Check back soon for new player auctions!</p>
            </div>
          )
        ) : (
          <>
                {filteredAuctions.length === 0 ? (
              <div className="bg-black/60 backdrop-blur-md rounded-2xl p-12 border border-purple-400/30 text-center">
                <Clock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Sem leilões nesta semana</h2>
                <p className="text-purple-200">Escolhe outra semana para ver os leilões correspondentes.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAuctions.map((auction) => {
                  const player = auction.auction_players;
                  const auctionEnded = isAuctionEnded(auction);
                  const winnerId = auctionWinners[auction.id];
              const winnerLabel =
                auctionEnded && winnerId
                  ? winnerNames[winnerId] ||
                    (winnerId === 'ee0ca527-b03c-459f-92fd-4d4a9d129faa' ? 'GiniusMind' : `User ${winnerId.slice(0, 6)}`)
                  : null;
                  const ptsT = getPlayerTotalPoints(auction);
                  return (
                    <div
                      key={auction.id}
                  onClick={() => {
                    if (!auctionEnded) setSelectedAuction(auction);
                  }}
                  className={`backdrop-blur-md rounded-2xl p-6 border transition-all ${
                    auctionEnded
                      ? 'bg-red-900/60 border-red-500/40 hover:border-red-500 cursor-default hover:scale-100'
                      : 'bg-black/60 border-purple-400/30 hover:border-purple-400 cursor-pointer hover:scale-105'
                  }`}
                >
                  {auction.week_label && (
                    <div className="text-xs uppercase tracking-wide text-purple-200 mb-2">
                      Semana: {auction.week_label}
                    </div>
                  )}
                  {player.image_url && (
                    <img
                      src={player.image_url}
                      alt={player.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-2xl font-bold text-white mb-1">{player.name}</h3>
                  <p className="text-purple-200 mb-4">{player.position} • {player.club}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-purple-300 text-sm">Best Proposal</p>
                      <p className="text-white font-bold text-xl">
                        {formatValue(auction.current_bid || auction.starting_bid)} FL
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-300 text-sm">Time Left</p>
                      <p className={`font-bold ${auctionEnded ? 'text-red-300' : 'text-purple-400'}`}>
                        {auctionEnded ? 'Finished' : getTimeRemaining(auction.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-purple-300 text-sm">PtsT</p>
                      <p className="text-white font-bold text-xl">
                        {formatPoints(ptsT)}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={auctionEnded}
                    className={`w-full py-3 font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                      auctionEnded
                        ? 'bg-red-500/70 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                    }`}
                  >
                    <Gavel className="w-5 h-5" />
                    {auctionEnded ? 'Leilão Terminado' : 'Place Bid'}
                  </button>

                  {winnerLabel && (
                    <p className="text-red-200 text-sm text-center mt-3">
                      Vencedor: {winnerLabel}
                    </p>
                  )}
                </div>
              );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showNftModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-purple-900 to-black rounded-2xl p-8 max-w-2xl w-full border border-purple-400/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">Verify Your Dragon NFT</h2>
              <button
                onClick={() => setShowNftModal(false)}
                className="text-purple-200 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-400/30">
                <p className="text-purple-200 text-sm">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Visit{' '}
                  <a
                    href="https://openplaza.io/marketplace"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline font-semibold"
                  >
                    OpenPlaza Marketplace
                  </a>
                  {' '}to purchase or verify your Dragon NFT from The Dragon collection.
                </p>
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">
                  Dragon NFT Name
                </label>
                <input
                  type="text"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                  placeholder="Enter NFT name (e.g., Dragon #1234)"
                  className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 text-white rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">
                  NFT Number (ID)
                </label>
                <input
                  type="text"
                  value={nftNumber}
                  onChange={(e) => setNftNumber(e.target.value)}
                  placeholder="Enter your NFT # (e.g., #1234)"
                  className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 text-white rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">
                  Dragon NFT Collection Address
                </label>
                <input
                  type="text"
                  value={nftAddress}
                  onChange={(e) => setNftAddress(e.target.value)}
                  placeholder="Enter NFT collection address"
                  className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 text-white rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">
                  Owner Wallet Address
                </label>
                <input
                  type="text"
                  value={nftOwnerAddress}
                  onChange={(e) => setNftOwnerAddress(e.target.value)}
                  placeholder="Enter your wallet address"
                  className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 text-white rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>

              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-400/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasFootLegers}
                    onChange={(e) => setHasFootLegers(e.target.checked)}
                    className="w-5 h-5 rounded border-purple-400 text-purple-500 focus:ring-purple-400"
                  />
                  <div>
                    <p className="text-white font-semibold">I hold Footledgers tokens</p>
                    <p className="text-purple-200 text-sm">
                      Footledgers is the native Web3 token required for bidding in auctions.{' '}
                      <a
                        href="https://dex.apertum.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 underline font-semibold"
                      >
                        Get tokens on Apertum DEX
                      </a>
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <button
                onClick={handleSaveNftInfo}
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                {submitting ? 'Saving...' : 'Save NFT Information'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
