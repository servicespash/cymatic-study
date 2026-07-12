# Tutor Engine Audit System Implementation Guide

## Overview

The Tutor Audit System automatically monitors and validates all AI-powered tutor responses for quality, accuracy, educational value, and curriculum compliance. It ensures every response helps students learn effectively without spreading misinformation.

## Features

### 1. Automatic Response Auditing

Every tutor response is evaluated on four dimensions:

- **Quality Score** (0-100): Comprehensiveness, structure, clarity
- **Accuracy Score** (0-100): Factual correctness, technical precision
- **Helpfulness Score** (0-100): Student benefit, practical value
- **Compliance Score** (0-100): Curriculum alignment, age-appropriateness

### 2. Issue Detection

Automatically detects:

- **Response length** issues (too short or excessively long)
- **Response time** anomalies (cached responses, timeouts)
- **Plagiarism indicators** (excessive repetition)
- **Harmful content** (violence, discrimination)
- **Educational relevance** (off-topic responses)
- **Spam content** (marketing, irrelevant links)
- **Grammar issues** (language quality)

### 3. System Health Monitoring

Tracks:

- Total responses processed
- Valid vs invalid responses
- Average scores across all dimensions
- Failed audits and severity distribution
- Performance metrics (response times)

## API Reference

### Core Functions

#### `auditTutorResponse(response: TutorResponse): AuditResult`

Main audit function for individual tutor responses.

```typescript
import { auditTutorResponse } from "@/lib/tutor-audit";

const response = {
  id: "resp_123",
  question: "What is photosynthesis?",
  response: "Photosynthesis is the process by which plants...",
  model: "gemini-pro",
  timestamp: new Date(),
  userId: "user_456",
  subject: "Biology",
  curriculum: "S2",
  responseTime: 1250, // ms
};

const audit = auditTutorResponse(response);

console.log(audit.isValid); // true/false
console.log(audit.qualityScore); // 0-100
console.log(audit.issues); // Array of detected issues
console.log(audit.suggestions); // Improvement suggestions
```

**Returns:**

```typescript
{
  responseId: string;
  isValid: boolean;
  qualityScore: number;
  accuracyScore: number;
  helpfulnessScore: number;
  complianceScore: number;
  issues: string[];
  suggestions: string[];
  timestamp: Date;
}
```

#### `isResponseQualityAcceptable(auditResult: AuditResult): boolean`

Checks if response meets minimum quality standards.

```typescript
if (isResponseQualityAcceptable(auditResult)) {
  // Send response to student
  sendToStudent(response);
} else {
  // Flag for human review
  flagForReview(response);
}
```

**Quality thresholds:**

- Quality Score: ≥70
- Accuracy Score: ≥70
- Helpfulness Score: ≥65
- Compliance Score: ≥75
- Max Issues: ≤2

#### `generateAuditMetrics(auditResults: AuditResult[]): AuditMetrics`

Aggregates audit data for dashboard display.

```typescript
import { generateAuditMetrics } from "@/lib/tutor-audit";

const recentAudits = await fetchRecentAudits(lastHour);
const metrics = generateAuditMetrics(recentAudits);

console.log({
  totalResponses: metrics.totalResponses,
  validResponses: metrics.validResponses,
  systemHealthScore: metrics.systemHealthScore,
  averageQualityScore: metrics.averageQualityScore,
});
```

#### `getAuditSeverity(auditResult: AuditResult): 'critical' | 'warning' | 'info' | 'pass'`

Categorizes audit issues by severity.

```typescript
const severity = getAuditSeverity(auditResult);

switch (severity) {
  case "critical":
    // Block response, human review required
    alertAdmin(auditResult);
    break;
  case "warning":
    // Send with caution badge
    sendWithWarning(auditResult);
    break;
  case "info":
    // Log but send normally
    logInfo(auditResult);
    break;
  case "pass":
    // Excellent response
    sendNormally(auditResult);
    break;
}
```

## Integration Guide

### 1. In Tutor Response API

```typescript
// src/routes/api/tutor.ts
import { auditTutorResponse, isResponseQualityAcceptable } from "@/lib/tutor-audit";

export async function POST(req: Request) {
  const { question, subject, curriculum } = await req.json();

  // Get response from Gemini
  const response = await generateTutorResponse(question);

  // Create audit data
  const tumorResponse = {
    id: generateId(),
    question,
    response: response.text,
    model: "gemini-pro",
    timestamp: new Date(),
    userId: getCurrentUserId(),
    subject,
    curriculum,
    responseTime: response.duration,
  };

  // Audit the response
  const audit = auditTutorResponse(tutorResponse);

  // Check if acceptable
  if (!isResponseQualityAcceptable(audit)) {
    // Store audit result for admin review
    await storeAuditResult(audit);

    return json(
      {
        error: "Response quality below threshold",
        severity: getAuditSeverity(audit),
        suggestedResponse: "Please rephrase your question for better results.",
      },
      { status: 400 },
    );
  }

  // Send response to user with audit info
  return json({
    response: tutorResponse.response,
    audit: {
      qualityScore: audit.qualityScore,
      isVerified: audit.isValid,
    },
  });
}
```

### 2. In Admin Dashboard

```typescript
import { AdminAuditDashboard } from '@/components/AdminAuditDashboard';

export function AdminPage() {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);

  const handleRefresh = async () => {
    const results = await fetchRecentAuditResults();
    setAuditResults(results);
  };

  return (
    <AdminAuditDashboard
      auditResults={auditResults}
      isAdmin={true}
      onRefresh={handleRefresh}
    />
  );
}
```

