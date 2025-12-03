import { useState } from 'react';
import { Upload, RefreshCw, Database, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SyncResult {
  player: string;
  status: 'success' | 'error' | 'no_data';
  message?: string;
  recordsUploaded?: number;
  weeksProcessed?: number;
  pointsAdded?: number;
}

interface SyncResponse {
  message: string;
  results: SyncResult[];
  totalProcessed: number;
  successful: number;
  errors?: number;
  errorCount?: number;
  databaseUpdates?: {
    updated: number;
    errors: number;
  };
}

export default function DataSyncPanel() {
  const [playerFiles, setPlayerFiles] = useState<FileList | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResponse | null>(null);
  const [syncType, setSyncType] = useState<'player' | 'performance' | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerFiles(e.target.files);
    setSyncResults(null);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const extractPlayerNameFromFilename = (filename: string): string => {
    const match = filename.match(/\d{4}-\d{4}_(.+)\.csv$/);
    return match ? match[1] : filename.replace('.csv', '');
  };

  const handleSyncPlayerData = async () => {
    if (!playerFiles || playerFiles.length === 0) {
      alert('Please select CSV files first');
      return;
    }

    setSyncing(true);
    setSyncType('player');
    setSyncResults(null);

    try {
      const csvData = [];

      for (let i = 0; i < playerFiles.length; i++) {
        const file = playerFiles[i];
        const content = await readFileAsText(file);
        const playerName = extractPlayerNameFromFilename(file.name);
        csvData.push({ playerName, content });
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-player-data`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync player data');
      }

      setSyncResults(data);
    } catch (error: any) {
      console.error('Error syncing player data:', error);
      alert('Error syncing player data: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncPerformanceData = async () => {
    if (!playerFiles || playerFiles.length === 0) {
      alert('Please select CSV files first');
      return;
    }

    setSyncing(true);
    setSyncType('performance');
    setSyncResults(null);

    try {
      const csvData = [];

      for (let i = 0; i < playerFiles.length; i++) {
        const file = playerFiles[i];
        const content = await readFileAsText(file);
        const playerName = extractPlayerNameFromFilename(file.name);
        csvData.push({ playerName, content });
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-performance-data`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync performance data');
      }

      setSyncResults(data);
    } catch (error: any) {
      console.error('Error syncing performance data:', error);
      alert('Error syncing performance data: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'no_data':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Data Sync Panel</h2>
          <p className="text-cyan-200">Upload CSV files to sync player data and performance</p>
        </div>
      </div>

      <div className="bg-blue-800/50 rounded-xl border border-cyan-500/30 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 p-3 rounded-xl">
            <Upload className="w-6 h-6 text-blue-900" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Upload Player CSV Files</h3>
            <p className="text-cyan-200 text-sm mb-4">
              Select CSV files from your computer. Files should be named like: 2025-2026_PlayerName.csv
            </p>
            <input
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-cyan-200
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-cyan-500 file:text-blue-900
                hover:file:bg-cyan-400
                file:cursor-pointer cursor-pointer"
            />
            {playerFiles && (
              <p className="text-cyan-300 text-sm mt-2">
                {playerFiles.length} file(s) selected
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={handleSyncPlayerData}
            disabled={!playerFiles || syncing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${syncing && syncType === 'player' ? 'animate-spin' : ''}`} />
            {syncing && syncType === 'player' ? 'Syncing...' : 'Sync Player Data'}
          </button>

          <button
            onClick={handleSyncPerformanceData}
            disabled={!playerFiles || syncing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-blue-900 font-bold rounded-lg hover:bg-green-400 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${syncing && syncType === 'performance' ? 'animate-spin' : ''}`} />
            {syncing && syncType === 'performance' ? 'Syncing...' : 'Sync Performance & Points'}
          </button>
        </div>
      </div>

      {syncResults && (
        <div className="bg-blue-800/50 rounded-xl border border-cyan-500/30 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Sync Results</h3>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-900/50 rounded-lg p-4">
              <p className="text-cyan-300 text-sm mb-1">Total Processed</p>
              <p className="text-2xl font-bold text-white">{syncResults.totalProcessed}</p>
            </div>
            <div className="bg-green-900/30 rounded-lg p-4">
              <p className="text-green-300 text-sm mb-1">Successful</p>
              <p className="text-2xl font-bold text-green-400">{syncResults.successful}</p>
            </div>
            <div className="bg-red-900/30 rounded-lg p-4">
              <p className="text-red-300 text-sm mb-1">Errors</p>
              <p className="text-2xl font-bold text-red-400">
                {syncResults.errors || syncResults.errorCount || 0}
              </p>
            </div>
          </div>

          {syncResults.databaseUpdates && (
            <div className="bg-blue-900/50 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-bold text-white mb-2">Database Updates</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-cyan-300 text-sm">Records Updated</p>
                  <p className="text-xl font-bold text-white">{syncResults.databaseUpdates.updated}</p>
                </div>
                <div>
                  <p className="text-red-300 text-sm">Update Errors</p>
                  <p className="text-xl font-bold text-red-400">{syncResults.databaseUpdates.errors}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {syncResults.results.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-900/30 rounded-lg"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{result.player}</p>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {result.status === 'success' && (
                      <>
                        {result.recordsUploaded !== undefined && (
                          <span className="text-green-300 text-sm">
                            {result.recordsUploaded} records uploaded
                          </span>
                        )}
                        {result.weeksProcessed !== undefined && (
                          <span className="text-cyan-300 text-sm">
                            {result.weeksProcessed} weeks processed
                          </span>
                        )}
                        {result.pointsAdded !== undefined && (
                          <span className="text-yellow-300 text-sm">
                            {result.pointsAdded} points added
                          </span>
                        )}
                      </>
                    )}
                    {result.message && (
                      <span className={`text-sm ${
                        result.status === 'error' ? 'text-red-300' : 'text-yellow-300'
                      }`}>
                        {result.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-800/30 border border-cyan-500/20 rounded-lg p-4">
        <p className="text-cyan-200 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>How it works:</strong>
            <br />
            1. <strong>Sync Player Data</strong> - Uploads raw performance scores from CSV files to the database
            <br />
            2. <strong>Sync Performance & Points</strong> - Calculates and updates user points based on weekly selections
          </span>
        </p>
      </div>
    </div>
  );
}
