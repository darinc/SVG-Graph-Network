// Import the library for development
import GraphNetwork from '../src/index.ts';

// Make it available globally  
window.GraphNetwork = GraphNetwork;

console.log('Advanced example loaded');

// Initialize the graph when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Prevent multiple initializations (for HMR) with proper cleanup
    if (window.graph) {
        try {
            console.log('🧹 Cleaning up previous graph instance...');
            await window.graph.clearData({ animate: true, duration: 300 });
            window.graph.destroy();
            console.log('✅ Previous graph instance cleaned up');
        } catch (e) {
            console.log('⚠️ Previous graph cleanup skipped:', e.message);
        }
    }

    // Historical diplomatic network data from 1914
    const diplomaticNetwork1914 = {
        nodes: [
            // Major Powers
            { id: "germany", name: "German Empire", type: "major_power", shape: "rectangle", size: 50 },
            { id: "britain", name: "British Empire", type: "major_power", shape: "rectangle", size: 45 },
            { id: "france", name: "French Republic", type: "major_power", shape: "rectangle", size: 40 },
            { id: "russia", name: "Russian Empire", type: "major_power", shape: "rectangle", size: 45 },
            { id: "austria-hungary", name: "Austria-Hungary", type: "major_power", shape: "rectangle", size: 35 },
            
            // Regional Powers
            { id: "ottoman", name: "Ottoman Empire", type: "regional_power", shape: "rectangle", size: 30 },
            { id: "italy", name: "Kingdom of Italy", type: "regional_power", shape: "rectangle", size: 25 },
            { id: "serbia", name: "Kingdom of Serbia", type: "regional_power", shape: "rectangle", size: 20 },
            
            // Smaller Nations
            { id: "belgium", name: "Belgium", type: "small_nation", shape: "rectangle", size: 15 },
            { id: "bulgaria", name: "Bulgaria", type: "small_nation", shape: "rectangle", size: 18 },
            { id: "romania", name: "Romania", type: "small_nation", shape: "rectangle", size: 20 },
            { id: "montenegro", name: "Montenegro", type: "small_nation", shape: "rectangle", size: 12 },
            
            // Key Regions/Issues
            { id: "alsace-lorraine", name: "Alsace-Lorraine", type: "territory", shape: "rectangle", size: 25 },
            { id: "balkans", name: "Balkan Peninsula", type: "territory", shape: "rectangle", size: 30 },
            { id: "morocco", name: "Morocco", type: "territory", shape: "rectangle", size: 20 }
        ],
        links: [
            // Triple Alliance
            { source: "germany", target: "austria-hungary", label: "Triple Alliance", weight: 5, line_type: 'solid' },
            { source: "germany", target: "italy", label: "Triple Alliance", weight: 4, line_type: 'solid' },
            { source: "austria-hungary", target: "italy", label: "Triple Alliance", weight: 3, line_type: 'solid' },
            
            // Triple Entente
            { source: "france", target: "russia", label: "Franco-Russian Alliance", weight: 5, line_type: 'solid' },
            { source: "britain", target: "france", label: "Entente Cordiale", weight: 4, line_type: 'solid' },
            { source: "britain", target: "russia", label: "Anglo-Russian Entente", weight: 3, line_type: 'solid' },
            
            // Tensions and Rivalries
            { source: "germany", target: "france", label: "mutual hostility", weight: 4, line_type: 'dashed' },
            { source: "austria-hungary", target: "serbia", label: "annexation crisis", weight: 5, line_type: 'dashed' },
            { source: "russia", target: "austria-hungary", label: "Balkan rivalry", weight: 4, line_type: 'dashed' },
            { source: "germany", target: "britain", label: "naval arms race", weight: 3, line_type: 'dashed' },
            
            // Territorial Disputes
            { source: "france", target: "alsace-lorraine", label: "claims", weight: 5, line_type: 'dotted' },
            { source: "germany", target: "alsace-lorraine", label: "controls", weight: 5, line_type: 'solid' },
            { source: "russia", target: "balkans", label: "influence", weight: 4, line_type: 'dotted' },
            { source: "austria-hungary", target: "balkans", label: "controls", weight: 5, line_type: 'solid' },
            { source: "serbia", target: "balkans", label: "expansion", weight: 4, line_type: 'dotted' },
            
            // Colonial Rivalries
            { source: "germany", target: "morocco", label: "challenges", weight: 3, line_type: 'dashed' },
            { source: "france", target: "morocco", label: "protectorate", weight: 4, line_type: 'solid' },
            { source: "britain", target: "france", label: "supports in Morocco", weight: 2, line_type: 'dotted' },
            
            // Balkan Connections
            { source: "russia", target: "serbia", label: "Pan-Slavic support", weight: 4, line_type: 'solid' },
            { source: "serbia", target: "montenegro", label: "Slavic alliance", weight: 3, line_type: 'solid' },
            { source: "bulgaria", target: "austria-hungary", label: "alignment", weight: 2, line_type: 'dotted' },
            { source: "romania", target: "austria-hungary", label: "secret treaty", weight: 3, line_type: 'dotted' },
            
            // Guarantee and Protection
            { source: "britain", target: "belgium", label: "neutrality guarantee", weight: 4, line_type: 'solid' },
            { source: "germany", target: "ottoman", label: "military mission", weight: 3, line_type: 'dotted' }
        ]
    };

    // Modern European diplomatic network data (2024)
    const diplomaticNetwork2024 = {
        nodes: [
            // Major Powers
            { id: "usa", name: "United States", type: "major_power", shape: "rectangle", size: 55 },
            { id: "china", name: "China", type: "major_power", shape: "rectangle", size: 50 },
            { id: "russia", name: "Russia", type: "major_power", shape: "rectangle", size: 45 },
            { id: "germany", name: "Germany", type: "major_power", shape: "rectangle", size: 40 },
            { id: "france", name: "France", type: "major_power", shape: "rectangle", size: 35 },
            { id: "uk", name: "United Kingdom", type: "major_power", shape: "rectangle", size: 35 },
            
            // Regional Powers
            { id: "turkey", name: "Turkey", type: "regional_power", shape: "rectangle", size: 30 },
            { id: "italy", name: "Italy", type: "regional_power", shape: "rectangle", size: 25 },
            { id: "poland", name: "Poland", type: "regional_power", shape: "rectangle", size: 25 },
            { id: "spain", name: "Spain", type: "regional_power", shape: "rectangle", size: 20 },
            { id: "netherlands", name: "Netherlands", type: "regional_power", shape: "rectangle", size: 18 },
            
            // Smaller Nations
            { id: "ukraine", name: "Ukraine", type: "small_nation", shape: "rectangle", size: 25 },
            { id: "sweden", name: "Sweden", type: "small_nation", shape: "rectangle", size: 15 },
            { id: "norway", name: "Norway", type: "small_nation", shape: "rectangle", size: 12 },
            { id: "finland", name: "Finland", type: "small_nation", shape: "rectangle", size: 12 },
            { id: "czech", name: "Czech Republic", type: "small_nation", shape: "rectangle", size: 15 },
            { id: "greece", name: "Greece", type: "small_nation", shape: "rectangle", size: 15 },
            
            // Key Organizations/Issues
            { id: "nato", name: "NATO", type: "territory", shape: "rectangle", size: 40 },
            { id: "eu", name: "European Union", type: "territory", shape: "rectangle", size: 45 },
            { id: "energy", name: "Energy Security", type: "territory", shape: "rectangle", size: 25 },
            { id: "arctic", name: "Arctic Region", type: "territory", shape: "rectangle", size: 20 }
        ],
        links: [
            // NATO Alliance
            { source: "usa", target: "nato", label: "leads", weight: 6, line_type: 'solid' },
            { source: "uk", target: "nato", label: "member", weight: 5, line_type: 'solid' },
            { source: "france", target: "nato", label: "member", weight: 5, line_type: 'solid' },
            { source: "germany", target: "nato", label: "member", weight: 5, line_type: 'solid' },
            { source: "italy", target: "nato", label: "member", weight: 4, line_type: 'solid' },
            { source: "poland", target: "nato", label: "member", weight: 4, line_type: 'solid' },
            { source: "turkey", target: "nato", label: "member", weight: 4, line_type: 'solid' },
            { source: "netherlands", target: "nato", label: "member", weight: 3, line_type: 'solid' },
            { source: "norway", target: "nato", label: "member", weight: 3, line_type: 'solid' },
            { source: "czech", target: "nato", label: "member", weight: 3, line_type: 'solid' },
            { source: "greece", target: "nato", label: "member", weight: 3, line_type: 'solid' },
            
            // European Union
            { source: "germany", target: "eu", label: "leads", weight: 6, line_type: 'solid' },
            { source: "france", target: "eu", label: "leads", weight: 6, line_type: 'solid' },
            { source: "italy", target: "eu", label: "member", weight: 4, line_type: 'solid' },
            { source: "spain", target: "eu", label: "member", weight: 4, line_type: 'solid' },
            { source: "netherlands", target: "eu", label: "member", weight: 4, line_type: 'solid' },
            { source: "poland", target: "eu", label: "member", weight: 4, line_type: 'solid' },
            { source: "sweden", target: "eu", label: "member", weight: 3, line_type: 'solid' },
            { source: "finland", target: "eu", label: "member", weight: 3, line_type: 'solid' },
            { source: "czech", target: "eu", label: "member", weight: 3, line_type: 'solid' },
            { source: "greece", target: "eu", label: "member", weight: 3, line_type: 'solid' },
            
            // Major Power Relations
            { source: "usa", target: "uk", label: "special relationship", weight: 5, line_type: 'solid' },
            { source: "usa", target: "germany", label: "strategic partner", weight: 4, line_type: 'solid' },
            { source: "usa", target: "france", label: "alliance", weight: 4, line_type: 'solid' },
            { source: "usa", target: "china", label: "strategic competition", weight: 5, line_type: 'dashed' },
            { source: "usa", target: "russia", label: "adversarial", weight: 4, line_type: 'dashed' },
            
            // Tensions and Conflicts
            { source: "russia", target: "ukraine", label: "war", weight: 6, line_type: 'dashed' },
            { source: "nato", target: "russia", label: "deterrence", weight: 5, line_type: 'dashed' },
            { source: "china", target: "eu", label: "trade tensions", weight: 3, line_type: 'dashed' },
            { source: "turkey", target: "eu", label: "strained relations", weight: 3, line_type: 'dashed' },
            
            // Energy Dependencies
            { source: "germany", target: "energy", label: "vulnerability", weight: 4, line_type: 'dotted' },
            { source: "russia", target: "energy", label: "exports", weight: 5, line_type: 'solid' },
            { source: "norway", target: "energy", label: "supplies EU", weight: 4, line_type: 'solid' },
            
            // Support Networks
            { source: "usa", target: "ukraine", label: "military aid", weight: 5, line_type: 'solid' },
            { source: "eu", target: "ukraine", label: "support", weight: 4, line_type: 'solid' },
            { source: "poland", target: "ukraine", label: "border support", weight: 4, line_type: 'solid' },
            
            // Arctic Competition
            { source: "russia", target: "arctic", label: "expansion", weight: 4, line_type: 'solid' },
            { source: "norway", target: "arctic", label: "claims", weight: 3, line_type: 'solid' },
            { source: "usa", target: "arctic", label: "presence", weight: 3, line_type: 'dotted' },
            
            // Regional Partnerships
            { source: "germany", target: "france", label: "Franco-German axis", weight: 5, line_type: 'solid' },
            { source: "uk", target: "france", label: "post-Brexit cooperation", weight: 3, line_type: 'dotted' },
            { source: "poland", target: "czech", label: "Visegrad partnership", weight: 3, line_type: 'solid' },
            { source: "sweden", target: "finland", label: "Nordic cooperation", weight: 4, line_type: 'solid' },
            { source: "sweden", target: "norway", label: "Nordic cooperation", weight: 4, line_type: 'solid' },
            { source: "finland", target: "norway", label: "Nordic cooperation", weight: 3, line_type: 'solid' }
        ]
    };

    // Current era state
    let isModernEra = false;

    // Function to get current data and title based on era
    function getCurrentNetworkData() {
        return isModernEra ? diplomaticNetwork2024 : diplomaticNetwork1914;
    }
    
    function getCurrentTitle() {
        return isModernEra ? 'European Diplomatic Network 2024' : 'European Diplomatic Network 1914';
    }

    // Initialize the advanced graph with full features
    const graph = new GraphNetwork('graph-container', {
        data: getCurrentNetworkData(),
        config: {
            title: getCurrentTitle(),
            theme: 'dark',
            showControls: true,
            showLegend: true,
            showTitle: true,
            showBreadcrumbs: true,
            damping: 0.95,
            repulsionStrength: 6500,
            attractionStrength: 0.001,
            filterDepth: 1
        }
    });

    // Toggle functionality
    const eraCheckbox = document.getElementById('era-checkbox');
    const toggleSwitch = document.getElementById('toggle-switch');
    
    async function updateEra() {
        isModernEra = eraCheckbox.checked;
        
        // Update toggle visual state
        if (isModernEra) {
            toggleSwitch.classList.add('active');
        } else {
            toggleSwitch.classList.remove('active');
        }
        
        console.log(`Switching to ${isModernEra ? '2024' : '1914'} diplomatic network...`);
        
        // Use Phase 4 enhanced setData API with smooth transitions
        graph.setData(getCurrentNetworkData(), {
            animate: true,
            duration: 800,
            preservePositions: false,  // Allow new layout for different data
            layout: 'force-directed'   // Apply fresh layout
        });
        
        // Update configuration
        graph.updateConfig({ 
            title: getCurrentTitle() 
        });
        
        console.log(`✅ Successfully switched to ${isModernEra ? '2024' : '1914'} diplomatic network`);
    }
    
    // Add event listeners for toggle
    eraCheckbox.addEventListener('change', updateEra);
    toggleSwitch.addEventListener('click', () => {
        eraCheckbox.checked = !eraCheckbox.checked;
        updateEra();
    });

    // Event listeners for advanced interactions
    graph.on('nodeDoubleClick', (data) => {
        console.log(`🎯 Filtering by ${data.node.data.name}`);
    });

    graph.on('filtered', (data) => {
        console.log(`🔍 Graph filtered by ${data.nodeId}, showing ${data.visibleNodes.length} nodes`);
    });

    graph.on('filterReset', () => {
        console.log('🌐 Showing all nodes');
    });

    graph.on('themeChanged', (data) => {
        console.log(`🎨 Theme changed to ${data.theme}`);
    });

    graph.on('zoom', (data) => {
        console.log(`🔍 Zoomed to ${data.scale.toFixed(2)}x`);
    });
    
    // Showcase Phase 5 Selection & Highlighting APIs
    graph.on('nodeClick', (data) => {
        const nodeId = data.node.data.id;
        
        // Demo selection functionality
        if (graph.isNodeSelected(nodeId)) {
            graph.deselectNode(nodeId);
            console.log(`👋 Deselected ${data.node.data.name}`);
        } else {
            graph.selectNode(nodeId, { additive: true });
            console.log(`👆 Selected ${data.node.data.name}`);
        }
    });
    
    // Add keyboard shortcuts for advanced features
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            graph.deselectAll();
            graph.clearHighlights();
            console.log('🧹 Cleared all selections and highlights');
        } else if (e.key === 'h') {
            // Highlight neighbors of selected nodes
            const selected = graph.getSelectedNodes();
            if (selected.length > 0) {
                selected.forEach(nodeId => {
                    const neighbors = graph.highlightNeighbors(nodeId, {
                        depth: 1,
                        nodeColor: '#ffd700',
                        edgeColor: '#ffa500',
                        fadeOthers: true
                    });
                    console.log(`✨ Highlighted ${neighbors.length} neighbors of ${nodeId}`);
                });
            }
        } else if (e.key === 'p') {
            // Highlight path between first two selected nodes
            const selected = graph.getSelectedNodes();
            if (selected.length >= 2) {
                const path = graph.highlightPath(selected[0], selected[1], {
                    pathColor: '#ff6b6b',
                    pathWidth: 4,
                    animate: true
                });
                if (path) {
                    console.log(`🛤️ Highlighted path: ${path.join(' → ')}`);
                } else {
                    console.log('❌ No path found between selected nodes');
                }
            } else {
                console.log('ℹ️ Select at least 2 nodes to highlight path');
            }
        }
    });

    // Make graph available globally
    window.graph = graph;

    // Start the simulation  
    console.log('🌍 European Diplomatic Networks loaded (1914 & 2024)');
    console.log('');
    console.log('📱 BASIC INTERACTIONS:');
    console.log('  • Toggle: Switch between 1914 and 2024 eras');
    console.log('  • Double-click nodes: Filter by node relationships');
    console.log('  • Single-click nodes: Select/deselect (multi-select enabled)');
    console.log('  • Pan: Mouse drag on background');
    console.log('  • Zoom: Mouse wheel');
    console.log('');
    console.log('⌨️ ADVANCED KEYBOARD SHORTCUTS:');
    console.log('  • ESC: Clear all selections and highlights');
    console.log('  • H: Highlight neighbors of selected nodes');
    console.log('  • P: Highlight path between first two selected nodes');
    console.log('');
    console.log('🎛️ CONTROLS: Use the control panel to adjust physics parameters');
    console.log('📊 LEGEND: Shows node types and relationship meanings');
});