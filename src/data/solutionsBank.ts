import type { PlacementLanguage } from './onboardingData'

export type UnitSolution = {
  unitId: string
  title: string
  intuition: string
  approach: string[]
  complexity: {
    time: string
    space: string
  }
  implementations: Partial<Record<PlacementLanguage, string>>
}

const solutions: UnitSolution[] = [
  {
    unitId: 'dsa-two-sum',
    title: 'How to solve',
    intuition: 'As you scan numbers, store what you have seen in a hash map.',
    approach: [
      'Iterate once through the array.',
      'For each value x, compute need = target - x.',
      'If need is in the map, output the stored index and current index.',
      'Otherwise store x -> index and continue.',
    ],
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
    },
    implementations: {
      python: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for idx, value in enumerate(nums):
            need = target - value
            if need in seen:
                return [seen[need], idx]
            seen[value] = idx
        return []`,
      javascript: `class Solution {
  twoSum(nums, target) {
    const seen = new Map()
    for (let i = 0; i < nums.length; i += 1) {
      const need = target - nums[i]
      if (seen.has(need)) return [seen.get(need), i]
      seen.set(nums[i], i)
    }
    return []
  }
}`,
      cpp: `#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
  vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); i++) {
      int need = target - nums[i];
      auto it = seen.find(need);
      if (it != seen.end()) return {it->second, i};
      seen[nums[i]] = i;
    }
    return {};
  }
};`,
      java: `import java.util.HashMap;
import java.util.Map;

class Solution {
  public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int need = target - nums[i];
      if (seen.containsKey(need)) return new int[]{seen.get(need), i};
      seen.put(nums[i], i);
    }
    return new int[0];
  }
}`,
    },
  },
]

const solutionByUnitId = new Map(solutions.map((solution) => [solution.unitId, solution]))

export function getUnitSolution(unitId: string) {
  return solutionByUnitId.get(unitId) ?? null
}