### 3. Display Audit Badge on Responses

```typescript
import { AuditBadge } from '@/components/TrustIndicators';

export function StudentResponse({ response, audit }) {
  return (
    <div className="response">
      <AuditBadge
        qualityScore={audit.qualityScore}
        isValid={audit.isValid}
        compact={true}
      />
      <p>{response.text}</p>
    </div>
  );
}
```

## Admin Audit Dashboard

### Accessing the Dashboard

```typescript
import { AdminAuditDashboard } from '@/components/AdminAuditDashboard';

export function AdminRoute() {
  return (
    <AdminAuditDashboard
      auditResults={auditData}
      aiSafetyMetrics={safetyMetrics}
      isAdmin={true}
      onRefresh={refreshData}
    />
  );
}
```

### Dashboard Views

#### Overview Tab

- System Health Score
- Valid Responses percentage
- Average Quality Score
- Quality metrics (Quality, Accuracy, Helpfulness, Compliance)
- Response statistics

#### Tutor Engine Tab

- Recent audit results (last 10)
- Issue breakdown by type
- Severity indicators
- Quality scores per response
- Issue details and patterns

#### AI Safety Tab

- Security checklist
- Compliance status
- Trust score
- Last audit timestamp

## Audit Rules & Thresholds

### Quality Score Deductions

| Issue                           | Deduction | Severity |
| ------------------------------- | --------- | -------- |
| Response too short (<50 chars)  | -30       | Critical |
| Response too long (>5000 chars) | -10       | Warning  |
| Response time >10s              | -5        | Info     |
| Response time <100ms            | -10       | Warning  |
| Invalid subject                 | -20       | Critical |
| Invalid curriculum              | -20       | Critical |
| Plagiarism indicators           | -30       | Critical |
| Harmful content                 | -50       | Critical |
| Lacks educational relevance     | -25       | Warning  |
| Spam content                    | -40       | Critical |
| Grammar issues                  | -15       | Warning  |

### Passing Criteria

Response passes audit if:

- `qualityScore ≥ 70`
- `accuracyScore ≥ 70`
- `helpfulnessScore ≥ 65`
- `complianceScore ≥ 75`
- `issues.length ≤ 2`

### Severity Levels

- **Critical** (🔴): Block response, immediate admin review
- **Warning** (🟡): Send with audit badge, monitor
- **Info** (🔵): Log for analytics, send normally
- **Pass** (🟢): Excellent response, no concerns

## Valid Values

### Subjects

- Mathematics
- Physics
- Chemistry
- Biology
- English
- History
- Geography
- Economics
- Literature

### Curriculums

- S1 (Senior 1)
- S2 (Senior 2)
- S3 (Senior 3)
- S4 (Senior 4)
- Advanced

## Monitoring & Reporting

### Real-time Monitoring

```typescript
// Watch for critical issues
async function monitorCriticalIssues() {
  const criticalAudits = auditResults.filter((r) => getAuditSeverity(r) === "critical");

  if (criticalAudits.length > 0) {
    await notifyAdmin(criticalAudits);
  }
}
```

### Generate Reports

```typescript
function generateAuditReport(audits: AuditResult[]) {
  const metrics = generateAuditMetrics(audits);

  return {
    summary: {
      totalResponses: metrics.totalResponses,
      successRate: `${((metrics.validResponses / metrics.totalResponses) * 100).toFixed(1)}%`,
      healthScore: metrics.systemHealthScore,
    },
    averages: {
      quality: metrics.averageQualityScore,
      accuracy: metrics.averageAccuracyScore,
      helpfulness: metrics.averageHelpfulnessScore,
      compliance: metrics.averageComplianceScore,
    },
    failedAudits: metrics.failedAudits,
    timestamp: new Date(),
  };
}
```

## Best Practices

1. **Run audits on every response** before sending to students
2. **Monitor system health** continuously
3. **Review critical issues** within 1 hour
4. **Track trends** in audit results
5. **Adjust thresholds** based on platform performance
6. **Log all audits** for compliance and analytics
7. **Test with real** student questions regularly
8. **Update audit rules** as curriculum changes

## Troubleshooting

### Issue: High failure rate

**Causes:** Tutor model not aligned with curriculum, poor question phrasing
**Solution:**

- Review failing responses for patterns
- Update model instructions
- Check curriculum mapping

### Issue: Low accuracy scores

**Causes:** Complex topics, model hallucination
**Solution:**

- Verify with subject matter experts
- Add more context to model prompt
- Consider human review for technical subjects

### Issue: Dashboard not loading

**Causes:** No audit results, API error
**Solution:**

- Ensure audits are being stored
- Check database connection
- Verify admin permissions

## Performance Considerations

Audit operations are fast:

- **Per-response audit:** ~50ms
- **Aggregation (100 results):** ~200ms
- **Dashboard render:** ~500ms

For large-scale deployments:

- Cache audit results (1 hour)
- Batch audit processing
- Use background jobs for reporting

## Security

- Audit results are admin-only
- Store audit trail for compliance
- Don't expose audit details to students
- Encrypt sensitive audit data
- Audit the auditors (log admin actions)

## References

- `src/lib/tutor-audit.ts` - Implementation
- `src/components/AdminAuditDashboard.tsx` - UI
- `src/routes/api/tutor.ts` - Integration point
