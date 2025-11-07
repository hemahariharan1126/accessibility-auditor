module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { results, url } = req.body;

    if (!results || !url) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Generate HTML report
    const htmlReport = generateHTMLReport(results, url);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="accessibility-report-${Date.now()}.html"`);
    res.status(200).send(htmlReport);
  } catch (error) {
    console.error('Error generating HTML report:', error);
    res.status(500).json({ error: 'Failed to generate HTML report' });
  }
};

function generateHTMLReport(results, url) {
  const { violations, passes, incomplete, timestamp } = results;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Audit Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
        }
        .stat-card .number {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
        }
        .violations .number { color: #e53e3e; }
        .passes .number { color: #38a169; }
        .incomplete .number { color: #dd6b20; }
        .section {
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            margin-top: 0;
            color: #2d3748;
        }
        .issue {
            border-left: 4px solid #e53e3e;
            padding: 20px;
            margin-bottom: 20px;
            background: #fff5f5;
            border-radius: 4px;
        }
        .issue h3 {
            margin: 0 0 10px 0;
            color: #c53030;
        }
        .issue .description {
            color: #4a5568;
            margin: 10px 0;
        }
        .issue .impact {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin: 10px 0;
        }
        .impact.critical { background: #feb2b2; color: #742a2a; }
        .impact.serious { background: #fc8181; color: #742a2a; }
        .impact.moderate { background: #fbd38d; color: #744210; }
        .impact.minor { background: #feebc8; color: #744210; }
        .element {
            background: white;
            border: 1px solid #e2e8f0;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 Accessibility Audit Report</h1>
        <p><strong>URL:</strong> ${url}</p>
        <p><strong>Date:</strong> ${new Date(timestamp).toLocaleString()}</p>
    </div>

    <div class="stats">
        <div class="stat-card violations">
            <h3>Violations</h3>
            <p class="number">${violations.length}</p>
        </div>
        <div class="stat-card passes">
            <h3>Passes</h3>
            <p class="number">${passes.length}</p>
        </div>
        <div class="stat-card incomplete">
            <h3>Incomplete</h3>
            <p class="number">${incomplete.length}</p>
        </div>
    </div>

    ${violations.length > 0 ? `
    <div class="section">
        <h2>❌ Violations (${violations.length})</h2>
        ${violations.map(v => `
        <div class="issue">
            <h3>${v.description}</h3>
            <span class="impact ${v.impact}">${v.impact.toUpperCase()}</span>
            <p class="description">${v.help}</p>
            <p><strong>Affected Elements:</strong> ${v.nodes.length}</p>
            ${v.nodes.slice(0, 3).map(node => `
            <div class="element">${node.html}</div>
            `).join('')}
            ${v.nodes.length > 3 ? `<p>... and ${v.nodes.length - 3} more</p>` : ''}
        </div>
        `).join('')}
    </div>
    ` : '<div class="section"><h2>✅ No violations found!</h2></div>'}

</body>
</html>
  `;
}
