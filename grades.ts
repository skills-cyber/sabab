/** Sample grading scale (configurable per board/year in Settings — not hard-coded policy). */
export const gradeScale = [
{ min: 80, grade: 'A+', gp: 5.0 },
{ min: 70, grade: 'A', gp: 4.0 },
{ min: 60, grade: 'A-', gp: 3.5 },
{ min: 50, grade: 'B', gp: 3.0 },
{ min: 40, grade: 'C', gp: 2.0 },
{ min: 33, grade: 'D', gp: 1.0 },
{ min: 0, grade: 'F', gp: 0 }];


export function gradeFor(mark: number, total: number): {grade: string;gp: number;} {
  const p = total ? mark / total * 100 : 0;
  return gradeScale.find((g) => p >= g.min) ?? gradeScale[gradeScale.length - 1];
}

export function markStats(values: Array<number | null | undefined>, total: number) {
  const nums = values.filter((v): v is number => typeof v === 'number');
  const avg = nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : 0;
  return {
    entered: nums.length,
    avg: Math.round(avg * 10) / 10,
    high: nums.length ? Math.max(...nums) : 0,
    low: nums.length ? Math.min(...nums) : 0,
    passRate: nums.length ? Math.round(nums.filter((v) => v / total * 100 >= 33).length / nums.length * 100) : 0
  };
}