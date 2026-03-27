// npm Dependency Explorer — showcases SVGNet with a real-world use case
// No imports needed — the library is loaded via script tag as window.SVGNet

let graph;
let vulnMode = false;
const ROOT_ID = 'my-app';

// --- Curated Dataset ---

const VULN_DATA = {
    qs: { severity: 'critical', advisory: 'Prototype pollution in qs before 6.10.3' },
    debug: { severity: 'warning', advisory: 'Regular expression DoS in debug <3.1.0' },
    minimist: { severity: 'critical', advisory: 'Prototype pollution in minimist <1.2.6' }
};

function buildDataset() {
    const nodes = [
        // Root
        { id: 'my-app', name: 'my-app', type: 'root', shape: 'circle', size: 55 },

        // Direct dependencies
        { id: 'express', name: 'express', type: 'direct', shape: 'rectangle', size: 40 },
        { id: 'lodash', name: 'lodash', type: 'direct', shape: 'rectangle', size: 35 },
        { id: 'axios', name: 'axios', type: 'direct', shape: 'rectangle', size: 35 },
        { id: 'mongoose', name: 'mongoose', type: 'direct', shape: 'rectangle', size: 38 },
        { id: 'dotenv', name: 'dotenv', type: 'direct', shape: 'rectangle', size: 25 },
        { id: 'cors', name: 'cors', type: 'direct', shape: 'rectangle', size: 25 },
        { id: 'jsonwebtoken', name: 'jsonwebtoken', type: 'direct', shape: 'rectangle', size: 32 },
        { id: 'bcrypt', name: 'bcrypt', type: 'direct', shape: 'rectangle', size: 28 },

        // Dev dependencies
        { id: 'jest', name: 'jest', type: 'dev', shape: 'triangle', size: 30 },
        { id: 'eslint', name: 'eslint', type: 'dev', shape: 'triangle', size: 28 },
        { id: 'prettier', name: 'prettier', type: 'dev', shape: 'triangle', size: 25 },
        { id: 'nodemon', name: 'nodemon', type: 'dev', shape: 'triangle', size: 25 },
        { id: 'supertest', name: 'supertest', type: 'dev', shape: 'triangle', size: 25 },

        // Transitive — express tree
        { id: 'body-parser', name: 'body-parser', type: 'transitive', shape: 'circle', size: 22 },
        {
            id: 'cookie-parser',
            name: 'cookie-parser',
            type: 'transitive',
            shape: 'circle',
            size: 18
        },
        { id: 'qs', name: 'qs', type: 'transitive', shape: 'circle', size: 20 },
        { id: 'debug', name: 'debug', type: 'transitive', shape: 'circle', size: 20 },
        { id: 'mime', name: 'mime', type: 'transitive', shape: 'circle', size: 16 },
        { id: 'send', name: 'send', type: 'transitive', shape: 'circle', size: 18 },
        { id: 'serve-static', name: 'serve-static', type: 'transitive', shape: 'circle', size: 18 },
        { id: 'accepts', name: 'accepts', type: 'transitive', shape: 'circle', size: 16 },
        { id: 'content-type', name: 'content-type', type: 'transitive', shape: 'circle', size: 14 },
        { id: 'on-finished', name: 'on-finished', type: 'transitive', shape: 'circle', size: 14 },

        // Transitive — axios tree
        {
            id: 'follow-redirects',
            name: 'follow-redirects',
            type: 'transitive',
            shape: 'circle',
            size: 18
        },
        { id: 'form-data', name: 'form-data', type: 'transitive', shape: 'circle', size: 16 },

        // Transitive — mongoose tree
        { id: 'bson', name: 'bson', type: 'transitive', shape: 'circle', size: 18 },
        { id: 'mongodb', name: 'mongodb', type: 'transitive', shape: 'circle', size: 22 },
        { id: 'kareem', name: 'kareem', type: 'transitive', shape: 'circle', size: 16 },
        { id: 'mpath', name: 'mpath', type: 'transitive', shape: 'circle', size: 14 },

        // Transitive — jsonwebtoken tree
        { id: 'jws', name: 'jws', type: 'transitive', shape: 'circle', size: 16 },
        { id: 'jwa', name: 'jwa', type: 'transitive', shape: 'circle', size: 14 },

        // Transitive — jest tree
        { id: 'jest-cli', name: 'jest-cli', type: 'transitive', shape: 'circle', size: 18 },
        { id: 'babel-jest', name: 'babel-jest', type: 'transitive', shape: 'circle', size: 16 },

        // Transitive — shared/deep
        { id: 'ms', name: 'ms', type: 'transitive', shape: 'circle', size: 14 },
        { id: 'minimist', name: 'minimist', type: 'transitive', shape: 'circle', size: 16 },
        { id: 'safe-buffer', name: 'safe-buffer', type: 'transitive', shape: 'circle', size: 14 },
        { id: 'inherits', name: 'inherits', type: 'transitive', shape: 'circle', size: 12 }
    ];

    const links = [
        // Root → direct
        { source: 'my-app', target: 'express' },
        { source: 'my-app', target: 'lodash' },
        { source: 'my-app', target: 'axios' },
        { source: 'my-app', target: 'mongoose' },
        { source: 'my-app', target: 'dotenv' },
        { source: 'my-app', target: 'cors' },
        { source: 'my-app', target: 'jsonwebtoken' },
        { source: 'my-app', target: 'bcrypt' },

        // Root → dev
        { source: 'my-app', target: 'jest' },
        { source: 'my-app', target: 'eslint' },
        { source: 'my-app', target: 'prettier' },
        { source: 'my-app', target: 'nodemon' },
        { source: 'my-app', target: 'supertest' },

        // express → transitive
        { source: 'express', target: 'body-parser' },
        { source: 'express', target: 'cookie-parser' },
        { source: 'express', target: 'debug' },
        { source: 'express', target: 'send' },
        { source: 'express', target: 'serve-static' },
        { source: 'express', target: 'accepts' },
        { source: 'express', target: 'content-type' },
        { source: 'express', target: 'on-finished' },
        { source: 'express', target: 'qs' },

        // body-parser → qs (vulnerability chain)
        { source: 'body-parser', target: 'qs' },
        { source: 'body-parser', target: 'content-type' },
        { source: 'body-parser', target: 'on-finished' },

        // send → mime
        { source: 'send', target: 'mime' },
        { source: 'send', target: 'debug' },
        { source: 'send', target: 'ms' },
        { source: 'send', target: 'on-finished' },

        // serve-static → send
        { source: 'serve-static', target: 'send' },

        // debug → ms
        { source: 'debug', target: 'ms' },

        // axios → transitive
        { source: 'axios', target: 'follow-redirects' },
        { source: 'axios', target: 'form-data' },

        // mongoose → transitive
        { source: 'mongoose', target: 'mongodb' },
        { source: 'mongoose', target: 'kareem' },
        { source: 'mongoose', target: 'mpath' },
        { source: 'mongodb', target: 'bson' },
        { source: 'mongodb', target: 'safe-buffer' },

        // jsonwebtoken → transitive
        { source: 'jsonwebtoken', target: 'jws' },
        { source: 'jws', target: 'jwa' },
        { source: 'jws', target: 'safe-buffer' },

        // bcrypt → transitive
        { source: 'bcrypt', target: 'inherits' },

        // jest → transitive
        { source: 'jest', target: 'jest-cli' },
        { source: 'jest-cli', target: 'babel-jest' },

        // eslint/nodemon → minimist (vulnerability chain)
        { source: 'eslint', target: 'minimist' },
        { source: 'nodemon', target: 'minimist' },

        // cors → inherits
        { source: 'cors', target: 'inherits' },

        // form-data → safe-buffer
        { source: 'form-data', target: 'safe-buffer' }
    ];

    return { nodes, links };
}

