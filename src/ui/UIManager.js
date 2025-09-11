/**
 * UIManager - Handles creation and management of all UI elements
 * Extracted from monolithic GraphNetwork class for better separation of concerns
 */
export class UIManager {
    constructor(container, config = {}, callbacks = {}) {
        this.container = container;
        this.config = config;
        this.callbacks = callbacks;
        
        // UI element references
        this.titleElement = null;
        this.breadcrumbsElement = null;
        this.legendElement = null;
        this.controls = null;
        this.settingsPanel = null;
        this.mobileControls = null;
        
        // Control button references
        this.zoomInButton = null;
        this.zoomOutButton = null;
        this.resetButton = null;
        this.themeToggle = null;
        this.settingsToggle = null;
        
        // Settings state
        this.settingsVisible = false;
    }

    /**
     * Initialize all UI components
     */
    initialize() {
        this.createTitle();
        this.createBreadcrumbs();
        this.createLegend();
        this.createControls();
        this.createSettingsPanel();
    }

    /**
     * Safely set a class name on an element, avoiding readonly property issues
     */
    setElementClass(element, className) {
        try {
            element.className = className;
        } catch (error) {
            // Fallback to classList if className is readonly
            element.classList.add(className);
        }
    }

    /**
     * Create title element
     */
    createTitle() {
        if (!this.config.showTitle) return;
        
        this.titleElement = document.createElement('h2');
        this.setElementClass(this.titleElement, 'graph-network-title');
        this.titleElement.textContent = this.config.title || 'Graph Network';
        this.container.appendChild(this.titleElement);
    }

    /**
     * Create breadcrumbs navigation
     */
    createBreadcrumbs() {
        if (!this.config.showBreadcrumbs) return;
        
        this.breadcrumbsElement = document.createElement('div');
        this.setElementClass(this.breadcrumbsElement, 'graph-network-breadcrumbs');
        this.container.appendChild(this.breadcrumbsElement);
    }

    /**
     * Generate legend items from unique node types
     */
    generateLegendItems(nodes) {
        const nodeTypes = new Set();
        const typeInfo = new Map();

        nodes.forEach(node => {
            const type = node.data.type;
            if (type && !nodeTypes.has(type)) {
                nodeTypes.add(type);
                typeInfo.set(type, {
                    type: type,
                    shape: node.data.shape || 'circle',
                    // Use first node of this type as representative
                    color: this.getNodeTypeColor(type)
                });
            }
        });

        return Array.from(typeInfo.values());
    }

    /**
     * Get color for node type
     */
    getNodeTypeColor(type) {
        const colorMap = {
            'primary': '#E53E3E',
            'secondary': '#4299E1', 
            'tertiary': '#38A169',
            'auxiliary': '#ED8936',
            // Fallback for legacy types
            'major_power': '#E53E3E',
            'regional_power': '#4299E1',
            'small_nation': '#38A169',
            'territory': '#ED8936'
        };
        return colorMap[type] || '#666666';
    }

    /**
     * Create and update legend
     */
    createLegend(nodes = []) {
        if (!this.config.showLegend) return;
        
        if (!this.legendElement) {
            this.legendElement = document.createElement('div');
            this.setElementClass(this.legendElement, 'graph-network-legend');
            
            const header = document.createElement('div');
            this.setElementClass(header, 'graph-network-legend-header');
            header.textContent = 'Node Types';
            
            const toggleButton = document.createElement('button');
            this.setElementClass(toggleButton, 'graph-network-legend-toggle');
            toggleButton.textContent = '−';
            toggleButton.addEventListener('click', () => this.toggleLegend());
            
            header.appendChild(toggleButton);
            this.legendElement.appendChild(header);
            
            const content = document.createElement('div');
            this.setElementClass(content, 'graph-network-legend-content');
            this.legendElement.appendChild(content);
            
            this.container.appendChild(this.legendElement);
        }

        this.updateLegend(nodes);
    }

