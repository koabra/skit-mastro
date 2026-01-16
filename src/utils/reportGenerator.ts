import type { Scene, Actor } from '../types';

export const generateReportHtml = (scenes: Scene[], actors: Actor[], projectName: string): string => {
  const allDialogues: {
    sceneTitle: string;
    actorName: string;
    actorColor: string;
    text: string;
    type: 'dialogue' | 'pause' | 'insight';
    hasAudio: boolean;
    audioInfo: string;
    displayId?: number;
  }[] = [];

  let totalDialogues = 0;
  let missingAudioCount = 0;

  // Track stats per actor
  const actorStats: Record<string, { total: number; missing: number; color: string }> = {};

  // Initialize stats for known actors
  actors.forEach(actor => {
    actorStats[actor.name] = { total: 0, missing: 0, color: actor.color };
  });

  // Unique lists for filters
  const uniqueScenes = new Set<string>();
  const uniqueActors = new Set<string>();

  // Flatten and process data
  scenes.forEach(scene => {
    uniqueScenes.add(scene.title);

    scene.items.forEach(item => {
      // Common Item Props
      let itemActorName = 'Unknown';
      let itemActorColor = '#cbd5e1'; // slate-300 default
      let itemText = '';

      if (item.type === 'dialogue') {
        const actor = actors.find(a => a.id === item.actorId) ||
          actors.find(a => a.name === item.character); // Fallback

        itemActorName = actor ? actor.name : (item.character || 'Unknown');
        itemActorColor = actor ? actor.color : '#ccc';
        itemText = item.text || '';
        
        uniqueActors.add(itemActorName);
        
        // Init stats for dialogue actors
        if (!actorStats[itemActorName]) {
          actorStats[itemActorName] = { total: 0, missing: 0, color: itemActorColor };
        }
      } else if (item.type === 'pause') {
        itemActorName = 'Delay';
        itemActorColor = '#94a3b8'; // slate-400
        itemText = `Duration: ${item.duration}s`;
      } else if (item.type === 'insight') {
        itemActorName = 'Insight';
        itemActorColor = '#f59e0b'; // amber-500
        itemText = item.text || '[No text]';
      }

      const hasAudio = !!(item.audioUrl || item.audioBlob);
      const isSpecialType = item.type !== 'dialogue';
      
      allDialogues.push({
        sceneTitle: scene.title,
        actorName: itemActorName,
        actorColor: itemActorColor,
        text: itemText,
        type: item.type,
        hasAudio,
        audioInfo: item.audioMetadata
          ? `${item.audioMetadata.fileName} (${(item.audioMetadata.duration || 0).toFixed(1)}s)`
          : (hasAudio ? 'Audio Attached' : (isSpecialType ? '-' : 'Missing')),
        displayId: item.displayId
      });

      // Stats Logic (Only for Dialogues)
      if (item.type === 'dialogue') {
        totalDialogues++;
        actorStats[itemActorName].total++;
        if (!hasAudio) {
            missingAudioCount++;
            actorStats[itemActorName].missing++;
        }
      }
    });
  });

  const completionPercentage = totalDialogues > 0
    ? Math.round(((totalDialogues - missingAudioCount) / totalDialogues) * 100)
    : 100;

  // Generate HTML
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${projectName} - Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; background: #f8fafc; color: #1e293b; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        h1 { margin-top: 0; color: #0f172a; margin-bottom: 5px; }
        .generated-date { color: #64748b; font-size: 14px; margin-bottom: 30px; }
        
        /* Stats Section */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .stat-value { font-size: 32px; font-weight: 700; color: #334155; line-height: 1; margin-bottom: 5px; }
        .stat-label { font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }

        /* Actor Stats */
        .actor-stats-container { margin-bottom: 30px; }
        .actor-stats-title { font-size: 16px; font-weight: 600; margin-bottom: 15px; color: #334155; }
        .actor-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .actor-stat-card {
           display: flex; align-items: center; justify-content: space-between;
           padding: 12px 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: white;
           box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .actor-info { display: flex; align-items: center; gap: 10px; }
        .actor-dot { width: 10px; height: 10px; border-radius: 50%; }
        .actor-name { font-weight: 500; font-size: 14px; }
        .actor-numbers { text-align: right; font-size: 13px; color: #64748b; }
        .missing-highlight { color: #dc2626; font-weight: 600; }
        
        /* Filters */
        .filters { display: flex; gap: 15px; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; align-items: center; }
        .filter-group { display: flex; align-items: center; gap: 8px; }
        label { font-size: 14px; font-weight: 500; color: #475569; }
        select { padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: white; font-size: 14px; color: #334155; outline: none; min-width: 200px; }
        select:focus { border-color: #3b82f6; ring: 2px solid #3b82f6; }

        /* Table */
        .table-container { overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px 16px; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600; font-size: 13px; text-transform: uppercase; }
        td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        tr:last-child td { border-bottom: none; }
        
        .missing-audio-row { background-color: #fef2f2; }
        .missing-audio-row:hover { background-color: #fee2e2; }
        
        .actor-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; color: white; font-weight: 500; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
        .status-missing { background: #fee2e2; color: #991b1b; }
        .status-ok { background: #dcfce7; color: #166534; }
        
        .scene-text { color: #64748b; font-weight: 500; }
        .dialogue-text { line-height: 1.5; color: #1e293b; max-width: 500px; }
        .file-info { color: #64748b; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; }

        /* Utility */
        .hidden { display: none !important; }
        .text-muted { color: #94a3b8; }
        .text-green-600 { color: #16a34a; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${projectName}</h1>
        <p class="generated-date">Generated on ${new Date().toLocaleString()}</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${totalDialogues}</div>
            <div class="stat-label">Total Dialogues</div>
          </div>
          <div class="stat-card" style="background-color: ${missingAudioCount > 0 ? '#fff1f2' : '#f1f5f9'}; border-color: ${missingAudioCount > 0 ? '#fecdd3' : '#e2e8f0'}">
            <div class="stat-value" style="color: ${missingAudioCount > 0 ? '#e11d48' : '#334155'}">${missingAudioCount}</div>
            <div class="stat-label">Missing Audio</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${completionPercentage}%</div>
            <div class="stat-label">Completion</div>
          </div>
        </div>

        <div class="actor-stats-container">
            <div class="actor-stats-title">Detailed Actor Breakdown</div>
             <div class="actor-stats-grid">
                ${Object.entries(actorStats).map(([name, stats]) => {
                   if (stats.total === 0) return '';
                   const isComplete = stats.missing === 0;
                   return `
                    <div class="actor-stat-card" style="${isComplete ? 'border-color: #86efac; background-color: #f0fdf4;' : ''}">
                        <div class="actor-info">
                            <div class="actor-dot" style="background-color: ${stats.color}"></div>
                            <span class="actor-name">${name}</span>
                        </div>
                        <div class="actor-numbers">
                             <span class="${stats.missing > 0 ? 'missing-highlight' : (isComplete ? 'text-green-600 font-bold' : '')}">
                                ${isComplete ? 'All done!' : `${stats.missing} missing`}
                             </span> / ${stats.total} total
                        </div>
                    </div>
                   `;
                }).join('')}
             </div>
        </div>

        <div class="filters">
            <div class="filter-group">
                <label for="sceneFilter">Filter by Scene:</label>
                <select id="sceneFilter" onchange="applyFilters()">
                    <option value="all">All Scenes</option>
                    ${Array.from(uniqueScenes).map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label for="actorFilter">Filter by Actor:</label>
                <select id="actorFilter" onchange="applyFilters()">
                    <option value="all">All Actors</option>
                     ${Array.from(uniqueActors).map(a => `<option value="${a}">${a}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group" style="margin-left: auto;">
                <label for="statusFilter">Status:</label>
                <select id="statusFilter" onchange="applyFilters()">
                    <option value="all">All Items</option>
                    <option value="missing">Missing Audio</option>
                    <option value="ready">Ready</option>
                </select>
            </div>
        </div>
        
        <div class="table-container">
            <table id="reportTable">
              <thead>
                <tr>
                  <th style="width: 50px;">ID</th>
                  <th>Scene</th>
                  <th>Actor</th>
                  <th>Dialogue</th>
                  <th>Status</th>
                  <th>File Info</th>
                </tr>
              </thead>
              <tbody>
                ${allDialogues.map(d => {
                  const isError = d.type === 'dialogue' && !d.hasAudio;
                  const rowClass = isError ? 'missing-audio-row' : '';
                  // Status Cell Logic
                  let statusHtml = '';
                  if (d.type === 'dialogue') {
                      statusHtml = `<span class="status-badge ${d.hasAudio ? 'status-ok' : 'status-missing'}">${d.hasAudio ? 'Ready' : 'Missing'}</span>`;
                  } else {
                      statusHtml = `<span class="text-muted">–</span>`;
                  }

                  return `
                  <tr 
                    class="${rowClass}"
                    data-scene="${d.sceneTitle}"
                    data-actor="${d.actorName}"
                    data-status="${isError ? 'missing' : 'ready'}"
                  >
                    <td style="color: #64748b; font-family: monospace; font-size: 12px; font-weight: bold;">
                        ${d.displayId ? `#${d.displayId}` : ''}
                    </td>
                    <td class="scene-text">${d.sceneTitle}</td>
                    <td>
                      <span class="actor-badge" style="background-color: ${d.actorColor}">
                        ${d.actorName}
                      </span>
                    </td>
                    <td class="dialogue-text">${d.text}</td>
                    <td>${statusHtml}</td>
                    <td class="file-info">${d.audioInfo}</td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
        </div>
      </div>

      <script>
        function applyFilters() {
            const sceneVal = document.getElementById('sceneFilter').value;
            const actorVal = document.getElementById('actorFilter').value;
            const statusVal = document.getElementById('statusFilter').value;
            
            const rows = document.querySelectorAll('#reportTable tbody tr');
            
            rows.forEach(row => {
                const rowScene = row.getAttribute('data-scene');
                const rowActor = row.getAttribute('data-actor');
                const rowStatus = row.getAttribute('data-status');
                
                let show = true;
                
                if (sceneVal !== 'all' && rowScene !== sceneVal) show = false;
                if (actorVal !== 'all' && rowActor !== actorVal) show = false;
                if (statusVal !== 'all' && rowStatus !== statusVal) show = false;
                
                if (show) {
                    row.classList.remove('hidden');
                } else {
                    row.classList.add('hidden');
                }
            });
        }
      </script>
    </body>
    </html>
  `;
};