// --- Initialization ---

function initializeWhenReady() {
    if (typeof SVGNet !== 'undefined') {
        initializeGraph();
    } else {
        setTimeout(initializeWhenReady, 100);
    }
}

async function initializeGraph() {
    // HMR cleanup
    if (window.graph) {
        try {
            await window.graph.clearData({ animate: true, duration: 300 });
            window.graph.destroy();
        } catch (e) {
            console.log('Previous graph cleanup skipped:', e.message);
        }
    }

    const dataset = buildDataset();

    graph = new SVGNet('graph-container', {
        data: dataset,
        config: {
            title: '',
            theme: 'dark',
            showControls: true,
            showLegend: false,
            showBreadcrumbs: true,
            defaultDirected: true,
            filterDepth: 2,
            repulsionStrength: 8000,
            attractionStrength: 0.0008,
            damping: 0.92,
            groupingStrength: 0.002
        }
    });
    window.graph = graph;

    // Custom type colors
    graph.setNodeTypeStyle('root', { fill: '#8b5cf6', stroke: '#7c3aed', strokeWidth: 3 });
    graph.setNodeTypeStyle('direct', { fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2 });
    graph.setNodeTypeStyle('dev', { fill: '#f59e0b', stroke: '#d97706', strokeWidth: 2 });
    graph.setNodeTypeStyle('transitive', { fill: '#6b7280', stroke: '#4b5563', strokeWidth: 1 });

    // Update stats
    const counts = { root: 0, direct: 0, dev: 0, transitive: 0 };
    dataset.nodes.forEach(n => counts[n.type]++);
    document.getElementById('stat-total').textContent = dataset.nodes.length;
    document.getElementById('stat-direct').textContent = counts.direct;
    document.getElementById('stat-dev').textContent = counts.dev;
    document.getElementById('stat-transitive').textContent = counts.transitive;

    // Setup interactions
    setupClickDetection();
    setupInstructions();
}

// --- Click Detection ---
// The library emits nodeMouseDown, not nodeClick.
// We track mousedown/mouseup to distinguish click from drag.

let mouseDownState = null;
let clickTimeout = null;

