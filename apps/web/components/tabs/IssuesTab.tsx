'use client';

import { useState, useMemo } from 'react';

interface IssuesTabProps {
  issues: any[];
}

export default function IssuesTab({ issues }: IssuesTabProps) {
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories and severities
  const categories = useMemo(() => {
    return Array.from(new Set(issues.map(issue => issue.category))).sort();
  }, [issues]);

  const severities = ['critical', 'high', 'medium', 'low'];

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Severity filter
      if (severityFilter.length > 0 && !severityFilter.includes(issue.severity)) {
        return false;
      }
      
      // Category filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(issue.category)) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          issue.message.toLowerCase().includes(query) ||
          issue.category.toLowerCase().includes(query) ||
          (issue.suggested_fix && issue.suggested_fix.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [issues, severityFilter, categoryFilter, searchQuery]);

  const toggleSeverity = (severity: string) => {
    setSeverityFilter(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  const toggleCategory = (category: string) => {
    setCategoryFilter(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/30 border-red-500';
      case 'high': return 'bg-orange-50 dark:bg-orange-900/30 border-orange-500';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500';
      case 'low': return 'bg-blue-50 dark:bg-blue-900/30 border-blue-500';
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-500';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  // Count by severity
  const severityCounts = useMemo(() => {
    return severities.reduce((acc, sev) => {
      acc[sev] = issues.filter(i => i.severity === sev).length;
      return acc;
    }, {} as Record<string, number>);
  }, [issues]);

  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {severities.map(severity => (
          <div key={severity} className={`${getSeverityColor(severity)} border-l-4 rounded-lg p-4`}>
            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{severity}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{severityCounts[severity]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Filters</h3>
        
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Severity Filter */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Severity</div>
          <div className="flex flex-wrap gap-2">
            {severities.map(severity => (
              <button
                key={severity}
                onClick={() => toggleSeverity(severity)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  severityFilter.includes(severity)
                    ? getSeverityBadgeColor(severity)
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {severity} ({severityCounts[severity]})
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter.includes(category)
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category} ({issues.filter(i => i.category === category).length})
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {(severityFilter.length > 0 || categoryFilter.length > 0 || searchQuery) && (
          <button
            onClick={() => {
              setSeverityFilter([]);
              setCategoryFilter([]);
              setSearchQuery('');
            }}
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Issues List */}
      {filteredIssues.length > 0 ? (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Issues Found ({filteredIssues.length} of {issues.length})
          </h3>
          <div className="space-y-4">
            {filteredIssues.map((issue: any, idx: number) => (
              <div key={idx} className={`border-l-4 p-4 rounded ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 flex-1">{issue.message}</div>
                  <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full uppercase ${getSeverityBadgeColor(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Impact: <span className="font-medium">{issue.impact}</span> · 
                  Category: <span className="font-medium">{issue.category}</span>
                  {issue.rule_id && <span> · Rule: <span className="font-mono text-xs">{issue.rule_id}</span></span>}
                </div>
                {issue.suggested_fix && (
                  <div className="text-sm text-green-700 dark:text-green-400 mt-2 bg-white dark:bg-gray-800 p-3 rounded">
                    <strong>💡 Fix:</strong> {issue.suggested_fix}
                  </div>
                )}
                {issue.element && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {issue.element}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {issues.length === 0 ? 'No issues found' : 'No issues match your filters'}
        </div>
      )}
    </div>
  );
}
