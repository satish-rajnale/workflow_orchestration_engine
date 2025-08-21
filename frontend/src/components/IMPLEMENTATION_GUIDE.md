# 🔧 Implementation Guide: Updating Builder.tsx

## 📋 **Step-by-Step Implementation**

### **1. Replace Header Section**
Replace the existing header JSX with:
```tsx
<WorkflowHeader
  name={name}
  onNameChange={setName}
  onSave={save}
  onRun={run}
  onDelete={async () => {
    if (window.confirm("Are you sure you want to delete this workflow? This action cannot be undone.")) {
      try {
        await api.delete(`/workflows/${workflowId}`);
        setMessage("Workflow deleted successfully!");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } catch (e: any) {
        setMessage("Failed to delete workflow");
        setTimeout(() => setMessage(null), 2000);
      }
    }
  }}
  workflowId={workflowId}
/>
```

### **2. Replace Left Sidebar**
Replace the existing left sidebar JSX with:
```tsx
<LeftSidebar
  selectedStep={selectedStep}
  testPayload={testPayload}
  onAddStep={addStep}
  onTestPayloadChange={setTestPayload}
  onGenerateSample={generateSamplePayload}
  onTestWorkflow={testWorkflow}
  isTesting={isTesting}
  workflowId={workflowId}
/>
```

### **3. Replace Right Sidebar**
Replace the existing right sidebar JSX with:
```tsx
<StepConfigPanel
  selectedStep={selectedStep}
  onStepNameChange={handleStepNameChange}
  onStepActionChange={onStepActionChange}
  onStepParamsUpdate={updateStepParams}
/>
```

### **4. Add Missing Handler**
Add this handler function:
```tsx
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

### **5. Update Node Types**
Update the nodeTypes object:
```tsx
const nodeTypes = useMemo(
  () => ({
    custom: CustomNode,
  }),
  []
);
```

## 🎯 **Key Benefits After Implementation**

### **✅ Modularity**
- Each component has a single responsibility
- Easy to test individual components
- Clear separation of concerns

### **✅ Reusability**
- Components can be reused in other parts of the app
- Consistent UI patterns across the application
- Easy to maintain and update

### **✅ State Management**
- Clear data flow from parent to children
- Centralized state management in Builder.tsx
- Predictable state updates

### **✅ Type Safety**
- Full TypeScript support
- Proper interfaces for all props
- Compile-time error checking

### **✅ Maintainability**
- Easy to add new features
- Simple to modify existing functionality
- Clear component boundaries

## 🔄 **Data Flow After Implementation**

```
Builder.tsx (Global State)
├── WorkflowHeader (UI Controls)
├── LeftSidebar (Left Panel)
│   ├── StepSelector (Add Steps)
│   ├── TestPayloadPanel (Test Data)
│   └── StepDebugPanel (Debug Info)
├── ReactFlow (Canvas)
│   └── CustomNode (Individual Steps)
└── StepConfigPanel (Right Panel)
    └── Action-specific Configs
```

## 🚀 **Testing the Implementation**

### **1. Add Steps**
- Click step buttons in left sidebar
- Verify steps appear on canvas
- Check that step names are editable

### **2. Configure Steps**
- Select a step on canvas
- Verify right sidebar shows configuration
- Change action type using dropdown
- Fill in parameters and verify they save

### **3. Test Workflow**
- Generate sample payload
- Click test button
- Verify workflow execution

### **4. Debug Information**
- Select different steps
- Verify debug panel shows correct data
- Check that all parameters are visible

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **TypeScript Errors**
   - Ensure all imports are correct
   - Check that interfaces match component props
   - Verify React Flow types are properly imported

2. **State Not Updating**
   - Check that event handlers are properly passed
   - Verify state update functions are working
   - Ensure components are re-rendering

3. **Styling Issues**
   - Check Tailwind classes are correct
   - Verify component layout structure
   - Ensure responsive design works

4. **Performance Issues**
   - Use React.memo for expensive components
   - Optimize re-renders with useCallback
   - Check for unnecessary state updates

## 📚 **Next Steps**

After implementing the modular architecture:

1. **Add More Action Types**
   - Create new configuration components
   - Add backend handlers
   - Update step selector

2. **Enhance UI/UX**
   - Add animations
   - Improve visual feedback
   - Add keyboard shortcuts

3. **Add Advanced Features**
   - Step validation
   - Conditional logic
   - Error handling

4. **Performance Optimization**
   - Virtual scrolling for large workflows
   - Lazy loading of components
   - Memoization of expensive operations
