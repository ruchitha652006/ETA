import { useState } from 'react';
import { Search, Train, ChevronRight, AlertCircle, MapPin } from 'lucide-react';
import { searchTrains } from '../services/api';
import { MOCK_TRAINS } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

export default function TrainSearch({ backendOnline }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim() || query.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = backendOnline
        ? await searchTrains(query)
        : MOCK_TRAINS.filter(
            t => t.train_no.includes(query) || t.train_name.toLowerCase().includes(query.toLowerCase())
          );
      setResults(data);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Train Search</h1>
        <p className="text-slate-500 text-sm mt-1">Search by train number, name, or route</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search train number or name..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-60"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </div>

      {searched && results.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-600 font-medium">No trains found for "{query}"</p>
          <p className="text-slate-400 text-sm mt-1">Try searching by train number: 12723, 12759, or 17201</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">{results.length} trains found</p>
          </div>
          <div className="divide-y divide-slate-100">
            {results.map(t => (
              <div key={t.train_no} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Train size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{t.train_no} – {t.train_name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <MapPin size={10} />
                    {t.from_station} → {t.to_station}
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium border border-blue-100">
                      {t.train_type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/?train=${t.train_no}`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Track <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
