import { useState, useEffect } from 'react';
import { ChevronLeft, Users, Mail, Trophy, Shield, AlertCircle, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { connectWallet, type WalletConnection } from '../lib/web3';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslation } from '../lib/translations';

interface MyLeagueProps {
  userId: string;
  onBack: () => void;
}

interface League {
  id: string;
  name: string;
  owner_id: string;
  entry_fee: number;
  max_members: number;
  created_at: string;
  member_count: number;
}

interface Invitation {
  id: string;
  league_id: string;
  league_name: string;
  invited_by_email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

function MyLeague({ userId, onBack }: MyLeagueProps) {
  const { language } = useLanguage();
  const [nftVerified, setNftVerified] = useState(false);
  const [footledgers, setFootledgers] = useState(0);
  const [dragonNftAddress, setDragonNftAddress] = useState('');
  const [dragonNftNumber, setDragonNftNumber] = useState('');
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState('');

  useEffect(() => {
    loadUserData();
    loadMyLeagues();
    loadInvitations();
  }, [userId]);

  const loadUserData = async () => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nft_verified, footledgers, dragon_nft_address, dragon_nft_number')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      // Temporarily free leagues from NFT/footledger requirements
      setNftVerified(true);
      setFootledgers(profile.footledgers || 0);
      setDragonNftAddress('');
      setDragonNftNumber('');
    }
  };

  const loadMyLeagues = async () => {
    const { data: leagues } = await supabase
      .from('leagues')
      .select(`
        id,
        name,
        owner_id,
        entry_fee,
        max_members,
        created_at
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (leagues) {
      const leaguesWithCount = await Promise.all(
        leagues.map(async (league) => {
          const { count } = await supabase
            .from('league_members')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', league.id);

          return {
            ...league,
            member_count: count || 0
          };
        })
      );
      setMyLeagues(leaguesWithCount);
    }
  };

  const loadInvitations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: invites } = await supabase
      .from('league_invitations')
      .select(`
        id,
        league_id,
        leagues(name),
        invited_by,
        status,
        created_at,
        expires_at
      `)
      .eq('invited_user_email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invites) {
      const formatted = invites.map((inv: any) => ({
        id: inv.id,
        league_id: inv.league_id,
        league_name: inv.leagues?.name || 'Unknown League',
        invited_by_email: inv.invited_by || 'Unknown',
        status: inv.status,
        created_at: inv.created_at,
        expires_at: inv.expires_at
      }));
      setInvitations(formatted);
    }
  };

  const handleVerifyNFT = async () => {
    if (!dragonNftAddress.trim() || !dragonNftNumber.trim()) {
      setMessage('Please enter both NFT address and number');
      return;
    }

    setIsVerifying(true);
    setMessage('Verifying NFT...');

    await new Promise(resolve => setTimeout(resolve, 1500));

    const { error } = await supabase
      .from('user_profiles')
      .update({
        dragon_nft_address: dragonNftAddress.trim(),
        dragon_nft_number: dragonNftNumber.trim(),
        nft_verified: true,
        nft_verified_at: new Date().toISOString()
      })
      .eq('id', userId);

    setIsVerifying(false);

    if (error) {
      setMessage('Error verifying NFT: ' + error.message);
    } else {
      setMessage('NFT verified successfully!');
      setNftVerified(true);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      setMessage('Please enter a league name');
      return;
    }

    const { error } = await supabase
      .from('leagues')
      .insert({
        name: leagueName.trim(),
        owner_id: userId,
        owner_nft_verified: true,
        entry_fee: 0,
        max_members: 20
      });

    if (error) {
      setMessage('Error creating league: ' + error.message);
    } else {
      setMessage('League created successfully!');
      setLeagueName('');
      setShowCreateLeague(false);
      loadMyLeagues();
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      setMessage('Please enter an email address');
      return;
    }

    if (!selectedLeagueId) {
      setMessage('No league selected');
      return;
    }

    const { error } = await supabase
      .from('league_invitations')
      .insert({
        league_id: selectedLeagueId,
        invited_by: userId,
        invited_user_email: inviteEmail.trim(),
        status: 'pending'
      });

    if (error) {
      setMessage('Error sending invitation: ' + error.message);
    } else {
      setMessage('Invitation sent!');
      setInviteEmail('');
      setShowInviteModal(false);
      setSelectedLeagueId(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAcceptInvitation = async (invitationId: string, leagueId: string) => {
    const { error: updateError } = await supabase
      .from('league_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    if (updateError) {
      setMessage('Error accepting invitation: ' + updateError.message);
      return;
    }

    const { error: memberError } = await supabase
      .from('league_members')
      .insert({
        league_id: leagueId,
        user_id: userId,
        payment_verified: true
      });

    if (memberError) {
      setMessage('Error joining league: ' + memberError.message);
      return;
    }

    setMessage('Successfully joined league!');
    loadInvitations();
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRejectInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('league_invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId);

    if (error) {
      setMessage('Error rejecting invitation: ' + error.message);
    } else {
      setMessage('Invitation rejected');
      loadInvitations();
      setTimeout(() => setMessage(''), 3000);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-teal-700 to-cyan-600 relative">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
        style={{ backgroundImage: "url('/My_League.png')" }}
      />

      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 opacity-10">
        <img
          src="/ChatGPT Image 4_10_2025, 11_26_23.png"
          alt="Watermark"
          className="w-96 h-96"
        />
      </div>

      <div className="bg-gradient-to-b from-black to-transparent py-6 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded-lg transition-all hover:scale-110"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <img
            src="/My_League.png"
            alt="My League"
            className="w-12 h-12"
          />
          <div className="w-12"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        <h1 className="text-5xl font-bold text-white text-center mb-3">{getTranslation('screens.myLeague', language)}</h1>
        <p className="text-cyan-200 text-center mb-8 text-lg">Create private leagues and invite friends</p>

        {message && (
          <div className="bg-cyan-500/20 border border-cyan-500/50 text-white px-6 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-md border-2 border-cyan-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">NFT Verification</h2>
            </div>

            {nftVerified ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">Verified</span>
                </div>
                <p className="text-cyan-200 text-sm">Address: {dragonNftAddress}</p>
                <p className="text-cyan-200 text-sm">Dragon #{dragonNftNumber}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="NFT Contract Address"
                  value={dragonNftAddress}
                  onChange={(e) => setDragonNftAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-cyan-300/50"
                />
                <input
                  type="text"
                  placeholder="Dragon Number"
                  value={dragonNftNumber}
                  onChange={(e) => setDragonNftNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-cyan-300/50"
                />
                <button
                  onClick={handleVerifyNFT}
                  disabled={isVerifying}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isVerifying ? 'Verifying...' : 'Verify NFT'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-black/40 backdrop-blur-md border-2 border-cyan-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <img src="/Footladger Coin.png" alt="FootLedgers" className="w-8 h-8" />
              <h2 className="text-2xl font-bold text-white">Footledgers balance</h2>
            </div>
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src="/Footladger Coin.png" alt="FootLedgers Coin" className="w-16 h-16" />
                <p className="text-6xl font-bold text-yellow-400">{walletConnected ? walletBalance : footledgers}</p>
              </div>
              <p className="text-cyan-200">Available footledgers</p>
              {walletConnected && walletAddress && (
                <p className="text-xs text-cyan-300/60 mt-1 font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              )}
              <p className="text-sm text-cyan-300/70 mt-4 mb-6">
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
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-black/40 backdrop-blur-md border-2 border-cyan-500/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold text-white">My Leagues</h2>
              </div>
              <button
                onClick={() => setShowCreateLeague(!showCreateLeague)}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-all"
              >
                Create League
              </button>
            </div>

            {showCreateLeague && (
              <div className="mb-4 space-y-3 p-4 bg-black/30 rounded-lg border border-cyan-500/30">
                <input
                  type="text"
                  placeholder="League Name"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-cyan-300/50"
                />
                <button
                  onClick={handleCreateLeague}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all"
                >
                  Create League
                </button>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {myLeagues.length === 0 ? (
                <p className="text-cyan-300/70 text-center py-8">No leagues created yet</p>
              ) : (
                myLeagues.map((league) => (
                  <div
                    key={league.id}
                    className="bg-black/30 border border-cyan-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold text-lg">{league.name}</h3>
                      <button
                        onClick={() => {
                          setSelectedLeagueId(league.id);
                          setShowInviteModal(true);
                        }}
                        className="p-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-all"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-cyan-200 text-sm">
                      Members: {league.member_count}/{league.max_members}
                    </p>
                    <p className="text-cyan-200 text-sm">
                      Entry Fee: {league.entry_fee} footledgers
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md border-2 border-cyan-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Send invitation</h2>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-cyan-300/50"
              />
              <button
                onClick={() => {
                  if (myLeagues.length > 0 && inviteEmail.trim()) {
                    setSelectedLeagueId(myLeagues[0].id);
                    setShowInviteModal(true);
                  } else if (!inviteEmail.trim()) {
                    setMessage('Please enter an email address first');
                    setTimeout(() => setMessage(''), 3000);
                  } else {
                    setMessage('Create a league first to send invitations');
                    setTimeout(() => setMessage(''), 3000);
                  }
                }}
                disabled={!inviteEmail.trim() || myLeagues.length === 0}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Send invitation
              </button>
              <p className="text-cyan-200 text-sm">
                Select a league from "My Leagues" to send an invitation. The invitee will need 100 footledgers to accept.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md border-2 border-cyan-500/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Received invitations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.length === 0 ? (
              <p className="text-cyan-300/70 text-center py-8 col-span-full">No pending invitations</p>
            ) : (
              invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-black/30 border border-cyan-500/30 rounded-lg p-4"
                >
                  <h3 className="text-white font-bold text-lg mb-2">{invitation.league_name}</h3>
                  <p className="text-cyan-200 text-sm mb-1">Cost: 100 footledgers</p>
                  <p className="text-cyan-300/70 text-xs mb-3">
                    Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvitation(invitation.id, invitation.league_id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectInvitation(invitation.id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-lg hover:from-red-400 hover:to-rose-400 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-cyan-500/50 rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Send invitation</h2>
            <input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-cyan-300/50 mb-4"
            />
            <p className="text-cyan-200 text-sm mb-4">
              The invitee will need 100 footledgers to accept this invitation
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSendInvite}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-teal-400 transition-all"
              >
                Send
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedLeagueId(null);
                  setInviteEmail('');
                }}
                className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyLeague;