    /**
     * Update legend content with current nodes
     */
    updateLegend(nodes) {
        if (!this.legendElement) return;
        
        const content = this.legendElement.querySelector('.graph-network-legend-content');
        if (!content) return;
        
        const legendItems = this.generateLegendItems(nodes);
        content.innerHTML = '';
        
        legendItems.forEach(item => {
            const legendItem = document.createElement('div');
            this.setElementClass(legendItem, 'graph-network-legend-item');
            
            const shape = document.createElement('div');
            this.setElementClass(shape, `graph-network-legend-shape graph-network-legend-${item.shape}`);
            shape.style.backgroundColor = item.color;
            
            const label = document.createElement('span');
            label.textContent = item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            legendItem.appendChild(shape);
            legendItem.appendChild(label);
            content.appendChild(legendItem);
        });
    }

    /**
     * Toggle legend visibility
     */
    toggleLegend() {
        if (!this.legendElement) return;
        
        const toggleButton = this.legendElement.querySelector('.graph-network-legend-toggle');
        const isMinimized = this.legendElement.classList.contains('minimized');
        
        if (isMinimized) {
            this.legendElement.classList.remove('minimized');
            toggleButton.textContent = '−';
        } else {
            this.legendElement.classList.add('minimized');
            toggleButton.textContent = '+';
        }
    }

    /**
     * Create control buttons
     */
    createControls() {
        if (!this.config.showControls) return;
        
        this.controls = document.createElement('div');
        this.setElementClass(this.controls, 'graph-network-controls');
        
        // Mobile zoom controls (hidden on desktop via CSS)
        this.mobileControls = document.createElement('div');
        this.setElementClass(this.mobileControls, 'graph-network-mobile-controls');
        
        // Create zoom buttons
        this.createZoomButtons();
        
        // Create utility buttons
        this.createUtilityButtons();
        
        this.controls.appendChild(this.mobileControls);
        this.controls.appendChild(this.themeToggle);
        this.controls.appendChild(this.settingsToggle);
        this.container.appendChild(this.controls);
    }

    /**
     * Create zoom control buttons
     */
    createZoomButtons() {
        // Zoom in button
        this.zoomInButton = document.createElement('button');
        this.setElementClass(this.zoomInButton, 'graph-network-zoom-button graph-network-zoom-in');
        this.zoomInButton.textContent = '+';
        this.zoomInButton.addEventListener('click', () => {
            if (this.callbacks.onZoomIn) this.callbacks.onZoomIn();
        });
        
        // Zoom out button
        this.zoomOutButton = document.createElement('button');
        this.setElementClass(this.zoomOutButton, 'graph-network-zoom-button graph-network-zoom-out');
        this.zoomOutButton.textContent = '−';
        this.zoomOutButton.addEventListener('click', () => {
            if (this.callbacks.onZoomOut) this.callbacks.onZoomOut();
        });
        
        // Reset view button
        this.resetButton = document.createElement('button');
        this.setElementClass(this.resetButton, 'graph-network-reset-view-button');
        this.resetButton.textContent = '⊙';
        this.resetButton.addEventListener('click', () => {
            if (this.callbacks.onResetView) this.callbacks.onResetView();
        });
        
        this.mobileControls.appendChild(this.zoomInButton);
        this.mobileControls.appendChild(this.zoomOutButton);
        this.mobileControls.appendChild(this.resetButton);
    }

    /**
     * Create utility buttons (theme, settings)
     */
    createUtilityButtons() {
        // Theme toggle
        this.themeToggle = document.createElement('button');
        this.setElementClass(this.themeToggle, 'graph-network-theme-toggle');
        this.themeToggle.textContent = this.config.theme === 'light' ? '🌙' : '🌞';
        this.themeToggle.addEventListener('click', () => {
            if (this.callbacks.onToggleTheme) this.callbacks.onToggleTheme();
        });
        
        // Settings toggle
        this.settingsToggle = document.createElement('button');
        this.setElementClass(this.settingsToggle, 'graph-network-settings-toggle');
        this.settingsToggle.textContent = '^';
        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
    }

    /**
     * Create settings panel
     */
    createSettingsPanel() {
        if (!this.config.showControls) return;
        
        this.settingsPanel = document.createElement('div');
        this.setElementClass(this.settingsPanel, 'graph-network-settings');
        
        const title = document.createElement('h3');
        title.textContent = 'Physics Settings';
        this.settingsPanel.appendChild(title);
        
        // Create physics control sliders
        this.createPhysicsControls();
        
        this.container.appendChild(this.settingsPanel);
    }

