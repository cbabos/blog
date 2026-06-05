---
title: 'The Orchestrator Pattern: Classifying and Routing AI Workflows'
description: 'A deep dive into the Orchestrator pattern — how incoming requests are classified, how workflows are selected, and how AI-powered execution is managed with human checkpoints along the way.'
pubDate: '2026-06-05 10:00'
tags: [Architecture, AI, Orchestrator, Patterns]
draft: false
---

# The Orchestrator Pattern: Classifying and Routing AI Workflows

When building AI-powered systems that go beyond simple chat, one of the first challenges is: **how do you make sense of what the user is asking for?**

This article explores the **Orchestrator pattern** — a central service that classifies incoming requests, selects the right workflow, and manages the execution lifecycle with appropriate checkpoints along the way. This pattern has proven useful across multiple AI development tools.

---

## The Classification Problem

Every request to such a system typically starts as unstructured text. A user might write:

> "The login button doesn't work on Safari and throws a console error"

or

> "Build a REST API for user management with JWT authentication, refresh tokens, and rate limiting"

These are fundamentally different tasks. The system needs to understand not just *what* is being asked, but *how complex* it is, *what domain* it belongs to, and *which workflow* would be appropriate.

The Orchestrator uses an LLM to extract structured data from this unstructured input:

```typescript
function buildClassificationPrompt(content: string): string {
  return `You are a task classifier. Analyze the following request and return a JSON object with these fields:
- taskType: one of "software_project", "bug_fix", "feature_addition", "investigation"
- complexity: one of "low", "medium", "high"
- domain: one of "web", "mobile", "api", "data", "general"
- keyRequirements: an array of key requirement strings extracted from the request
- suggestedPipelineId: leave as null unless you know a specific pipeline ID

Request content:
${content}

Return ONLY a valid JSON object with no additional text.`;
}
```

The LLM returns structured output that the system can act on:

```typescript
export const ClassificationResultSchema = z.object({
  taskType: z.string().min(1),
  complexity: z.enum(['low', 'medium', 'high']),
  domain: z.string().min(1),
  keyRequirements: z.array(z.string()).optional().default([]),
  suggestedPipelineId: z.string().optional(),
});
```

This is where the system gains intelligence. A "bug fix" triggers a different workflow than a "feature addition." A "high" complexity task routes to a pipeline with more checkpoints and human review points.

---

## Mapping External to Internal Types

There's an important separation between what the user sees and how the system represents work internally. The LLM classification is a starting point — it's designed to be understandable and consistent.

However, internal systems often need more granular categorization:

```typescript
const TASK_TYPE_MAP: Record<string, string> = {
  software_project: 'improvement',
  bug_fix: 'bug',
  feature_addition: 'feature',
  investigation: 'investigation',
};

const COMPLEXITY_MAP: Record<string, string> = {
  low: 'simple',
  medium: 'moderate',
  high: 'complex',
};
```

This separation provides several benefits:
- **Prompt simplicity** — fewer options in the LLM prompt means faster, more reliable responses
- **Internal flexibility** — internal taxonomy can evolve without changing prompts
- **Analytics capability** — granular internal types enable better tracking and reporting

---

## Workflow Selection Strategies

Once classified, the system must select an appropriate workflow. There are two primary approaches:

### Explicit Selection

Users can specify a workflow directly. This is useful when consistency matters — if a team has an established code review process, they can consistently route all "improvement" tasks through the same pipeline.

### Dynamic Selection

When no explicit choice is made, the system selects based on classification:
- Task type determines the basic workflow shape
- Complexity controls the number of checkpoints
- Domain influences tool and resource selection

This dynamic routing is what makes the system adaptive. A simple bug fix moves quickly through a lean pipeline; a complex feature addition proceeds through stages with explicit review points.

---

## Multi-Model Routing for Classification

Classification itself is an interesting problem. It requires a model that is:
- Fast enough to not slow down request handling
- Capable enough to extract meaningful structure
- Cost-effective for high-volume requests

The Orchestrator pattern typically supports multi-model routing:

```typescript
export interface OrchestratorConfig {
  classificationProvider: string;
  classificationModel: string;
  classificationTemperature: number;
  classificationMaxTokens: number;
}

const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  classificationProvider: process.env.LLM_PROVIDER ?? 'local-model',
  classificationModel: process.env.CLASSIFICATION_MODEL ?? 'fast-classifier',
  classificationTemperature: 0.1,
  // ...
};
```

This enables important patterns:
- **Local models** for cost-effective classification (smaller, faster models)
- **Cloud APIs** for complex cases where accuracy matters more than cost
- **Provider agnosticism** — swap providers based on availability, latency, or cost

---

## The Handoff to Execution

With classification complete and a workflow selected, the Orchestrator creates an execution context and hands off control to the pipeline executor. This handoff is a clean architectural boundary:

- The **Orchestrator** decides *what* to do and *how* to approach it
- The **Executor** handles *how* to do it step-by-step

The Orchestrator's job includes passing:
- Task data (the original request, structured)
- Workflow definition (which stages to execute, in what order)
- Classification metadata (complexity, domain) for downstream decisions

Once handed off, the Orchestrator steps back into a monitoring role — watching for failures that need intervention, but otherwise letting the execution proceed.

---

## The Value of Explicit Classification

Why not skip classification and let the execution pipeline figure things out?

The classification phase provides several architectural benefits:

### 1. Early Failure Detection
If the system can't classify a request, it can ask for clarification before any work begins — rather than halfway through execution.

### 2. Resource Planning
Understanding complexity upfront helps the system allocate appropriate resources. Simple tasks can use minimal compute; complex tasks can provision additional monitoring.

### 3. User Expectations
Clear classification helps users understand what's going to happen. When someone submits a "high complexity" task, they know to expect a longer process with review points.

### 4. Observability
Every request is classified and stored. Teams can audit how the system interpreted requests, measure classification accuracy over time, and identify patterns in user behavior.

---

## Lessons from Practice

Building systems around this pattern reveals several insights:

### Prompts Are Critical Code

The classification prompt is the most important code in the system. Small changes in wording can significantly affect output quality. This requires:
- Careful prompt engineering
- Output validation (Zod schemas catch malformed responses)
- A/B testing different prompt approaches

### Configuration Over Hardcoding

Classification models, providers, temperatures, and max tokens should be configurable. What's optimal changes as models evolve.

### Keep Prompts Focused

More instructions don't always mean better output. There's a point where prompts become confusing to models. Focus on what's essential for the classification task.

### Separate External and Internal Models

The model used for classification doesn't need to be the same as the model used for code generation. Each has different requirements.

---

## Looking Ahead

The Orchestrator pattern is just one piece of a larger system. The next architectural challenge is the **Pipeline Executor** — how to interpret workflow definitions, execute stages sequentially, and manage the flow of data between steps.

For teams building AI-powered development tools, the Orchestrator pattern provides a foundation for building systems that are both intelligent and predictable. Classification isn't just an afterthought — it's the cognitive layer that makes everything else work.

---

*This pattern has emerged from practical experience building AI-assisted development tools. If you're exploring similar territory, I'd love to hear about your approach.*