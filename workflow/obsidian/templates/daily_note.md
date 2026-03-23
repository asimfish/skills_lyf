---
date: {{date}}
tags: [daily, agent-workflow]
---

# {{date}} 日报

## 今日任务
```dataview
TABLE task_id, finished_at
FROM "agent-workflow/{{date}}"
SORT finished_at ASC
```

## 待处理
- [ ]

## 完成
- [x]

## 笔记

