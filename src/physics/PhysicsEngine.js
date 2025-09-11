import { Vector } from '../Vector.js';

/**
 * PhysicsEngine - Handles force calculations and position updates for graph nodes
 * Extracted from monolithic GraphNetwork class for better separation of concerns
 */
export class PhysicsEngine {
    constructor(config = {}) {
        this.config = {
            damping: 0.95,
            repulsionStrength: 6500,
            attractionStrength: 0.001,
            groupingStrength: 0.001,
            ...config
        };
    }

    /**
     * Update configuration parameters
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Calculate repulsion and attraction forces for all nodes
     * @param {Map} nodes - Map of nodes by ID
     * @param {Array} links - Array of link objects
     * @param {Set} filteredNodes - Set of visible node IDs (null = all visible)
     */
    updateForces(nodes, links, filteredNodes = null) {
        const nodesArray = Array.from(nodes.values());
        
        // Reset forces
        nodesArray.forEach(node => node.force = new Vector());

        // Calculate repulsion forces between all node pairs
        for (let i = 0; i < nodesArray.length; i++) {
            for (let j = i + 1; j < nodesArray.length; j++) {
                const nodeA = nodesArray[i];
                const nodeB = nodesArray[j];
                
                // Skip filtered out nodes
                if (filteredNodes && 
                    (!filteredNodes.has(nodeA.data.id) || !filteredNodes.has(nodeB.data.id))) {
                    continue;
                }

                this._calculateRepulsionForce(nodeA, nodeB);
                this._calculateGroupingForce(nodeA, nodeB);
            }
        }

        // Calculate attraction forces for connected nodes
        links.forEach(link => {
            if (filteredNodes && 
                (!filteredNodes.has(link.source.data.id) || !filteredNodes.has(link.target.data.id))) {
                return;
            }
            
            this._calculateAttractionForce(link.source, link.target);
        });
    }

    /**
     * Update node positions based on calculated forces
     * @param {Map} nodes - Map of nodes by ID  
     * @param {Set} filteredNodes - Set of visible node IDs (null = all visible)
     */
    updatePositions(nodes, filteredNodes = null) {
        const dt = 1;
        const nodesArray = Array.from(nodes.values());

        nodesArray.forEach(node => {
            // Skip fixed nodes or filtered out nodes
            if (node.isFixed) return;
            if (filteredNodes && !filteredNodes.has(node.data.id)) return;
            
            // Apply physics: F = ma, integrate velocity and position
            node.velocity = node.velocity.add(node.force.multiply(dt));
            node.velocity = node.velocity.multiply(this.config.damping);
            node.position = node.position.add(node.velocity.multiply(dt));
        });
    }

    /**
     * Calculate repulsion force between two nodes
     * @private
     */
    _calculateRepulsionForce(nodeA, nodeB) {
        const diff = nodeA.position.subtract(nodeB.position);
        const distance = diff.magnitude();
        
        if (distance === 0) return;
        
        const repulsionForce = diff.normalize().multiply(
            this.config.repulsionStrength / (distance * distance)
        );
        
        nodeA.force = nodeA.force.add(repulsionForce);
        nodeB.force = nodeB.force.subtract(repulsionForce);
    }

    /**
     * Calculate grouping force for nodes of the same type
     * @private
     */
    _calculateGroupingForce(nodeA, nodeB) {
        if (nodeA.data.type === nodeB.data.type && this.config.groupingStrength > 0) {
            const diff = nodeA.position.subtract(nodeB.position);
            const distance = diff.magnitude();
            
            if (distance === 0) return;
            
            const attractionForce = diff.normalize().multiply(
                -this.config.groupingStrength * distance
            );
            
            nodeA.force = nodeA.force.add(attractionForce);
            nodeB.force = nodeB.force.subtract(attractionForce);
        }
    }

    /**
     * Calculate attraction force between connected nodes
     * @private
     */
    _calculateAttractionForce(sourceNode, targetNode) {
        const diff = sourceNode.position.subtract(targetNode.position);
        const distance = diff.magnitude();
        
        if (distance === 0) return;
        
        const attractionForce = diff.normalize().multiply(
            this.config.attractionStrength * distance
        );
        
        sourceNode.force = sourceNode.force.subtract(attractionForce);
        targetNode.force = targetNode.force.add(attractionForce);
    }

    /**
     * Get current physics configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Reset all forces to zero for given nodes
     */
    resetForces(nodes) {
        const nodesArray = Array.from(nodes.values());
        nodesArray.forEach(node => node.force = new Vector());
    }
}