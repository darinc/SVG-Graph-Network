import { GraphNetwork } from './GraphNetwork';
import { Vector } from './Vector';
import { Node } from './Node';
import './styles.css';

// Export the main class as default
export default GraphNetwork;

// Export individual classes for advanced usage
export { GraphNetwork, Vector, Node };

// Export all type definitions for TypeScript users
export type {
    // Core data types
    NodeData,
    LinkData,
    GraphData,
    EdgeData,

    // Configuration types
    GraphConfig,
    PhysicsConfig,
    UIConfig,
    InteractionConfig,

    // Runtime types
    Position,
    TransformState,
    Bounds,

    // Event types
    BaseEvent,
    NodeEvent,
    LinkEvent,
    ViewEvent,
    FilterEvent,
    DataEvent,
    ThemeEvent,
    GraphEvent,

    // Callback types
    EventCallback,
    Callback,
    ParameterCallback,

    // Operation types
    NodeCreationOptions,
    EdgeCreationOptions,
    DeletionOptions,
    BulkUpdateOptions,
    DataReplacementOptions,
    DataMergeOptions,

    // Update types
    ConfigUpdate,
    NodeUpdate,
    LinkUpdate,

    // Utility types
    EventType,

    // Module-specific types
    SVGElements,
    UIElements
} from './types/index';

// Export theming types
export type {
    ThemeConfig,
    NodeStyleConfig,
    EdgeStyleConfig,
    CanvasConfig,
    StateStyles,
    ColorScheme,
    VisualState
} from './theming/ThemeManager';

// Export styling types
export type {
    NodeStyles,
    EdgeStyles,
    StyleObject,
    ElementSelector,
    HighlightStyle
} from './types/styling';
