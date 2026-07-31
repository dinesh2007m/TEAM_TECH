import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, Globe, Hash, Link, Monitor, Key, Mail, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';

const TYPE_ICONS = {
  ip: Globe,
  domain: Globe,
  url: Link,
  hash: Hash,
  process: Monitor,
  registry: Key,
  email: Mail,
};

const THREAT_COLORS = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  moderate: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  low: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
};

const STATUS_COLORS = {
  active: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  confirmed: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  predicted: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  resolved: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
};

export const IOCTable = ({ indicators = [] }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortField, setSortField] = useState('threatLevel');
  const [sortDir, setSortDir] = useState('desc');

  const typeOptions = ['all', ...new Set(indicators.map((i) => i.typeShort))];
  const severityOptions = ['all', 'critical', 'high', 'moderate', 'low'];

  const severityOrder = { critical: 4, high: 3, moderate: 2, low: 1 };

  const filtered = useMemo(() => {
    let data = [...indicators];
    if (search) data = data.filter((i) => i.value.toLowerCase().includes(search.toLowerCase()) || i.type.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter !== 'all') data = data.filter((i) => i.typeShort === typeFilter);
    if (severityFilter !== 'all') data = data.filter((i) => i.threatLevel === severityFilter);
    data.sort((a, b) => {
      if (sortField === 'threatLevel') {
        const diff = (severityOrder[b.threatLevel] || 0) - (severityOrder[a.threatLevel] || 0);
        return sortDir === 'asc' ? -diff : diff;
      }
      if (sortField === 'confidence') {
        return sortDir === 'asc' ? a.confidence - b.confidence : b.confidence - a.confidence;
      }
      const av = a[sortField] || '';
      const bv = b[sortField] || '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return data;
  }, [indicators, search, typeFilter, severityFilter, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search indicators..."
            className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500/60 cursor-pointer"
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : t.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500/60 cursor-pointer"
        >
          {severityOptions.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Severity' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <span className="text-xs text-gray-500 flex items-center">{filtered.length} indicator{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800/60">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800/80 bg-gray-900/60">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Indicator</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('threatLevel')}>
                <div className="flex items-center gap-1">Severity <SortIcon field="threatLevel" /></div>
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('confidence')}>
                <div className="flex items-center gap-1">Confidence <SortIcon field="confidence" /></div>
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider hidden lg:table-cell">Source</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((ioc, idx) => {
                const Icon = TYPE_ICONS[ioc.typeShort] || Globe;
                const tc = THREAT_COLORS[ioc.threatLevel] || THREAT_COLORS.low;
                const sc = STATUS_COLORS[ioc.status] || STATUS_COLORS.confirmed;

                return (
                  <motion.tr
                    key={ioc.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors group"
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-mono text-gray-200 truncate" title={ioc.value}>{ioc.value}</div>
                      <div className="text-gray-500 mt-0.5 line-clamp-1 hidden group-hover:block text-[10px]">{ioc.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Icon className="w-3.5 h-3.5 text-blue-500/70 shrink-0" />
                        <span className="whitespace-nowrap">{ioc.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', tc.bg, tc.text, tc.border)}>
                        {ioc.threatLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-gray-800 rounded-full w-16 hidden sm:block">
                          <div
                            className={cn('h-full rounded-full', tc.text.replace('text-', 'bg-').replace('-400', '-500'))}
                            style={{ width: `${ioc.confidence}%`, opacity: 0.7 }}
                          />
                        </div>
                        <span className="text-gray-300 font-mono font-semibold">{ioc.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      <span className="line-clamp-1">{ioc.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize', sc.bg, sc.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot, ioc.status === 'active' && 'animate-pulse')} />
                        {ioc.status}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No indicators match current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
