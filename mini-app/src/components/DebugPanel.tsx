import { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  type: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export default function DebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all');

  useEffect(() => {
    // Capture console.log calls
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type: 'debug' | 'info' | 'warn' | 'error', ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        type,
        message,
        data: args.find(arg => typeof arg === 'object')
      }].slice(-100)); // Keep only last 100 logs
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('debug', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', ...args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'error') return log.type === 'error';
    if (filter === 'warn') return log.type === 'warn' || log.type === 'error';
    return true;
  });

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-900/20';
      case 'warn': return 'text-yellow-400 bg-yellow-900/20';
      case 'info': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-300 bg-gray-800/50';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm hover:bg-gray-700 transition-colors z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-white text-lg font-bold">Debug Logs</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">All</option>
            <option value="warn">Warnings & Errors</option>
            <option value="error">Errors Only</option>
          </select>
          <button
            onClick={() => setLogs([])}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No logs yet</div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`p-3 rounded font-mono text-xs ${getLogColor(log.type)}`}
            >
              <div className="opacity-50 mb-1">{log.timestamp}</div>
              <div className="whitespace-pre-wrap break-words">{log.message}</div>
              {log.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer opacity-75 hover:opacity-100">
                    View data
                  </summary>
                  <pre className="mt-2 overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
