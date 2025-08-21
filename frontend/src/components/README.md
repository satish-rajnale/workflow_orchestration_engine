# 🏗️ Workflow Builder - Modular Architecture

## 📁 **Component Structure**

```
frontend/src/components/
├── Builder.tsx (Main orchestrator)
├── WorkflowHeader.tsx (Top header with save/run/delete)
├── LeftSidebar.tsx (Left sidebar container)
├── StepSelector.tsx (Add new steps)
├── TestPayloadPanel.tsx (Test payload management)
├── StepDebugPanel.tsx (Debug selected step data)
├── StepConfigPanel.tsx (Right sidebar - step configuration)
├── CustomNode.tsx (Enhanced node component)
└── README.md (This file)
```

## 🎯 **State Management Strategy**

### **1. Global State (Builder.tsx)**
```typescript
// Workflow-level state
const [name, setName] = useState("New Workflow");
const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
const [selectedStep, setSelectedStep] = useState<Node | null>(null);
const [testPayload, setTestPayload] = useState("");
const [isTesting, setIsTesting] = useState(false);
```

### **2. Local State (Individual Components)**
```typescript
// Component-specific state
const [isEditing, setIsEditing] = useState(false);
const [stepName, setStepName] = useState(data.label || id);
```

### **3. Event Handlers (Centralized)**
```typescript
// Centralized functions for node updates
const handleStepNameChange = (stepId: string, newName: string) => { ... };
const updateStepParams = (stepId: string, params: any) => { ... };
const onStepActionChange = (stepId: string, newAction: string) => { ... };
```

## 🔧 **How to Manage Node State**

### **1. Adding a New Step**
```typescript
const addStep = (action: string) => {
  const id = `step_${Date.now()}`;
  const newStep = {
    id,
    type: "custom",
    data: {
      label: id,
      step: { id, type: "action", action, params: {} },
      action: action,
      onStepNameChange: handleStepNameChange,
    },
    position: { x: 100 + nodes.length * 30, y: 100 + nodes.length * 30 },
  };
  setNodes((ns) => [...ns, newStep]);
};
```

### **2. Updating Step Parameters**
```typescript
const updateStepParams = (stepId: string, params: any) => {
  console.log("updateStepParams", stepId, params);
  setNodes((ns: any) =>
    (ns as any[]).map((n: any) =>
      n.id === stepId
        ? {
            ...n,
            data: {
              ...n.data,
              step: {
                ...n.data.step,
                params: {
                  ...n.data.step?.params,
                  ...params,
                },
              },
            },
          }
        : n
    )
  );
};
```

### **3. Changing Step Action Type**
```typescript
const onStepActionChange = (stepId: string, newAction: string) => {
  setNodes((ns: any) =>
    (ns as any[]).map((n: any) =>
      n.id === stepId
        ? {
            ...n,
            data: {
              ...n.data,
              step: {
                ...n.data.step,
                action: newAction,
                params: {}, // Reset params when action changes
              },
              action: newAction,
            },
          }
        : n
    )
  );
};
```

### **4. Updating Step Name**
```typescript
const handleStepNameChange = (stepId: string, newName: string) => {
  setNodes((ns: any) =>
    (ns as any[]).map((n: any) =>
      n.id === stepId
        ? {
            ...n,
            data: {
              ...n.data,
              label: newName,
              step: {
                ...n.data.step,
                id: newName,
              },
            },
          }
        : n
    )
  );
};
```

## 🎨 **Component Responsibilities**

### **WorkflowHeader.tsx**
- **Purpose**: Top header with workflow name, save, run, delete buttons
- **Props**: `name`, `onNameChange`, `onSave`, `onRun`, `onDelete`, `workflowId`
- **State**: None (controlled by parent)

### **LeftSidebar.tsx**
- **Purpose**: Container for all left sidebar components
- **Props**: All props from child components
- **State**: None (passes through to children)

### **StepSelector.tsx**
- **Purpose**: Add new steps to the workflow
- **Props**: `onAddStep`
- **State**: None (controlled by parent)

### **TestPayloadPanel.tsx**
- **Purpose**: Manage test payload for workflow testing
- **Props**: `testPayload`, `onTestPayloadChange`, `onGenerateSample`, `onTestWorkflow`, `isTesting`, `workflowId`
- **State**: None (controlled by parent)

