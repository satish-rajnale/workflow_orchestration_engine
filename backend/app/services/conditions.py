from __future__ import annotations
from typing import Any, Dict, List
import re

# Simple condition DSL evaluator
# Examples:
# {"op": "and", "conditions": [ {"op": "eq", "path": "lead.source", "value": "LinkedIn"}, {"op": "gt", "path": "lead.score", "value": 75} ]}
# {"op": "contains", "path": "lead.title", "value": "CEO"}


def get_value_by_path(data: Dict[str, Any], path: str) -> Any:
    cur: Any = data
    for part in path.split('.'):
        if isinstance(cur, dict):
            cur = cur.get(part)
        else:
            return None
    return cur


def evaluate_condition(cond: Dict[str, Any], context: Dict[str, Any]) -> bool:
    op = (cond or {}).get('op')
    if op in ('and', 'or'):
        conditions: List[Dict[str, Any]] = cond.get('conditions', [])
        results = [evaluate_condition(c, context) for c in conditions]
        return all(results) if op == 'and' else any(results)
    if op == 'not':
        return not evaluate_condition(cond.get('condition', {}), context)

    path = cond.get('path')
    left = get_value_by_path(context, path) if path else None
    value = cond.get('value')

    if op == 'eq':
        return left == value
    if op == 'neq':
        return left != value
    if op == 'gt':
        try:
            return float(left) > float(value)
        except Exception:
            return False
    if op == 'gte':
        try:
            return float(left) >= float(value)
        except Exception:
            return False
    if op == 'lt':
        try:
            return float(left) < float(value)
        except Exception:
            return False
    if op == 'lte':
        try:
            return float(left) <= float(value)
        except Exception:
            return False
    if op == 'contains':
        try:
            return str(value).lower() in str(left).lower()
        except Exception:
            return False
    if op == 'regex':
        try:
            return re.search(str(value), str(left)) is not None
        except Exception:
            return False

    # default: if missing op, treat as truthy value
    return bool(cond)