function setupClickDetection() {
    graph.on('nodeMouseDown', function (event) {
        mouseDownState = {
            nodeId: event.node.id,
            nodeType: event.node.type,
            x: event.position.x,
            y: event.position.y,
            time: Date.now()
        };
    });

    document.addEventListener('mouseup', function (e) {
        if (!mouseDownState) return;

        const dx = e.clientX - mouseDownState.x;
        const dy = e.clientY - mouseDownState.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const elapsed = Date.now() - mouseDownState.time;

        if (dist < 8 && elapsed < 300) {
            const captured = { ...mouseDownState };

            // Delay to disambiguate from double-click
            if (clickTimeout) clearTimeout(clickTimeout);
            clickTimeout = setTimeout(function () {
                handleNodeClick(captured.nodeId, captured.nodeType);
                clickTimeout = null;
            }, 250);
        }

        mouseDownState = null;
    });

    // Cancel pending click on double-click (built-in filtering takes over)
    graph.on('nodeDoubleClick', function () {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        }
    });
}

// --- Path Tracing ---

function handleNodeClick(nodeId, nodeType) {
    if (vulnMode) return; // vuln overlay takes priority

    graph.clearHighlights();

    if (nodeId === ROOT_ID) {
        showNodeInfoPanel(nodeId, nodeType);
        return;
    }

    // Highlight path from root to clicked node (forward BFS direction)
    const path = graph.highlightPath(ROOT_ID, nodeId, {
        pathColor: '#22d3ee',
        pathWidth: 3,
        animate: true
    });

    showNodeInfoPanel(nodeId, nodeType);

    if (path && path.length > 0) {
        showStatus('Dependency chain: ' + path.join(' \u2192 '));
    } else {
        showStatus('No direct chain found from root to ' + nodeId);
    }
}

// --- Vulnerability Overlay ---

function toggleVulnerabilities() {
    vulnMode = !vulnMode;
    const btn = document.getElementById('vuln-toggle');

    if (vulnMode) {
        btn.classList.add('active');
        btn.textContent = 'Hide Vulnerabilities';
        graph.clearHighlights();
        showVulnerabilities();
    } else {
        btn.classList.remove('active');
        btn.textContent = 'Show Vulnerabilities';
        clearVulnerabilities();
    }
}

function showVulnerabilities() {
    const vulnNodeIds = Object.keys(VULN_DATA);

    // Highlight each vulnerable node's chain from root
    vulnNodeIds.forEach(function (nodeId) {
        const severity = VULN_DATA[nodeId].severity;
        const color = severity === 'critical' ? '#ef4444' : '#f59e0b';

        graph.highlightPath(ROOT_ID, nodeId, {
            pathColor: color,
            pathWidth: severity === 'critical' ? 4 : 3,
            animate: true
        });
    });

    showStatus(
        'Showing ' +
            vulnNodeIds.length +
            ' known vulnerabilities — ' +
            vulnNodeIds
                .map(function (id) {
                    return id + ' (' + VULN_DATA[id].severity + ')';
                })
                .join(', ')
    );
}

function clearVulnerabilities() {
    graph.clearHighlights();
    hideStatus();
}

// --- Node Info Panel ---

function showNodeInfoPanel(nodeId, nodeType) {
    const info = document.getElementById('node-info');
    document.getElementById('info-name').textContent = nodeId;

    const typeLabels = {
        root: 'Root package',
        direct: 'Direct dependency',
        dev: 'Dev dependency',
        transitive: 'Transitive dependency'
    };
    document.getElementById('info-type').textContent = typeLabels[nodeType] || nodeType;

    const vulnEl = document.getElementById('info-vuln');
    if (VULN_DATA[nodeId]) {
        const v = VULN_DATA[nodeId];
        vulnEl.textContent = v.severity.toUpperCase() + ': ' + v.advisory;
        vulnEl.className =
            'node-info-vuln ' + (v.severity === 'critical' ? 'vuln-critical' : 'vuln-warning');
        vulnEl.style.display = 'block';
    } else {
        vulnEl.style.display = 'none';
    }

    info.style.display = 'block';
}

// --- Status Bar ---

function showStatus(msg) {
    const bar = document.getElementById('status-bar');
    bar.textContent = msg;
    bar.style.display = 'block';
}

function hideStatus() {
    document.getElementById('status-bar').style.display = 'none';
}

// --- Controls ---

function clearAllHighlights() {
    if (vulnMode) {
        toggleVulnerabilities();
    }
    graph.clearHighlights();
    document.getElementById('node-info').style.display = 'none';
    hideStatus();
}

// --- Instruction Panel ---

function setupInstructions() {
    if (localStorage.getItem('npm-explorer-instructions-dismissed')) {
        document.getElementById('instructions').style.display = 'none';
    }
}

function dismissInstructions() {
    document.getElementById('instructions').style.display = 'none';
    localStorage.setItem('npm-explorer-instructions-dismissed', 'true');
}

// Expose for HTML
window.initializeWhenReady = initializeWhenReady;
window.graph = graph;
window.toggleVulnerabilities = toggleVulnerabilities;
window.clearAllHighlights = clearAllHighlights;
window.dismissInstructions = dismissInstructions;