### **StepDebugPanel.tsx**
- **Purpose**: Show selected step data for debugging
- **Props**: `selectedStep`
- **State**: None (controlled by parent)

### **StepConfigPanel.tsx**
- **Purpose**: Configure selected step parameters
- **Props**: `selectedStep`, `onStepNameChange`, `onStepActionChange`, `onStepParamsUpdate`
- **State**: None (controlled by parent)

### **CustomNode.tsx**
- **Purpose**: Display individual workflow steps
- **Props**: `data`, `id` (from React Flow)
- **State**: `isEditing`, `stepName` (local state for inline editing)

## 🔄 **Data Flow**

```
Builder.tsx (Global State)
    ↓
LeftSidebar.tsx (Container)
    ↓
StepSelector.tsx → addStep() → Builder.tsx
TestPayloadPanel.tsx → updateTestPayload() → Builder.tsx
StepDebugPanel.tsx → display selectedStep

Builder.tsx (Global State)
    ↓
StepConfigPanel.tsx (Right Sidebar)
    ↓
updateStepParams() → Builder.tsx
onStepActionChange() → Builder.tsx
handleStepNameChange() → Builder.tsx

Builder.tsx (Global State)
    ↓
CustomNode.tsx (Individual Nodes)
    ↓
onStepNameChange() → Builder.tsx
```

## 🎯 **Key Features**

### **1. Action Type Changing**
- ✅ Dropdown in StepConfigPanel to change action type
- ✅ Automatically resets parameters when action changes
- ✅ Updates both `step.action` and `action` properties

### **2. Parameter Management**
- ✅ Each action type has specific configuration
- ✅ Parameters are stored in `step.params`
- ✅ Real-time updates to node data

### **3. Inline Node Editing**
- ✅ Click on node name to edit inline
- ✅ Enter to save, blur to cancel
- ✅ Updates propagate to all components

### **4. Visual Feedback**
- ✅ Color-coded nodes by action type
- ✅ Icons for each action type
- ✅ Hover effects and visual states

## 🚀 **Usage Instructions**

### **1. Adding Steps**
1. Click on step buttons in left sidebar
2. Steps appear on canvas with default configuration
3. Click on step to configure it

### **2. Configuring Steps**
1. Select a step on the canvas
2. Right sidebar shows step configuration
3. Change action type using dropdown
4. Fill in action-specific parameters
5. Parameters are saved automatically

### **3. Editing Step Names**
1. Click on step name in node (inline editing)
2. Type new name
3. Press Enter or click outside to save

### **4. Testing Workflows**
1. Generate sample payload or enter custom JSON
2. Click "Test" button
3. Monitor execution in JobStatus component

## 🔧 **Extending the System**

### **Adding New Action Types**
1. Add to `STEP_TYPES` in `StepSelector.tsx`
2. Add icon to `ACTION_ICONS` in `CustomNode.tsx`
3. Add color to `ACTION_COLORS` in `CustomNode.tsx`
4. Add configuration component in `StepConfigPanel.tsx`
5. Add handler in `backend/app/services/actions.py`

### **Adding New Parameters**
1. Update configuration component in `StepConfigPanel.tsx`
2. Update `updateStepParams` call
3. Update backend action handler if needed

### **Adding New Components**
1. Create component file
2. Define TypeScript interface
3. Add to appropriate parent component
4. Pass necessary props from Builder.tsx

## 📊 **State Structure**

```typescript
// Node Data Structure
{
  id: "step_1234567890",
  type: "custom",
  data: {
    label: "My Step",
    step: {
      id: "My Step",
      type: "action",
      action: "email",
      params: {
        to: "user@example.com",
        subject: "Test Email",
        body: "Hello World"
      }
    },
    action: "email",
    onStepNameChange: function
  },
  position: { x: 100, y: 100 }
}
```

This modular architecture provides:
- ✅ **Separation of Concerns**: Each component has a single responsibility
- ✅ **Reusability**: Components can be reused in different contexts
- ✅ **Maintainability**: Easy to modify individual components
- ✅ **Scalability**: Easy to add new features and components
- ✅ **Type Safety**: Full TypeScript support with proper interfaces
- ✅ **State Management**: Clear data flow and state management patterns