    /**
     * Create physics control sliders
     */
    createPhysicsControls() {
        const controls = [
            { 
                key: 'damping', 
                label: 'Damping', 
                min: 0.1, 
                max: 1.0, 
                step: 0.01,
                description: 'Velocity decay factor'
            },
            { 
                key: 'repulsionStrength', 
                label: 'Repulsion', 
                min: 1000, 
                max: 20000, 
                step: 100,
                description: 'Node repulsion force'
            },
            { 
                key: 'attractionStrength', 
                label: 'Attraction', 
                min: 0.0001, 
                max: 0.01, 
                step: 0.0001,
                description: 'Link attraction force'
            },
            { 
                key: 'groupingStrength', 
                label: 'Grouping', 
                min: 0, 
                max: 0.01, 
                step: 0.0001,
                description: 'Same-type grouping force'
            }
        ];

        controls.forEach(control => {
            const controlDiv = document.createElement('div');
            this.setElementClass(controlDiv, 'graph-network-control');
            
            const label = document.createElement('label');
            label.textContent = control.label;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = control.min;
            slider.max = control.max;
            slider.step = control.step;
            slider.value = this.config[control.key];
            
            const value = document.createElement('span');
            this.setElementClass(value, 'graph-network-control-value');
            value.textContent = this.config[control.key];
            
            slider.addEventListener('input', (e) => {
                const newValue = parseFloat(e.target.value);
                value.textContent = newValue;
                if (this.callbacks.onConfigChange) {
                    this.callbacks.onConfigChange(control.key, newValue);
                }
            });
            
            controlDiv.appendChild(label);
            controlDiv.appendChild(slider);
            controlDiv.appendChild(value);
            this.settingsPanel.appendChild(controlDiv);
        });
    }

    /**
     * Toggle settings panel visibility
     */
    toggleSettings() {
        if (!this.settingsPanel) return;
        
        this.settingsVisible = !this.settingsVisible;
        this.settingsPanel.style.display = this.settingsVisible ? 'block' : 'none';
        this.settingsToggle.textContent = this.settingsVisible ? 'v' : '^';
    }

    /**
     * Update theme toggle button appearance
     */
    updateThemeToggle(theme) {
        if (this.themeToggle) {
            this.themeToggle.textContent = theme === 'light' ? '🌙' : '🌞';
        }
    }

    /**
     * Render breadcrumbs navigation
     */
    renderBreadcrumbs(path) {
        if (!this.breadcrumbsElement) return;
        
        this.breadcrumbsElement.innerHTML = '';
        
        path.forEach((item, index) => {
            if (index > 0) {
                const separator = document.createElement('span');
                this.setElementClass(separator, 'graph-network-breadcrumb-separator');
                separator.textContent = ' > ';
                this.breadcrumbsElement.appendChild(separator);
            }
            
            const breadcrumb = document.createElement('span');
            this.setElementClass(breadcrumb, 'graph-network-breadcrumb');
            if (index === path.length - 1) {
                breadcrumb.classList.add('active');
            }
            breadcrumb.textContent = item.name;
            breadcrumb.addEventListener('click', () => {
                if (item.action && this.callbacks.onBreadcrumbClick) {
                    this.callbacks.onBreadcrumbClick(item.action);
                }
            });
            this.breadcrumbsElement.appendChild(breadcrumb);
        });
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Clean up UI elements
     */
    destroy() {
        // Remove all created elements
        [this.titleElement, this.breadcrumbsElement, this.legendElement, 
         this.controls, this.settingsPanel].forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Clear references
        this.titleElement = null;
        this.breadcrumbsElement = null;
        this.legendElement = null;
        this.controls = null;
        this.settingsPanel = null;
        this.mobileControls = null;
        this.zoomInButton = null;
        this.zoomOutButton = null;
        this.resetButton = null;
        this.themeToggle = null;
        this.settingsToggle = null;
    }
}