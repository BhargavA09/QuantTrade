import React from 'react';
import { 
  Building2, 
  Globe, 
  MapPin, 
  Users, 
  Briefcase, 
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CompanyProfileProps {
  profile: any;
  ticker: string;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ profile, ticker }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!profile) return (
    <div className="glass-card p-8 text-center text-zinc-500 italic">
      No company profile data available for {ticker}.
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 bg-zinc-900/40 border-zinc-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Briefcase size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sector</span>
          </div>
          <p className="text-sm font-bold text-zinc-200">{profile.sector}</p>
        </div>

        <div className="glass-card p-4 bg-zinc-900/40 border-zinc-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Building2 size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Industry</span>
          </div>
          <p className="text-sm font-bold text-zinc-200">{profile.industry}</p>
        </div>

        <div className="glass-card p-4 bg-zinc-900/40 border-zinc-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Employees</span>
          </div>
          <p className="text-sm font-bold text-zinc-200">{profile.fullTimeEmployees.toLocaleString()}</p>
        </div>

        <div className="glass-card p-4 bg-zinc-900/40 border-zinc-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Globe size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Website</span>
          </div>
          <a 
            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-bold text-blue-400 hover:underline flex items-center gap-1"
          >
            {profile.website.replace('https://', '').replace('http://', '').split('/')[0]}
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Business Summary */}
      <div className="glass-card p-6 bg-zinc-900/50 border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <FileText size={16} className="text-indigo-400" />
            Business Description
          </h3>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 px-3 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        
        <div className="relative">
          <p className={`text-sm leading-relaxed text-zinc-400 ${isExpanded ? '' : 'line-clamp-6'}`}>
            {profile.summary}
          </p>
          {!isExpanded && profile.summary.length > 400 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-900/90 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Location */}
      <div className="glass-card p-6 bg-zinc-900/40 border-zinc-800/50">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
          <MapPin size={16} className="text-rose-400" />
          Headquarters
        </h3>
        <p className="text-sm font-medium text-zinc-300">
          {profile.address}
        </p>
      </div>
    </div>
  );
};
