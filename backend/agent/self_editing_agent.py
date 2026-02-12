from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

from backend.montage.assembler import Timeline, TimelineItem
from backend.providers.mock_provider import MockVideoProvider


@dataclass
class Issue:
    segment_index: int
    reason: str
    severity: str


class SelfEditingAgent:
    def __init__(self, mode: str = "fast", max_iterations: int | None = None) -> None:
        self.mode = mode
        self.max_iterations = max_iterations or (2 if mode == "fast" else 4)
        self.target_score = 75 if mode == "fast" else 84

    def improve(
        self,
        timeline: Timeline,
        audio_analysis: Dict,
        lyrics_summary: Dict,
        provider: MockVideoProvider,
        aspect_ratio: str,
        budget: int,
    ) -> Tuple[Timeline, Dict]:
        context = {
            "audio": audio_analysis,
            "lyrics": lyrics_summary,
        }
        best_timeline = timeline
        best_scorecard = self.evaluate(timeline, context)
        spent = 0
        iterations = [best_scorecard]

        for iteration in range(1, self.max_iterations + 1):
            if best_scorecard["total"] >= self.target_score:
                return best_timeline, self._report(iterations, spent, "passed")

            issues = [Issue(**x) for x in best_scorecard["issues"]]
            if not issues:
                return best_timeline, self._report(iterations, spent, "passed")

            edit_plan = self.propose_fixes(issues)
            estimated_cost = len(edit_plan["replace"])
            if spent + estimated_cost > budget:
                return best_timeline, self._report(iterations, spent, "budget_hit")

            candidate = self.apply_fixes(best_timeline, edit_plan, provider, aspect_ratio)
            spent += estimated_cost
            scorecard = self.evaluate(candidate, context)
            scorecard["iteration"] = iteration
            iterations.append(scorecard)

            if scorecard["total"] >= best_scorecard["total"]:
                best_timeline = candidate
                best_scorecard = scorecard

        status = "passed" if best_scorecard["total"] >= self.target_score else "iteration_limit"
        return best_timeline, self._report(iterations, spent, status)

    def evaluate(self, timeline: Timeline, context: Dict) -> Dict:
        relevance = self._relevance_score(timeline, context)
        continuity = self._continuity_score(timeline)
        variety = self._variety_score(timeline)
        pacing = self._pacing_score(timeline, context)
        technical = self._technical_score(timeline)
        total = int((relevance + continuity + variety + pacing + technical) / 5)
        issues = [issue.__dict__ for issue in self._detect_issues(timeline, context)]
        return {
            "total": total,
            "relevance": relevance,
            "continuity": continuity,
            "variety": variety,
            "pacing": pacing,
            "technical": technical,
            "issues": issues,
        }

    def propose_fixes(self, issues: List[Issue]) -> Dict:
        replace = []
        transition_adjust = []
        for issue in issues:
            if issue.reason in {"repetition", "low_relevance", "off_style"}:
                replace.append(issue.segment_index)
            if issue.reason in {"abrupt_transition", "off_beat"}:
                transition_adjust.append(issue.segment_index)
        return {
            "replace": sorted(set(replace)),
            "transition_adjust": sorted(set(transition_adjust)),
        }

    def apply_fixes(self, timeline: Timeline, edit_plan: Dict, provider: MockVideoProvider, aspect_ratio: str) -> Timeline:
        items: list[TimelineItem] = []
        for item in timeline.items:
            clip = item.clip
            transition = item.transition
            if item.segment.index in edit_plan["replace"]:
                new_seed = clip.seed + 29
                segment = item.segment
                segment.prompt = f"{segment.prompt}, refined continuity, stronger motif"
                clip = provider.regenerate_clip(segment, aspect_ratio, new_seed)
            if item.segment.index in edit_plan["transition_adjust"]:
                transition = "crossfade" if transition == "cut" else "cut"
            items.append(TimelineItem(segment=item.segment, clip=clip, transition=transition))
        return Timeline(items=items)

    def _detect_issues(self, timeline: Timeline, context: Dict) -> List[Issue]:
        issues: list[Issue] = []
        seen_hash: dict[str, int] = {}
        keywords = context.get("lyrics", {}).get("keywords", [])
        bpm = context.get("audio", {}).get("bpm", 120)
        beat_chunk = (60.0 / bpm) * 4

        for idx, item in enumerate(timeline.items):
            key = item.clip.visual_hash
            if key in seen_hash:
                issues.append(Issue(idx, "repetition", "medium"))
            seen_hash[key] = idx

            if keywords and not any(k in item.segment.prompt.lower() for k in keywords[:4]):
                issues.append(Issue(idx, "low_relevance", "high"))

            if abs(item.segment.duration - beat_chunk) > 1.2:
                issues.append(Issue(idx, "off_beat", "medium"))

            if idx > 0 and timeline.items[idx - 1].transition == "cut" and item.transition == "cut":
                if abs(item.segment.energy - timeline.items[idx - 1].segment.energy) > 0.35:
                    issues.append(Issue(idx, "abrupt_transition", "medium"))

        return issues

    def _relevance_score(self, timeline: Timeline, context: Dict) -> int:
        keywords = context.get("lyrics", {}).get("keywords", [])
        if not keywords:
            return 78
        hits = 0
        for item in timeline.items:
            if any(k in item.segment.prompt.lower() for k in keywords[:4]):
                hits += 1
        return max(50, min(100, int(55 + (hits / max(1, len(timeline.items))) * 45)))

    def _continuity_score(self, timeline: Timeline) -> int:
        if not timeline.items:
            return 0
        jolts = 0
        for i in range(1, len(timeline.items)):
            prev = timeline.items[i - 1]
            curr = timeline.items[i]
            if abs(prev.segment.energy - curr.segment.energy) > 0.4 and prev.transition == "cut":
                jolts += 1
        return max(55, 96 - jolts * 8)

    def _variety_score(self, timeline: Timeline) -> int:
        if not timeline.items:
            return 0
        unique_hashes = len({item.clip.visual_hash for item in timeline.items})
        ratio = unique_hashes / len(timeline.items)
        return max(45, min(100, int(40 + ratio * 60)))

    def _pacing_score(self, timeline: Timeline, context: Dict) -> int:
        bpm = context.get("audio", {}).get("bpm", 120)
        target = (60.0 / bpm) * 4
        if not timeline.items:
            return 0
        avg_dev = sum(abs(item.segment.duration - target) / target for item in timeline.items) / len(timeline.items)
        return max(55, min(100, int(100 - avg_dev * 75)))

    def _technical_score(self, timeline: Timeline) -> int:
        if not timeline.items:
            return 0
        missing = sum(1 for item in timeline.items if not item.clip.path.exists())
        duration = timeline.duration
        if missing:
            return 35
        if duration <= 0:
            return 30
        return 96

    def _report(self, iterations: List[Dict], spent: int, status: str) -> Dict:
        return {
            "status": status,
            "iterations": iterations,
            "spent_credits": spent,
            "initial_total": iterations[0]["total"],
            "final_total": iterations[-1]["total"],
            "improved": iterations[-1]["total"] > iterations[0]["total"],
            "self_editing_agent": "on",
        }
